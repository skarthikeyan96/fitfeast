import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import type {
  DishOption,
  RestaurantOption,
  SearchRestaurantsResponse,
} from "./api/search-restaurants";
import { SearchForm } from "./components/search-form";
import { SearchResults } from "./components/search-results";

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

  const handleSearch = async (searchData: {
    location: string;
    caloriesTarget: number;
    proteinMin: number;
    diet: string | null;
    mealType: "breakfast" | "lunch" | "dinner" | "snack";
    query: string;
  }) => {
    // Update local state
    setLocation(searchData.location);
    setCaloriesTarget(searchData.caloriesTarget);
    setProteinMin(searchData.proteinMin);
    setDiet(searchData.diet);
    setMealType(searchData.mealType);
    setQuery(searchData.query);

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
          location: searchData.location,
          caloriesTarget: searchData.caloriesTarget,
          proteinMin: searchData.proteinMin,
          diet: searchData.diet,
          query: searchData.query,
          mealType: searchData.mealType,
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
        location: searchData.location,
        caloriesTarget: searchData.caloriesTarget,
        proteinMin: searchData.proteinMin,
        diet: searchData.diet,
        query: searchData.query,
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
    <main className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Background gradient matching landing page */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/10" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Glow effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
      <SearchForm
        onSearch={handleSearch}
        isSearching={loading}
        initialData={{
          location,
          caloriesTarget,
          proteinMin,
          diet,
          mealType,
          query,
        }}
      />

      <div className="container mx-auto px-4 pb-12">
        {error && (
          <div className="max-w-3xl mx-auto mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
            {error}
          </div>
        )}

        {logMessage && (
          <div className="max-w-3xl mx-auto mb-4 rounded-md border border-primary/50 bg-primary/10 px-3 py-2 text-xs text-primary">
            {logMessage}
          </div>
        )}

        <SearchResults
          hasSearched={results.length > 0 || loading}
          isSearching={loading}
          results={results}
          onLogMeal={handleLogMeal}
          canLog={!!userId}
        />

        {results.length > 0 && (
          <section className="max-w-3xl mx-auto mt-8 space-y-3 rounded-xl border border-border bg-card/50 backdrop-blur-sm p-4 text-sm">
            <h2 className="text-sm font-semibold text-foreground">
              Refine these results with FeastFit
            </h2>
            <p className="text-xs text-muted-foreground">
              Ask in your own words, e.g. &quot;Make it lower carb&quot; or
              &quot;Prefer something closer to 800 kcal but still high
              protein&quot;.
            </p>
            <form
              onSubmit={handleRefine}
              className="flex flex-col gap-2 md:flex-row"
            >
              <input
                className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-xs outline-none focus:border-primary focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
                placeholder="How would you like to adjust these options?"
                value={refineMessage}
                onChange={(e) => setRefineMessage(e.target.value)}
              />
              <button
                type="submit"
                disabled={refineLoading || !refineMessage.trim()}
                className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-60"
              >
                {refineLoading ? "Refining…" : "Refine"}
              </button>
            </form>
            {refineResponse && (
              <div className="mt-2 rounded-md border border-primary/40 bg-primary/10 p-3 text-xs text-foreground whitespace-pre-line">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
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
