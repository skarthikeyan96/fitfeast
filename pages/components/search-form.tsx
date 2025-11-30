import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Flame,
  Dumbbell,
  Salad,
  Clock,
  Sparkles,
  Search,
  Target,
  Zap,
} from "lucide-react";
import type {
  RestaurantOption,
  SearchRestaurantsResponse,
} from "../api/search-restaurants";

interface SearchFormProps {
  onSearch: (data: {
    location: string;
    caloriesTarget: number;
    proteinMin: number;
    diet: string | null;
    mealType: "breakfast" | "lunch" | "dinner" | "snack";
    query: string;
  }) => Promise<void>;
  isSearching: boolean;
  initialData?: {
    location?: string;
    caloriesTarget?: number;
    proteinMin?: number;
    diet?: string | null;
    mealType?: "breakfast" | "lunch" | "dinner" | "snack";
    query?: string;
  };
}

export function SearchForm({
  onSearch,
  isSearching,
  initialData,
}: SearchFormProps) {
  const [formData, setFormData] = useState({
    location: initialData?.location || "San Francisco, CA",
    calories: String(initialData?.caloriesTarget || 600),
    protein: String(initialData?.proteinMin || 35),
    diet: initialData?.diet || "none",
    mealType: initialData?.mealType || "lunch",
    mood: initialData?.query || "high-protein lunch",
  });

  const handleSearch = async () => {
    await onSearch({
      location: formData.location,
      caloriesTarget: Number(formData.calories),
      proteinMin: Number(formData.protein),
      diet: formData.diet === "none" ? null : formData.diet,
      mealType: formData.mealType as "breakfast" | "lunch" | "dinner" | "snack",
      query: formData.mood,
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 relative z-10">
      {/* Page Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          AI-Powered Search
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 text-balance">
          Find Your <span className="text-primary">Perfect Meal</span>
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
          Enter your macro targets and let FeastFit find macro-friendly dishes
          at restaurants near you.
        </p>
      </div>

      {/* Search Form Card */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8 shadow-xl shadow-black/20">
          {/* Quick Stats Row */}
          <div className="flex items-center justify-center gap-6 mb-8 pb-6 border-b border-border/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="w-4 h-4 text-primary" />
              <span>Macro Targeting</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="w-4 h-4 text-primary" />
              <span>Real-time Results</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>AI Confidence</span>
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Location */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Location
              </Label>
              <Input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="Enter city or address"
                className="h-12 bg-input border-border focus:border-primary focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Calories */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                Calories Target
              </Label>
              <Input
                type="number"
                value={formData.calories}
                onChange={(e) =>
                  setFormData({ ...formData, calories: e.target.value })
                }
                placeholder="Target calories"
                className="h-12 bg-input border-border focus:border-primary focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Protein */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-blue-400" />
                Minimum Protein (g)
              </Label>
              <Input
                type="number"
                value={formData.protein}
                onChange={(e) =>
                  setFormData({ ...formData, protein: e.target.value })
                }
                placeholder="Min protein in grams"
                className="h-12 bg-input border-border focus:border-primary focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Diet Preference */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Salad className="w-4 h-4 text-green-400" />
                Diet Preference
              </Label>
              <Select
                value={formData.diet}
                onValueChange={(value) =>
                  setFormData({ ...formData, diet: value })
                }
              >
                <SelectTrigger className="h-12 bg-input border-border focus:border-primary focus:ring-primary/20 text-foreground">
                  <SelectValue placeholder="Select diet" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="keto">Keto</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                  <SelectItem value="vegetarian">Vegetarian</SelectItem>
                  <SelectItem value="pescatarian">Pescatarian</SelectItem>
                  <SelectItem value="paleo">Paleo</SelectItem>
                  <SelectItem value="gluten-free">Gluten-Free</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Meal Type */}
            <div className="space-y-2 md:col-span-2 md:max-w-[calc(50%-12px)]">
              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                Meal Type
              </Label>
              <Select
                value={formData.mealType}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    mealType: value as
                      | "breakfast"
                      | "lunch"
                      | "dinner"
                      | "snack",
                  })
                }
              >
                <SelectTrigger className="h-12 bg-input border-border focus:border-primary focus:ring-primary/20 text-foreground">
                  <SelectValue placeholder="Select meal type" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mood / Natural Language Input */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                What are you in the mood for?
              </Label>
              <div className="relative">
                <Input
                  type="text"
                  value={formData.mood}
                  onChange={(e) =>
                    setFormData({ ...formData, mood: e.target.value })
                  }
                  placeholder="e.g., high-protein lunch, light salad, hearty dinner..."
                  className="h-14 bg-input border-border focus:border-primary focus:ring-primary/20 text-foreground placeholder:text-muted-foreground pr-4"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                  AI Enhanced
                </div>
              </div>
            </div>
          </div>

          {/* Search Button */}
          <div className="mt-8">
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
            >
              {isSearching ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                  Searching restaurants...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Search Restaurants
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
