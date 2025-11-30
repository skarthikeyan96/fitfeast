import Image from "next/image";

const screenshots = [
  {
    label: "Search Page",
    image: "/screenshots/search.png",
    query:
      "modern fitness app search interface dark theme with emerald accents showing restaurant search results",
  },
  {
    label: "Macro-Friendly Dishes",
    image: "/screenshots/macro-meals.png",
    query:
      "mobile app screen showing food dishes with protein calories macros nutrition info dark theme",
  },
  {
    label: "AI Refinement",
    image: undefined,
    query:
      "AI chat interface for meal recommendations dark theme with emerald green accents",
  },
  {
    label: "Meal Logs",
    image: undefined,
    query:
      "meal tracking log dashboard with daily nutrition summary dark modern UI",
  },
  {
    label: "Perfect Fit Score",
    image: undefined,
    query:
      "restaurant ranking card with fitness score metrics dark theme emerald accent",
  },
  {
    label: "Diet Settings",
    image: undefined,
    query:
      "diet preferences settings screen with macro goals dark theme fitness app",
  },
];

export function UIShowcaseSection() {
  return (
    <section className="py-24 bg-card overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">
            App Preview
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
            Designed for precision
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            A clean, focused interface that puts your macro goals front and
            center.
          </p>
        </div>

        {/* Screenshot grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
          {screenshots.map((screenshot, index) => (
            <div key={index} className="group relative">
              <div className="aspect-[9/16] md:aspect-[4/3] rounded-xl overflow-hidden bg-secondary border border-border group-hover:border-primary/50 transition-colors relative">
                {screenshot.image ? (
                  <Image
                    src={screenshot.image}
                    alt={screenshot.label}
                    fill
                    className="object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                    unoptimized
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                    <p className="text-xs text-center px-4">
                      {screenshot.label}
                    </p>
                  </div>
                )}
              </div>
              <p className="mt-3 text-sm font-medium text-muted-foreground text-center group-hover:text-foreground transition-colors">
                {screenshot.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
