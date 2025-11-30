import { useState } from "react";

interface Message {
  id: string;
  role: "user" | "coach";
  content: string;
}

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m1",
      role: "coach",
      content:
        "I'm your FeastFit Meal Coach. I can help you choose from your latest restaurant results or balance today's meals against your targets.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    // Read context from localStorage (guest flow)
    const lastSearchRaw =
      typeof window !== "undefined"
        ? window.localStorage.getItem("feastfit_last_search")
        : null;
    const guestLogsRaw =
      typeof window !== "undefined"
        ? window.localStorage.getItem("feastfit_guest_logs_v1")
        : null;

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(lastSearchRaw && {
            "x-feastfit-last-search": encodeURIComponent(lastSearchRaw),
          }),
          ...(guestLogsRaw && {
            "x-feastfit-guest-logs": encodeURIComponent(guestLogsRaw),
          }),
        },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Coach request failed");
      }

      const data = (await res.json()) as { reply: string };
      const coachMessage: Message = {
        id: `c-${Date.now()}`,
        role: "coach",
        content: data.reply,
      };
      setMessages((prev) => [...prev, coachMessage]);
    } catch (err: any) {
      console.error(err);
      const errorMessage: Message = {
        id: `e-${Date.now()}`,
        role: "coach",
        content: err.message || "Something went wrong. Try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex h-screen max-w-3xl flex-col px-4 py-6">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">FeastFit Coach</h1>
            <p className="text-xs text-slate-400">
              Ask about today\'s meals, your targets, or help choosing from
              recent results.
            </p>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[80%] rounded-lg bg-emerald-500 px-3 py-2 text-xs text-slate-950"
                  : "mr-auto max-w-[80%] rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-100"
              }
            >
              {m.content}
            </div>
          ))}
        </section>

        <form
          onSubmit={handleSend}
          className="mt-4 flex gap-2 rounded-xl border border-slate-800 bg-slate-900/80 p-2"
        >
          <input
            className="flex-1 bg-transparent px-2 py-1 text-xs text-slate-100 outline-none placeholder:text-slate-500"
            placeholder="Ask your FeastFit Coach..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="inline-flex items-center rounded-md bg-emerald-500 px-3 py-1 text-xs font-semibold text-slate-950 shadow hover:bg-emerald-400 disabled:opacity-60"
          >
            {sending ? "Thinking…" : "Send"}
          </button>
        </form>
      </div>
    </main>
  );
}
