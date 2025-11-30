import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Star,
  Flame,
  Dumbbell,
  Sparkles,
  ExternalLink,
  Plus,
  Utensils,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import type { RestaurantOption, DishOption } from "../api/search-restaurants";

interface SearchResultsProps {
  hasSearched: boolean;
  isSearching: boolean;
  results: RestaurantOption[];
  onLogMeal?: (restaurant: RestaurantOption, dish: DishOption) => void;
  canLog?: boolean;
}

export function SearchResults({
  hasSearched,
  isSearching,
  results,
  onLogMeal,
  canLog,
}: SearchResultsProps) {
  if (isSearching) {
    return (
      <div className="max-w-3xl mx-auto mt-12">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 border-3 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground">
            Finding macro-friendly options near you...
          </p>
        </div>
      </div>
    );
  }

  if (!hasSearched) {
    return (
      <div className="max-w-3xl mx-auto mt-12">
        <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card/30">
          <Sparkles className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">
            No results yet. Run a search to find macro-friendly meals.
          </p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="max-w-3xl mx-auto mt-12">
        <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card/30">
          <Sparkles className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">
            No restaurants found. Try adjusting your search criteria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-12">
      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Top Matches</h2>
          <p className="text-sm text-muted-foreground">
            {results.length} macro-friendly option
            {results.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <Badge variant="outline" className="border-primary/30 text-primary">
          <Sparkles className="w-3 h-3 mr-1" />
          AI Ranked
        </Badge>
      </div>

      {/* Results Grid */}
      <div className="space-y-4">
        {results.map((restaurant, index) => {
          // Get the first dish (suggested macro-friendly option)
          const dish = restaurant.dishes[0];
          if (!dish) return null;

          // Format distance
          const distance =
            restaurant.distanceMeters != null
              ? `${(restaurant.distanceMeters / 1609.34).toFixed(1)} mi`
              : "N/A";

          // Determine confidence level
          const confidence =
            dish.confidence >= 0.7
              ? "High"
              : dish.confidence >= 0.5
              ? "Medium"
              : "Low";

          return (
            <ResultCard
              key={restaurant.id}
              restaurant={restaurant}
              dish={dish}
              index={index}
              distance={distance}
              confidence={confidence}
              onLogMeal={onLogMeal}
              canLog={canLog}
            />
          );
        })}
      </div>
    </div>
  );
}

function ResultCard({
  restaurant,
  dish,
  index,
  distance,
  confidence,
  onLogMeal,
  canLog,
}: {
  restaurant: RestaurantOption;
  dish: DishOption;
  index: number;
  distance: string;
  confidence: string;
  onLogMeal?: (restaurant: RestaurantOption, dish: DishOption) => void;
  canLog?: boolean;
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const breakdownScores = restaurant.scoreBreakdown
    ? [
        {
          name: "Macro Fit",
          value: restaurant.scoreBreakdown.macroFitScore,
          color: "bg-blue-400",
          weight: "40%",
        },
        {
          name: "Distance",
          value: restaurant.scoreBreakdown.distanceScore,
          color: "bg-purple-400",
          weight: "20%",
        },
        {
          name: "AI Confidence",
          value: restaurant.scoreBreakdown.aiConfidenceScore,
          color: "bg-pink-400",
          weight: "20%",
        },
        {
          name: "Meal Type",
          value: restaurant.scoreBreakdown.mealTypeScore,
          color: "bg-amber-400",
          weight: "20%",
        },
      ]
    : [];

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border hover:border-primary/30 transition-all overflow-hidden group">
      <CardContent className="p-0">
        <div className="flex items-stretch">
          {/* Rank Badge */}
          <div className="w-12 bg-primary/10 flex items-center justify-center border-r border-border">
            <span className="text-lg font-bold text-primary">#{index + 1}</span>
          </div>

          {/* Image */}
          <div className="w-28 h-28 shrink-0 bg-secondary/50 overflow-hidden">
            {restaurant.imageUrl ? (
              <img
                src={restaurant.imageUrl}
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                <Utensils className="w-8 h-8" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {dish.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {restaurant.name}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Perfect Fit Score */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {restaurant.fitScore}
                  </div>
                  <div className="text-xs text-muted-foreground">Fit Score</div>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              {distance !== "N/A" && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  {distance}
                </div>
              )}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                {restaurant.rating.toFixed(1)}
              </div>
              <div className="flex items-center gap-1 text-sm text-orange-400">
                <Flame className="w-3.5 h-3.5" />
                {dish.estimatedCalories} cal
              </div>
              <div className="flex items-center gap-1 text-sm text-blue-400">
                <Dumbbell className="w-3.5 h-3.5" />
                {dish.estimatedProtein}g protein
              </div>
              <Badge
                variant="outline"
                className={`text-xs ${
                  confidence === "High"
                    ? "border-green-500/30 text-green-400"
                    : confidence === "Medium"
                    ? "border-yellow-500/30 text-yellow-400"
                    : "border-orange-500/30 text-orange-400"
                }`}
              >
                {confidence} confidence
              </Badge>
            </div>

            {/* Score Breakdown */}
            {restaurant.scoreBreakdown && (
              <div className="mt-4 pt-3 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  {showBreakdown ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                  <span className="font-medium">
                    {showBreakdown ? "Hide" : "Show"} Perfect Fit Score 2.0™
                    Breakdown
                  </span>
                </button>

                {showBreakdown && (
                  <div className="mt-3 space-y-2.5">
                    {breakdownScores.map((score) => (
                      <div key={score.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-2 w-2 rounded-full ${score.color}`}
                            />
                            <span className="text-foreground font-medium">
                              {score.name}
                            </span>
                            <span className="text-muted-foreground">
                              ({score.weight})
                            </span>
                          </div>
                          <span className="font-semibold text-foreground">
                            {score.value}/100
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                          <div
                            className={`h-full rounded-full ${score.color} transition-all duration-500`}
                            style={{ width: `${score.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="mt-2 pt-2 border-t border-border/30 text-[10px] text-muted-foreground">
                      Perfect Fit Score = (Macro × 40%) + (Distance × 20%) + (AI
                      Conf × 20%) + (Meal Type × 20%)
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 p-4 border-l border-border bg-secondary/20">
            {restaurant.url && (
              <Button
                size="sm"
                variant="ghost"
                className="h-9 text-muted-foreground hover:text-primary"
                asChild
              >
                <a href={restaurant.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            )}
            {canLog && onLogMeal && (
              <Button
                size="sm"
                className="h-9 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => onLogMeal(restaurant, dish)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
