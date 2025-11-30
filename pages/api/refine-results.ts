import type { NextApiRequest, NextApiResponse } from "next";

// This endpoint takes the original search context + current restaurants and a free-text
// refinement message, and asks Yelp AI to re-rank or lightly adjust suggestions.

type DishOption = {
  name: string;
  description: string;
  estimatedCalories: number;
  estimatedProtein: number;
  confidence: number;
};

type RestaurantOption = {
  id: string;
  name: string;
  rating: number;
  price?: string;
  distanceMeters?: number;
  url?: string;
  imageUrl?: string;
  address?: string;
  dishes: DishOption[];
  fitScore: number;
  fitLabel: string;
  reason: string;
};

interface RefineRequestBody {
  location: string;
  caloriesTarget: number;
  proteinMin: number;
  diet?: string;
  query: string;
  refineMessage: string;
  restaurants: RestaurantOption[];
}

interface RefineResponseBody {
  // For now we keep it simple and ask the model to return plain text advice
  // plus optional notes about which existing restaurants are better matches.
  message: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RefineResponseBody | { error: string }>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKey = process.env.YELP_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing YELP_API_KEY" });
  }

  try {
    const {
      location,
      caloriesTarget,
      proteinMin,
      diet,
      query,
      refineMessage,
      restaurants,
    } = req.body as RefineRequestBody;

    if (
      !location ||
      !caloriesTarget ||
      !proteinMin ||
      !query ||
      !refineMessage
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const systemContext = `You are FeastFit, a nutrition coach.
User is in ${location} aiming for ~${caloriesTarget} kcal and >= ${proteinMin}g protein.
Diet: ${diet || "none"}.
Original search: "${query}".
You will see a small list of restaurants with approximate macros.
Briefly respond to the user's refinement, suggest adjustments, and mention 2–3 restaurants from the list as examples.
Do not invent new restaurants.`;

    // Build a very compact version of restaurants to keep the query safely
    // under Yelp's validation limits: only include a few entries and minimal fields.
    const compactRestaurants = restaurants.slice(0, 3).map((r) => ({
      name: r.name,
      fitScore: r.fitScore,
      dishes: r.dishes.slice(0, 2).map((d) => ({
        name: d.name,
        kcal: d.estimatedCalories,
        protein: d.estimatedProtein,
      })),
    }));

    const yelpResponse = await fetch("https://api.yelp.com/ai/chat/v2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `${systemContext}\n\nUser refinement: "${refineMessage}".\nRestaurants (compact JSON): ${JSON.stringify(
          compactRestaurants
        )}`,
        user_context: {
          locale: "en_US",
        },
      }),
    });

    if (!yelpResponse.ok) {
      const text = await yelpResponse.text();
      console.error("Yelp AI refine error", yelpResponse.status, text);
      return res.status(502).json({ error: "Yelp AI API error" });
    }

    const data = (await yelpResponse.json()) as any;

    const content: string =
      typeof data?.response?.text === "string"
        ? data.response.text
        : typeof data?.text === "string"
        ? data.text
        : "I adjusted your options based on your request.";

    return res.status(200).json({ message: content });
  } catch (err) {
    console.error("refine-results error", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
