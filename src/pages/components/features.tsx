import { Utensils, Bot, Trophy, Smartphone, ClipboardList } from "lucide-react";

const features = [
  {
    icon: Utensils,
    title: "Macro-Aware Restaurant Search",
    description:
      "Find dishes matching your calories, protein, and diet targets at restaurants near you.",
  },
  {
    icon: Bot,
    title: "AI Meal Coach",
    description:
      'Ask: "How do I hit 160g protein today?" or "Plan meals for tomorrow near me."',
  },
  {
    icon: Trophy,
    title: "Perfect Fit Score 2.0",
    description:
      "A proprietary ranking system combining distance, macro fit, AI confidence, and meal type.",
  },
  {
    icon: Smartphone,
    title: "Works Everywhere (PWA)",
    description:
      "Install on iOS, Android, or desktop. Fast, offline-ready shell for instant access.",
  },
  {
    icon: ClipboardList,
    title: "Meal Logging",
    description:
      "Sync logs to your account or keep them locally as a guest. Your data, your choice.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">
            Features
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
            Everything you need to eat smarter
          </h2>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
