import { useState } from "react";
import type {
  DishOption,
  RestaurantOption,
  SearchRestaurantsResponse,
} from "./api/search-restaurants";

export default function SearchPage() {
  const [location, setLocation] = useState("San Francisco, CA");
  const [caloriesTarget, setCaloriesTarget] = useState(600);
  const [proteinMin, setProteinMin] = useState(35);
  const [diet, setDiet] = useState<string | null>(null);
  const [query, setQuery] = useState("high-protein lunch");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<RestaurantOption[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
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
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Request failed");
      }

      const data: SearchRestaurantsResponse = await res.json();
      setResults(data.restaurants || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
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
                    <h2 className="text-lg font-semibold">{restaurant.name}</h2>
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
                      <DishCard key={dish.name} dish={dish} />
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
      </div>
    </main>
  );
}

function DishCard({ dish }: { dish: DishOption }) {
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
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-300">
        <span>Protein: {dish.estimatedProtein} g</span>
        {dish.estimatedCarbs != null && (
          <span>Carbs: {dish.estimatedCarbs} g</span>
        )}
        {dish.estimatedFat != null && <span>Fat: {dish.estimatedFat} g</span>}
        <span className="text-slate-500">
          Confidence: {(dish.confidence * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
