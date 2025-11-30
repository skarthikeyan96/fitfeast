import type { NextApiRequest, NextApiResponse } from "next";

// Simple in-memory rate limiting per process to protect Yelp AI usage.
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQ_PER_WINDOW = 10;
const rateLimitStore = new Map<
  string,
  { count: number; windowStart: number }
>();

export type SearchRestaurantsRequest = {
  location: string;
  caloriesTarget: number;
  proteinMin: number;
  diet?: string | null;
  query: string;
  radiusMeters?: number;
  priceLevels?: number[];
  mealType?: "breakfast" | "lunch" | "dinner" | "snack";
};

export type DishOption = {
  name: string;
  description?: string;
  estimatedCalories: number;
  estimatedProtein: number;
  estimatedCarbs?: number;
  estimatedFat?: number;
  confidence: number; // 0–1
};

export type RestaurantOption = {
  id: string;
  name: string;
  rating: number;
  price?: string;
  distanceMeters?: number;
  url?: string;
  imageUrl?: string;
  address?: string;
  dishes: DishOption[];
  /** 0–100 score indicating how well this place matches the user's macro target. */
  fitScore: number;
  /** Short label for the fit score, e.g. "Perfect fit", "Good fit". */
  fitLabel: string;
  reason: string;
  /** Breakdown of the Perfect Fit Score 2.0 components */
  scoreBreakdown?: {
    macroFitScore: number;
    distanceScore: number;
    aiConfidenceScore: number;
    mealTypeScore: number;
  };
};

