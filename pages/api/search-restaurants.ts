import type { NextApiRequest, NextApiResponse } from "next";

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
        query: `Find macro-friendly restaurants near me. Target ~${caloriesTarget} calories, at least ${proteinMin}g protein. Diet: ${
          diet || "none"
        }. User query: ${query}`,
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

    let restaurants: RestaurantOption[] = (businesses as any[])
      .slice(0, 5)
      .map((b, idx) => {
        const locationParts = [b?.location?.address1, b?.location?.city].filter(
          Boolean
        ) as string[];

        const businessContext = b?.contextual_info ?? {};
        const summaries = b?.summaries ?? {};

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
              description:
                summaries.short ||
                summaries.medium ||
                businessContext.summary ||
                "Macro-friendly option inferred from Yelp AI.",
              estimatedCalories: caloriesTarget,
              estimatedProtein: proteinMin,
              confidence: 0.5,
            },
          ],
          reason:
            businessContext.summary ||
            summaries.short ||
            `Matches your ~${caloriesTarget} kcal / high-protein request.`,
        };
      });

    // Fallback: if Yelp AI didn't return any parsable businesses, provide one mock
    // restaurant so the UI still demonstrates the flow.
    if (!restaurants.length) {
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
