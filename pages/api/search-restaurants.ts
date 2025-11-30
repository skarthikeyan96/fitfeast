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

    const computeFit = (calories: number, protein: number) => {
      const calorieDiff = Math.abs(caloriesTarget - calories);
      const calorieScore =
        1 - Math.min(calorieDiff / Math.max(caloriesTarget, 1), 1);

      const proteinDelta = protein - proteinMin;
      const proteinScore =
        proteinDelta >= 0
          ? 1
          : Math.max(1 + proteinDelta / Math.max(proteinMin, 1), 0);

      const score = Math.round((calorieScore * 0.7 + proteinScore * 0.3) * 100);

      let label: string;
      if (score >= 85) label = "Perfect fit";
      else if (score >= 65) label = "Good fit";
      else label = "Decent fit";

      return { score, label };
    };

    let restaurants: RestaurantOption[] = (businesses as any[])
      .slice(0, 5)
      .map((b, idx) => {
        const locationParts = [b?.location?.address1, b?.location?.city].filter(
          Boolean
        ) as string[];

        const businessContext = b?.contextual_info ?? {};
        const summaries = b?.summaries ?? {};

        // For now we approximate dish macros with the user's target.
        const { score: fitScore, label: fitLabel } = computeFit(
          caloriesTarget,
          proteinMin
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
          dishes: (() => {
            const description =
              summaries.short ||
              summaries.medium ||
              businessContext.summary ||
              "Macro-friendly option inferred from Yelp AI.";

            // Try to parse calorie and protein hints from the description text.
            let estCalories = caloriesTarget;
            let estProtein = proteinMin;

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

            return [
              {
                name: "Suggested macro-friendly option",
                description,
                estimatedCalories: estCalories,
                estimatedProtein: estProtein,
                confidence: 0.5,
              },
            ];
          })(),
          fitScore,
          fitLabel,
          reason:
            businessContext.summary ||
            summaries.short ||
            `Matches your ~${caloriesTarget} kcal / high-protein request.`,
        };
      });

    // Fallback: if Yelp AI didn't return any parsable businesses, provide one mock
    // restaurant so the UI still demonstrates the flow.
    if (!restaurants.length) {
      const { score: fitScore, label: fitLabel } = computeFit(
        caloriesTarget,
        proteinMin
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
          fitScore,
          fitLabel,
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