export type SearchRestaurantsResponse = {
  restaurants: RestaurantOption[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SearchRestaurantsResponse | { error: string }>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const {
      location,
      caloriesTarget,
      proteinMin,
      diet,
      query,
      radiusMeters,
      priceLevels,
      mealType = "lunch",
    } = req.body as SearchRestaurantsRequest;

    // Apply naive IP-based rate limiting.
    const ip =
      (req.headers["x-forwarded-for"] as string | undefined)
        ?.split(",")[0]
        ?.trim() ||
      req.socket.remoteAddress ||
      "unknown";

    const now = Date.now();
    const existing = rateLimitStore.get(ip) ?? {
      count: 0,
      windowStart: now,
    };

    if (now - existing.windowStart > WINDOW_MS) {
      existing.count = 0;
      existing.windowStart = now;
    }

    existing.count += 1;
    rateLimitStore.set(ip, existing);

    if (existing.count > MAX_REQ_PER_WINDOW) {
      return res
        .status(429)
        .json({ error: "Rate limit exceeded. Please try again in a moment." });
    }

    if (!location || !caloriesTarget || !proteinMin || !query) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const apiKey = process.env.YELP_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing YELP_API_KEY" });
    }

    // TODO: Integrate Yelp AI API here.
    // For now, use a basic call to Yelp AI chat endpoint and map businesses.

    // NOTE: For demo purposes, we use fixed coordinates (San Francisco).
    // Later we can geocode the user-provided location string.
    const latitude = 37.7749;
    const longitude = -122.4194;

    const yelpResponse = await fetch("https://api.yelp.com/ai/chat/v2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `You are FeastFit, a fitness nutrition guide. Recommend nearby restaurants that are macro-friendly and work well for someone tracking calories and protein.

Target for this single meal: about ${caloriesTarget} calories and at least ${proteinMin}g protein.
Dietary preference: ${diet || "none specified"}.

Prioritize:
- higher-protein mains (grilled or lean meats, fish, tofu, legumes)
- bowls, plates, or salads with a clear protein anchor
- fewer deep-fried or ultra-heavy options by default

User is in the mood for: "${query}".

For each recommended restaurant, also describe ONE specific macro-friendly dish or way to order there (for example, "grilled chicken bowl with extra veggies, light sauce") and briefly explain why it fits the calorie/protein goal with a rough qualitative macro estimate (e.g. "roughly 550–650 kcal, 35–45g protein").

Return businesses that are a good fit for this goal and craving.`,
        user_context: {
          locale: "en_US",
          latitude,
          longitude,
        },
      }),
    });

    if (!yelpResponse.ok) {
      const text = await yelpResponse.text();
      console.error("Yelp AI error", yelpResponse.status, text);
      return res.status(502).json({ error: "Yelp AI API error" });
    }

    const yelpData = (await yelpResponse.json()) as any;

    // Log entities structure during development to understand Yelp AI response shape.
    console.log(
      "Yelp AI entities:",
      JSON.stringify(yelpData?.entities ?? null, null, 2)
    );

    let businesses: any[] = [];

    // Case 1: entities is an array, and elements contain `businesses` arrays (matches your log).
    if (Array.isArray(yelpData?.entities)) {
      businesses = yelpData.entities.flatMap((e: any) =>
        Array.isArray(e?.businesses) ? e.businesses : []
      );
    } else if (Array.isArray(yelpData?.entities?.businesses)) {
      // Case 2: entities.businesses is already an array
      businesses = yelpData.entities.businesses as any[];
    } else if (Array.isArray(yelpData?.entities?.business_search?.businesses)) {
      // Case 3: entities.business_search.businesses is an array
      businesses = yelpData.entities.business_search.businesses as any[];
    }

    /**
     * Perfect Fit Score 2.0 - Proprietary Algorithm
     * Combines 4 weighted factors for optimal restaurant matching
     */
    const computePerfectFitScore = (
      calories: number,
      protein: number,
      distanceMeters: number | undefined,
      aiConfidence: number,
      restaurantName: string,
      mealType: string = "lunch"
    ) => {
      // 1. MACRO FIT SCORE (40% weight)
      const calorieDiff = Math.abs(caloriesTarget - calories);
      const calorieScore =
        1 - Math.min(calorieDiff / Math.max(caloriesTarget, 1), 1);

      const proteinDelta = protein - proteinMin;
      const proteinScore =
        proteinDelta >= 0
          ? 1
          : Math.max(1 + proteinDelta / Math.max(proteinMin, 1), 0);

      // Macro fit: 70% calories, 30% protein
      const macroFitScore = calorieScore * 0.7 + proteinScore * 0.3;

      // 2. DISTANCE SCORE (20% weight)
      // Optimal range: 0-2km gets full points, degrades to 0 at 10km+
      let distanceScore = 1.0;
      if (typeof distanceMeters === "number") {
        const distanceKm = distanceMeters / 1000;
        if (distanceKm <= 2) {
          distanceScore = 1.0;
        } else if (distanceKm <= 5) {
          distanceScore = 1 - ((distanceKm - 2) / 3) * 0.3; // 70-100%
        } else if (distanceKm <= 10) {
          distanceScore = 0.7 - ((distanceKm - 5) / 5) * 0.7; // 0-70%
        } else {
          distanceScore = 0;
        }
      }

      // 3. AI CONFIDENCE SCORE (20% weight)
      // Direct pass-through of Yelp AI's confidence in the recommendation
      const aiConfidenceScore = aiConfidence;

      // 4. MEAL-TYPE MATCH SCORE (20% weight)
      // Heuristic matching based on restaurant name/type keywords
      const mealTypeScore = calculateMealTypeMatch(
        restaurantName.toLowerCase(),
        mealType
      );

      // FINAL SCORE: Weighted combination
      const finalScore = Math.round(
        (macroFitScore * 0.4 +
          distanceScore * 0.2 +
          aiConfidenceScore * 0.2 +
          mealTypeScore * 0.2) *
          100
      );

      // Label generation
      let label: string;
      if (finalScore >= 90) label = "Perfect fit · 100";
      else if (finalScore >= 80) label = "Excellent fit";
      else if (finalScore >= 70) label = "Great fit";
      else if (finalScore >= 60) label = "Good fit";
      else label = "Decent fit";

      return {
        score: finalScore,
        label,
        breakdown: {
          macroFitScore: Math.round(macroFitScore * 100),
          distanceScore: Math.round(distanceScore * 100),
          aiConfidenceScore: Math.round(aiConfidenceScore * 100),
          mealTypeScore: Math.round(mealTypeScore * 100),
        },
      };
    };

    /**
     * Heuristic meal-type matching based on restaurant characteristics
     */
    const calculateMealTypeMatch = (
      restaurantNameLower: string,
      mealType: string
    ): number => {
      const breakfastKeywords = [
        "breakfast",
        "brunch",
        "cafe",
        "coffee",
        "bagel",
        "pancake",
        "waffle",
      ];
      const lunchKeywords = [
        "lunch",
        "sandwich",
        "salad",
        "bowl",
        "deli",
        "cafe",
        "bistro",
      ];
      const dinnerKeywords = [
        "dinner",
        "steakhouse",
        "fine dining",
        "restaurant",
        "tavern",
        "grill",
      ];
      const snackKeywords = [
        "snack",
        "smoothie",
        "juice",
        "cafe",
        "bar",
        "lounge",
      ];

      let keywords: string[] = [];
      if (mealType === "breakfast") keywords = breakfastKeywords;
      else if (mealType === "lunch") keywords = lunchKeywords;
      else if (mealType === "dinner") keywords = dinnerKeywords;
      else if (mealType === "snack") keywords = snackKeywords;
      else keywords = lunchKeywords; // default

      // Check if restaurant name contains any meal-type keywords
      const matches = keywords.filter((kw) =>
        restaurantNameLower.includes(kw)
      ).length;

      // Score based on keyword matches: 0 matches = 0.5 (neutral), 1+ = 1.0
      return matches > 0 ? 1.0 : 0.5;
    };

    let restaurants: RestaurantOption[] = (businesses as any[])
      .slice(0, 5)
      .map((b, idx) => {
        const locationParts = [b?.location?.address1, b?.location?.city].filter(
          Boolean
        ) as string[];

        const businessContext = b?.contextual_info ?? {};
        const summaries = b?.summaries ?? {};

        // Compute dish macros (will be used in Perfect Fit Score calculation)
        let estCalories = caloriesTarget;
        let estProtein = proteinMin;

        const description =
          summaries.short ||
          summaries.medium ||
          businessContext.summary ||
          "Macro-friendly option inferred from Yelp AI.";

        // Try to parse calorie and protein hints from the description text.
        const kcalRangeMatch = description.match(
          /(\d{2,4})\s*[–-]\s*(\d{2,4})\s*kcal/i
        );
        const kcalSingleMatch = description.match(/(\d{2,4})\s*kcal/i);

        if (kcalRangeMatch) {
          const low = Number(kcalRangeMatch[1]);
          const high = Number(kcalRangeMatch[2]);
          if (!Number.isNaN(low) && !Number.isNaN(high)) {
            estCalories = Math.round((low + high) / 2);
          }
        } else if (kcalSingleMatch) {
          const val = Number(kcalSingleMatch[1]);
          if (!Number.isNaN(val)) estCalories = val;
        }

        const proteinRangeMatch = description.match(
          /(\d{1,3})\s*[–-]\s*(\d{1,3})\s*g\s*protein/i
        );
        const proteinSingleMatch = description.match(
          /(\d{1,3})\s*g\s*protein/i
        );

        if (proteinRangeMatch) {
          const low = Number(proteinRangeMatch[1]);
          const high = Number(proteinRangeMatch[2]);
          if (!Number.isNaN(low) && !Number.isNaN(high)) {
            estProtein = Math.round((low + high) / 2);
          }
        } else if (proteinSingleMatch) {
          const val = Number(proteinSingleMatch[1]);
          if (!Number.isNaN(val)) estProtein = val;
        }

        // Calculate Perfect Fit Score 2.0
        const fitResult = computePerfectFitScore(
          estCalories,
          estProtein,
          typeof b.distance === "number" ? b.distance : undefined,
          0.6, // Base AI confidence (can be enhanced with actual Yelp AI confidence data)
          b.name ?? "Unknown",
          mealType
        );

        return {
          id: b.id ?? `biz-${idx}`,
          name: b.name ?? "Unknown",
          rating: b.rating ?? 0,
          price: b.price ?? undefined,
          distanceMeters:
            typeof b.distance === "number" ? b.distance : undefined,
          url: b.url,
          imageUrl:
            businessContext?.photos?.[0]?.original_url ??
            b.image_url ??
            undefined,
          address: locationParts.length ? locationParts.join(", ") : undefined,
          dishes: [
            {
              name: "Suggested macro-friendly option",
              description,
              estimatedCalories: estCalories,
              estimatedProtein: estProtein,
              confidence: 0.6,
            },
          ],
          fitScore: fitResult.score,
          fitLabel: fitResult.label,
          scoreBreakdown: fitResult.breakdown,
          reason:
            businessContext.summary ||
            summaries.short ||
            `Matches your ~${caloriesTarget} kcal / high-protein request.`,
        };
      });

    // Fallback: if Yelp AI didn't return any parsable businesses, provide one mock
    // restaurant so the UI still demonstrates the flow.
    if (!restaurants.length) {
      const fitResult = computePerfectFitScore(
        caloriesTarget,
        proteinMin,
        800,
        0.3,
        "FeastFit Demo Kitchen",
        mealType
      );

      restaurants = [
        {
          id: "fallback-mock-1",
          name: "FeastFit Demo Kitchen",
          rating: 4.5,
          price: "$$",
          distanceMeters: 800,
          url: undefined,
          imageUrl: undefined,
          address: location,
          dishes: [
            {
              name: "High-Protein Demo Bowl",
              description:
                "Sample macro-friendly bowl used when Yelp AI returns no structured businesses.",
              estimatedCalories: caloriesTarget,
              estimatedProtein: proteinMin,
              confidence: 0.3,
            },
          ],
          fitScore: fitResult.score,
          fitLabel: fitResult.label,
          scoreBreakdown: fitResult.breakdown,
          reason:
            "Fallback result shown because Yelp AI did not return structured businesses.",
        },
      ];
    }

    const response: SearchRestaurantsResponse = { restaurants };

    return res.status(200).json(response);
  } catch (err) {
    console.error("search-restaurants error", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
