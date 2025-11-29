import { useRouter } from "next/router";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [location, setLocation] = useState("San Francisco, CA");
  const [caloriesTarget, setCaloriesTarget] = useState(600);
  const [proteinMin, setProteinMin] = useState(35);
  const [diet, setDiet] = useState<string | null>(null);

  const handlePlan = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams({
      location,
      caloriesTarget: String(caloriesTarget),
      proteinMin: String(proteinMin),
    });

    if (diet) {
      params.set("diet", diet);
    }

    router.push(`/search?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            FeastFit · Prototype
          </p>
          <h1 className="text-3xl font-bold md:text-4xl">
            Bridge your meal plan to real-world restaurants.
          </h1>
          <p className="max-w-2xl text-sm text-slate-300 md:text-base">
            Tell FeastFit your target for this meal and well ask Yelp AI to find
            nearby spots that best match your calories, protein, and diet.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/30">
          <form
            onSubmit={handlePlan}
            className="grid gap-4 md:grid-cols-2 md:gap-5"
          >
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-300">Where are you eating?</span>
              <input
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <span className="text-[11px] text-slate-500">
                Use a neighborhood or city for now. Well geocode later.
              </span>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-300">Calories for this meal</span>
              <input
                type="number"
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                value={caloriesTarget}
                onChange={(e) => setCaloriesTarget(Number(e.target.value))}
              />
              <span className="text-[11px] text-slate-500">
                Example: 500600 kcal for lunch on a 1,800 kcal cut.
              </span>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-300">Minimum protein (g)</span>
              <input
                type="number"
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                value={proteinMin}
                onChange={(e) => setProteinMin(Number(e.target.value))}
              />
              <span className="text-[11px] text-slate-500">
                Well favor places where you can hit this from one dish.
              </span>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-300">Diet preference</span>
              <select
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-400"
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

            <div className="md:col-span-2 flex flex-col gap-3 pt-2 text-xs text-slate-400">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow hover:bg-emerald-400"
              >
                Plan this meal with Yelp AI
              </button>
              <p>
                On the next screen, you can refine cravings like Mexican bowls
                or high-protein brunch and see ranked matches.
              </p>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
