import type { NextApiRequest, NextApiResponse } from "next";

interface CoachRequestBody {
  message: string;
}

interface CoachResponseBody {
  reply: string;
}

// Helper: read and parse localStorage-like data from a request header (we’ll send it from the client)
function parseContextFromHeaders(req: NextApiRequest) {
  const lastSearchRaw = req.headers["x-feastfit-last-search"];
  const guestLogsRaw = req.headers["x-feastfit-guest-logs"];

  let lastSearch: any = null;
  let guestLogs: any[] = [];

  try {
    if (lastSearchRaw && typeof lastSearchRaw === "string") {
      lastSearch = JSON.parse(decodeURIComponent(lastSearchRaw));
    }
  } catch {}

  try {
    if (guestLogsRaw && typeof guestLogsRaw === "string") {
      guestLogs = JSON.parse(decodeURIComponent(guestLogsRaw));
    }
  } catch {}

  return { lastSearch, guestLogs };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CoachResponseBody | { error: string }>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKey = process.env.YELP_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing YELP_API_KEY" });
  }

  const { message } = req.body as CoachRequestBody;
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Invalid message" });
  }

  const { lastSearch, guestLogs } = parseContextFromHeaders(req);

  // Summarize today’s logged macros (guest flow)
  const today = new Date().toISOString().slice(0, 10);
  const todayLogs = guestLogs.filter((log: any) =>
    log.createdAt?.startsWith(today)
  );
  const totals = todayLogs.reduce(
    (acc, log: any) => {
      acc.calories += Number(log.calories) || 0;
      acc.protein += Number(log.protein) || 0;
      return acc;
    },
    { calories: 0, protein: 0 }
  );

  // Build a short system prompt
  const systemPrompt = `You are FeastFit’s Meal Coach. The user’s targets are roughly ${
    lastSearch?.caloriesTarget ?? "unknown"
  } kcal and at least ${
    lastSearch?.proteinMin ?? "unknown"
  }g protein per meal, with diet preference: ${lastSearch?.diet ?? "none"}.
${
  lastSearch
    ? `Their last search was for "${lastSearch.query}" in ${
        lastSearch.location
      }. Below is a compact list of the restaurants they saw: ${JSON.stringify(
        lastSearch.restaurants
      )}.`
    : "No recent search data."
}
${
  todayLogs.length
    ? `Today they have already logged ${todayLogs.length} meal(s), totaling about ${totals.calories} kcal and ${totals.protein}g protein.`
    : "No meals logged today."
}
Your job is to:
- Briefly acknowledge what they asked.
- Give personalized advice using the above context (logged meals, last search, targets).
- Do NOT invent restaurants; only mention those in the provided list.
- Keep answers concise and actionable.`;

  const yelpResponse = await fetch("https://api.yelp.com/ai/chat/v2", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `${systemPrompt}\n\nUser message: "${message}"`,
      user_context: {
        locale: "en_US",
      },
    }),
  });

  if (!yelpResponse.ok) {
    const text = await yelpResponse.text();
    console.error("Yelp AI coach error", yelpResponse.status, text);
    return res.status(502).json({ error: "Yelp AI coach error" });
  }

  const data = (await yelpResponse.json()) as any;
  const reply: string =
    typeof data?.response?.text === "string"
      ? data.response.text
      : typeof data?.text === "string"
      ? data.text
      : "I’m sorry, I couldn’t generate a response right now.";

  return res.status(200).json({ reply });
}
