const screenshots = [
  {
    label: "Search Page",
    query:
      "modern fitness app search interface dark theme with emerald accents showing restaurant search results",
  },
  {
    label: "Macro-Friendly Dishes",
    query:
      "mobile app screen showing food dishes with protein calories macros nutrition info dark theme",
  },
  {
    label: "AI Refinement",
    query:
      "AI chat interface for meal recommendations dark theme with emerald green accents",
  },
  {
    label: "Meal Logs",
    query:
      "meal tracking log dashboard with daily nutrition summary dark modern UI",
  },
  {
    label: "Perfect Fit Score",
    query:
      "restaurant ranking card with fitness score metrics dark theme emerald accent",
  },
  {
    label: "Diet Settings",
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
              <div className="aspect-[9/16] md:aspect-[4/3] rounded-xl overflow-hidden bg-secondary border border-border group-hover:border-primary/50 transition-colors">
                <img
                  src={`/.jpg?height=400&width=300&query=${encodeURIComponent(
                    screenshot.query
                  )}`}
                  alt={screenshot.label}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
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
