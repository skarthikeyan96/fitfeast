import type { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import type { DishOption, RestaurantOption } from "./search-restaurants";

export type LogMealRequest = {
  userId: string;
  restaurant: Pick<
    RestaurantOption,
    "id" | "name" | "url" | "address" | "fitScore" | "fitLabel"
  >;
  dish: Pick<
    DishOption,
    | "name"
    | "estimatedCalories"
    | "estimatedProtein"
    | "estimatedCarbs"
    | "estimatedFat"
  >;
  mealType?: "breakfast" | "lunch" | "dinner" | "snack";
  locationText?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ ok: true } | { error: string }>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { userId, restaurant, dish, mealType, locationText } =
      req.body as LogMealRequest;

    if (!userId || !restaurant || !dish) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const supabase = getSupabaseClient();

    const { error } = await supabase.from("meal_logs").insert({
      user_id: userId,
      restaurant_id: restaurant.id,
      restaurant_name: restaurant.name,
      restaurant_url: restaurant.url,
      restaurant_address: restaurant.address,
      fit_score: restaurant.fitScore,
      fit_label: restaurant.fitLabel,
      dish_name: dish.name,
      calories: dish.estimatedCalories,
      protein: dish.estimatedProtein,
      carbs: dish.estimatedCarbs,
      fat: dish.estimatedFat,
      meal_type: mealType ?? "lunch",
      location_text: locationText,
    });

    if (error) {
      console.error("Supabase log-meal error", error);
      return res.status(500).json({ error: "Failed to log meal" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("log-meal error", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
