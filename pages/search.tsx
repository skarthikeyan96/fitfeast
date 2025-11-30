import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import type {
  DishOption,
  RestaurantOption,
  SearchRestaurantsResponse,
} from "./api/search-restaurants";

function ScoreBreakdown({
  breakdown,
}: {
  breakdown: {
    macroFitScore: number;
    distanceScore: number;
    aiConfidenceScore: number;
    mealTypeScore: number;
  };
}) {
  const [expanded, setExpanded] = useState(false);

  const scores = [
    {
      name: "Macro Fit",
      value: breakdown.macroFitScore,
      color: "bg-blue-400",
      weight: "40%",
    },
    {
      name: "Distance",
      value: breakdown.distanceScore,
      color: "bg-purple-400",
      weight: "20%",
    },
    {
      name: "AI Confidence",
      value: breakdown.aiConfidenceScore,
      color: "bg-pink-400",
      weight: "20%",
    },
    {
      name: "Meal Type",
      value: breakdown.mealTypeScore,
      color: "bg-amber-400",
      weight: "20%",
    },
  ];

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="text-[10px] text-emerald-300 hover:text-emerald-200 underline"
      >
        {expanded ? "Hide" : "Show"} Score Breakdown
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 rounded-md border border-slate-700 bg-slate-950/60 p-2">
          {scores.map((score) => (
            <div key={score.name} className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-300">
                  {score.name}{" "}
                  <span className="text-slate-500">({score.weight})</span>
                </span>
                <span className="font-semibold text-slate-200">
                  {score.value}/100
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full ${score.color} transition-all duration-500`}
                  style={{ width: `${score.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const [location, setLocation] = useState("San Francisco, CA");
  const [caloriesTarget, setCaloriesTarget] = useState(600);
  const [proteinMin, setProteinMin] = useState(35);
  const [diet, setDiet] = useState<string | null>(null);
  const [query, setQuery] = useState("high-protein lunch");
  const [mealType, setMealType] = useState<
    "breakfast" | "lunch" | "dinner" | "snack"
  >("lunch");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<RestaurantOption[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [logMessage, setLogMessage] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [refineMessage, setRefineMessage] = useState("");
  const [refineLoading, setRefineLoading] = useState(false);
  const [refineResponse, setRefineResponse] = useState<string | null>(null);

  // On first load, hydrate form state from query parameters if provided
  useEffect(() => {
    if (!router.isReady) return;

    const {
      location: qLocation,
      caloriesTarget: qCalories,
      proteinMin: qProtein,
      diet: qDiet,
      mealType: qMealType,
    } = router.query;

    if (typeof qLocation === "string" && qLocation.trim()) {
      setLocation(qLocation);
    }

    if (typeof qCalories === "string") {
      const num = Number(qCalories);
      if (!Number.isNaN(num) && num > 0) {
        setCaloriesTarget(num);
      }
    }

    if (typeof qProtein === "string") {
      const num = Number(qProtein);
      if (!Number.isNaN(num) && num > 0) {
        setProteinMin(num);
      }
    }

    if (typeof qDiet === "string" && qDiet.trim()) {
      setDiet(qDiet);
    }

    if (
      typeof qMealType === "string" &&
      ["breakfast", "lunch", "dinner", "snack"].includes(qMealType)
    ) {
      setMealType(qMealType as "breakfast" | "lunch" | "dinner" | "snack");
    }
  }, [router.isReady, router.query]);

  // Initialize auth state: prefer authed Supabase user, otherwise create a guest id
  useEffect(() => {
    if (typeof window === "undefined") return;

    const authedId = window.localStorage.getItem("feastfit_user_id");
    if (authedId) {
      setUserId(authedId);
      setIsAuthed(true);
      return;
    }

    const existingGuest = window.localStorage.getItem("feastfit_demo_user_id");
    if (existingGuest) {
      setUserId(existingGuest);
      setIsAuthed(false);
      return;
    }

    const generatedGuest = `demo-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem("feastfit_demo_user_id", generatedGuest);
    setUserId(generatedGuest);
    setIsAuthed(false);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      setLogMessage(null);
      const res = await fetch("/api/search-restaurants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location,
          caloriesTarget,
          proteinMin,
          diet,
          query,
          mealType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Request failed");
      }

      const data: SearchRestaurantsResponse = await res.json();
      // Sort restaurants by Perfect Fit Score (highest first)
      const sortedRestaurants = (data.restaurants || []).sort(
        (a, b) => b.fitScore - a.fitScore
      );
      setResults(sortedRestaurants);
      // Store a compact snapshot for the coach to read later.
      const compact = {
        location,
        caloriesTarget,
        proteinMin,
        diet,
        query,
        timestamp: new Date().toISOString(),
        restaurants: data.restaurants.slice(0, 5).map((r) => ({
          name: r.name,
          rating: r.rating,
          fitScore: r.fitScore,
          fitLabel: r.fitLabel,
          dishes: r.dishes.slice(0, 2).map((d) => ({
            name: d.name,
            estimatedCalories: d.estimatedCalories,
            estimatedProtein: d.estimatedProtein,
            confidence: d.confidence,
          })),
        })),
      };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "feastfit_last_search",
          JSON.stringify(compact)
        );
      }
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleLogMeal = async (
    restaurant: RestaurantOption,
    dish: DishOption
  ) => {
    setLogMessage(null);

    try {
      if (!isAuthed) {
        // Guest flow: store logs in localStorage only.
        if (typeof window === "undefined") return;

        const key = "feastfit_guest_logs_v1";
        const raw = window.localStorage.getItem(key);
        const existing: any[] = raw ? JSON.parse(raw) : [];

        const entry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: new Date().toISOString(),
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          restaurantUrl: restaurant.url,
          restaurantAddress: restaurant.address,
          fitScore: restaurant.fitScore,
          fitLabel: restaurant.fitLabel,
          dishName: dish.name,
          calories: dish.estimatedCalories,
          protein: dish.estimatedProtein,
          carbs: dish.estimatedCarbs,
          fat: dish.estimatedFat,
          mealType: "lunch",
          locationText: location,
          source: "guest-local",
        };

        existing.unshift(entry);
        window.localStorage.setItem(key, JSON.stringify(existing));
        setLogMessage("Meal saved locally for this guest session.");
        return;
      }

      // Authed flow: send to Supabase via API (not yet wired to real auth).
      if (!userId) return;

      const res = await fetch("/api/log-meal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          restaurant: {
            id: restaurant.id,
            name: restaurant.name,
            url: restaurant.url,
            address: restaurant.address,
            fitScore: restaurant.fitScore,
            fitLabel: restaurant.fitLabel,
          },
          dish: {
            name: dish.name,
            estimatedCalories: dish.estimatedCalories,
            estimatedProtein: dish.estimatedProtein,
            estimatedCarbs: dish.estimatedCarbs,
            estimatedFat: dish.estimatedFat,
          },
          mealType: "lunch",
          locationText: location,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to log meal");
      }

      setLogMessage("Meal logged to your FeastFit account.");
    } catch (err: unknown) {
      console.error(err);
      setLogMessage(err instanceof Error ? err.message : "Failed to log meal");
    }
  };

  const handleRefine = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!refineMessage.trim()) return;

    setRefineLoading(true);
    setRefineResponse(null);
    setError(null);

    try {
      const res = await fetch("/api/refine-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location,
          caloriesTarget,
          proteinMin,
          diet: diet ?? undefined,
          query,
          refineMessage,
          restaurants: results,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to refine results");
      }

      const data = (await res.json()) as { message: string };
      setRefineResponse(data.message);
      setRefineMessage("");
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to refine results");
    } finally {
      setRefineLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold">FeastFit Search</h1>
        <p className="mb-6 text-slate-300">
          Bridge your meal plan to real restaurants. Adjust your targets and
          search for macro-friendly options.
        </p>

        <form
          onSubmit={handleSearch}
          className="mb-8 grid gap-4 rounded-xl bg-slate-900/60 p-4 md:grid-cols-2"
        >
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-300">Location</span>
            <input
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-300">
              Calories target for this meal
            </span>
            <input
              type="number"
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              value={caloriesTarget}
              onChange={(e) => setCaloriesTarget(Number(e.target.value))}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-300">Minimum protein (g)</span>
            <input
              type="number"
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              value={proteinMin}
              onChange={(e) => setProteinMin(Number(e.target.value))}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-300">Diet preference</span>
            <select
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              value={diet ?? ""}
              onChange={(e) =>
                setDiet(e.target.value === "" ? null : e.target.value)
              }
            >
              <option value="">None</option>
              <option value="vegan">Vegan</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="pescatarian">Pescatarian</option>
              <option value="keto">Keto</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-300">Meal type</span>
            <select
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              value={mealType}
              onChange={(e) =>
                setMealType(
                  e.target.value as "breakfast" | "lunch" | "dinner" | "snack"
                )
              }
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </label>

          <label className="md:col-span-2 flex flex-col gap-1 text-sm">
            <span className="text-slate-300">
              What are you in the mood for?
            </span>
            <input
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

          <button
            type="submit"
            className="md:col-span-2 inline-flex items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow hover:bg-emerald-400 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Searching…" : "Search restaurants"}
          </button>
        </form>

        {error && (
          <div className="mb-4 rounded-md border border-red-500/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {logMessage && (
          <div className="mb-4 rounded-md border border-emerald-500/50 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-200">
            {logMessage}
          </div>
        )}

        {results.length > 0 && (
          <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="font-semibold text-emerald-300">
                  Perfect Fit Score 2.0™
                </span>
              </div>
              <span className="text-slate-400">·</span>
              <span className="text-slate-300">
                Proprietary Algorithm Active
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Results ranked by our unique 4-factor scoring:{" "}
              <span className="text-blue-300">Macro Fit (40%)</span>,
              <span className="text-purple-300"> Distance (20%)</span>,
              <span className="text-pink-300"> AI Confidence (20%)</span>,
              <span className="text-amber-300"> Meal Type Match (20%)</span>
            </p>
          </div>
        )}

        <section className="space-y-4">
          {results.map((restaurant) => (
            <article
              key={restaurant.id}
              className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60"
            >
              <div className="grid gap-4 md:grid-cols-[2fr,3fr]">
                {restaurant.imageUrl && (
                  <img
                    src={restaurant.imageUrl}
                    alt={restaurant.name}
                    className="h-full w-full object-cover"
                  />
                )}
                <div className="p-4 space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="space-y-2 flex-1">
                      <h2 className="text-lg font-semibold">
                        {restaurant.name}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-300 border border-emerald-500/40 font-semibold">
                          {restaurant.fitLabel}
                          <span className="ml-1.5 text-sm text-emerald-400">
                            {restaurant.fitScore}
                          </span>
                        </span>
                      </div>
                      {restaurant.scoreBreakdown && (
                        <>
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                            <div className="flex items-center gap-1">
                              <div className="h-1.5 w-1.5 rounded-full bg-blue-400"></div>
                              <span>
                                Macro: {restaurant.scoreBreakdown.macroFitScore}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="h-1.5 w-1.5 rounded-full bg-purple-400"></div>
                              <span>
                                Distance:{" "}
                                {restaurant.scoreBreakdown.distanceScore}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="h-1.5 w-1.5 rounded-full bg-pink-400"></div>
                              <span>
                                AI Conf:{" "}
                                {restaurant.scoreBreakdown.aiConfidenceScore}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="h-1.5 w-1.5 rounded-full bg-amber-400"></div>
                              <span>
                                Meal Type:{" "}
                                {restaurant.scoreBreakdown.mealTypeScore}
                              </span>
                            </div>
                          </div>
                          <ScoreBreakdown
                            breakdown={restaurant.scoreBreakdown}
                          />
                        </>
                      )}
                    </div>
                    <span className="text-sm text-emerald-300">
                      ⭐ {restaurant.rating.toFixed(1)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex flex-wrap gap-2">
                    {restaurant.price && <span>{restaurant.price}</span>}
                    {restaurant.address && <span>{restaurant.address}</span>}
                    {typeof restaurant.distanceMeters === "number" && (
                      <span>
                        {(restaurant.distanceMeters / 1000).toFixed(1)} km away
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-300 mt-2">
                    {restaurant.reason}
                  </p>

                  <div className="mt-3 space-y-2">
                    {restaurant.dishes.map((dish) => (
                      <DishCard
                        key={dish.name}
                        dish={dish}
                        canLog={!!userId}
                        onLog={() => handleLogMeal(restaurant, dish)}
                      />
                    ))}
                  </div>

                  {restaurant.url && (
                    <a
                      href={restaurant.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex text-xs text-emerald-300 hover:text-emerald-200"
                    >
                      View on Yelp
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}

          {!loading && results.length === 0 && (
            <p className="text-sm text-slate-400">
              No results yet. Try running a search.
            </p>
          )}
        </section>

        {results.length > 0 && (
          <section className="mt-8 space-y-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm">
            <h2 className="text-sm font-semibold text-slate-100">
              Refine these results with FeastFit
            </h2>
            <p className="text-xs text-slate-400">
              Ask in your own words, e.g. &quot;Make it lower carb&quot; or
              &quot;Prefer something closer to 800 kcal but still high
              protein&quot;.
            </p>
            <form
              onSubmit={handleRefine}
              className="flex flex-col gap-2 md:flex-row"
            >
              <input
                className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none focus:border-emerald-400"
                placeholder="How would you like to adjust these options?"
                value={refineMessage}
                onChange={(e) => setRefineMessage(e.target.value)}
              />
              <button
                type="submit"
                disabled={refineLoading || !refineMessage.trim()}
                className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 shadow hover:bg-emerald-400 disabled:opacity-60"
              >
                {refineLoading ? "Refining…" : "Refine"}
              </button>
            </form>
            {refineResponse && (
              <div className="mt-2 rounded-md border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs text-emerald-100 whitespace-pre-line">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-400/80">
                  Refined by Yelp AI
                </div>
                {refineResponse}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function DishCard({
  dish,
  canLog,
  onLog,
}: {
  dish: DishOption;
  canLog?: boolean;
  onLog?: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-medium">{dish.name}</h3>
        <span className="text-xs text-slate-400">
          ~{dish.estimatedCalories} kcal
        </span>
      </div>
      {dish.description && (
        <p className="mt-1 text-xs text-slate-400">{dish.description}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-300 items-center">
        <span>Protein: {dish.estimatedProtein} g</span>
        {dish.estimatedCarbs != null && (
          <span>Carbs: {dish.estimatedCarbs} g</span>
        )}
        {dish.estimatedFat != null && <span>Fat: {dish.estimatedFat} g</span>}
        <span className="text-slate-500">
          Confidence: {(dish.confidence * 100).toFixed(0)}%
        </span>
        {canLog && onLog && (
          <button
            type="button"
            onClick={onLog}
            className="ml-auto inline-flex items-center rounded-md border border-emerald-500/60 px-2 py-0.5 text-[11px] font-medium text-emerald-300 hover:bg-emerald-500/10"
          >
            Log this meal
          </button>
        )}
      </div>
    </div>
  );
}
