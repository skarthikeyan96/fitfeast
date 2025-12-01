import { Target, Search, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: Target,
    step: "01",
    title: "Enter your goals",
    description:
      'Set your calories, protein targets, diet preferences, or mood — like "high-protein lunch" or "low-carb dinner nearby."',
  },
  {
    icon: Search,
    step: "02",
    title: "FeastFit searches Yelp AI",
    description:
      "Instantly finds top restaurants with macro-friendly dishes. See estimated protein, calories, and AI confidence scores.",
  },
  {
    icon: TrendingUp,
    step: "03",
    title: "Log meals & get guidance",
    description:
      "Track meals as a guest or with your account. AI Coach recommends daily and weekly choices to keep you on track.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-24 bg-card">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-primary font-semibold text-sm uppercase tracking-wider mb-3">
            How it Works
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
            Three steps to macro-smart eating
          </h2>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-full h-px bg-gradient-to-r from-primary/50 to-transparent" />
              )}

              <div className="relative bg-secondary/30 border border-border rounded-2xl p-8 hover:border-primary/50 transition-colors">
                {/* Step number */}
                <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {step.step}
                </div>

                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <step.icon className="w-7 h-7 text-primary" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
