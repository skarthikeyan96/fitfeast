import type { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseClient } from "../../lib/supabaseClient";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const userId = req.query.userId as string | undefined;
  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("meal_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Supabase logs error", error);
      return res.status(500).json({ error: "Failed to fetch logs" });
    }

    return res.status(200).json({ logs: data ?? [] });
  } catch (err) {
    console.error("logs handler error", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
