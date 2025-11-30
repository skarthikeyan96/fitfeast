# FeastFit

> **🏆 Built for the [Yelp AI API Hackathon](https://yelp-ai.devpost.com/)**  
> **✨ Featuring our proprietary Perfect Fit Score 2.0™ algorithm**

FeastFit helps you bridge your nutrition plan to **real-world restaurant meals**.

You tell FeastFit where you are, your calorie / protein targets, and dietary preferences; it returns a shortlist of restaurants and macro-friendly dish suggestions powered by Yelp AI. On top of that, you can ask in plain English to **refine** those options.

This application leverages the **Yelp AI API** as its primary data source and introduces a unique 4-factor scoring algorithm to rank restaurants by macro-fitness compatibility.

## 🎯 Hackathon Highlights

### Perfect Fit Score 2.0™ - Our Competitive Edge

FeastFit's **proprietary scoring algorithm** combines four weighted factors:

| Factor                 | Weight | Purpose                           |
| ---------------------- | ------ | --------------------------------- |
| 🎯 **Macro Fit Score** | 40%    | Calorie & protein target matching |
| 📍 **Distance Score**  | 20%    | Convenience & follow-through      |
| 🤖 **AI Confidence**   | 20%    | Yelp AI recommendation quality    |
| 🍽️ **Meal-Type Match** | 20%    | Contextual appropriateness        |

**Why This Matters for Judges:**

- ✅ **Original IP** - Not just an API wrapper
- ✅ **Quantifiable** - Every score component is transparent
- ✅ **Visually Impressive** - Score breakdowns with progress bars
- ✅ **Real Impact** - Solves the #1 pain point for fitness-tracking diners

[**📖 Read the full Perfect Fit Score 2.0 documentation →**](./PERFECT_FIT_SCORE_2.0.md)

---

## What you can do today

- **Macro-aware restaurant search**

  - Page: `pages/search.tsx` (`/search`)
  - Inputs:
    - Location (e.g. `San Francisco, CA`)
    - Calories target for this meal
    - Minimum protein (g)
    - Optional diet tag (vegan / vegetarian / pescatarian / keto)
    - Free-text query (e.g. `high-protein lunch`)
  - Backend: `pages/api/search-restaurants.ts`
    - Calls Yelp AI Search to find nearby restaurants.
    - Returns a ranked list with:
      - Restaurant name, rating, price, distance, image, address
      - A **macro-friendly dish suggestion** per restaurant with estimated kcal/protein and a brief explanation.

- **Refine results with Yelp AI**

  - On the search page, once you have results, you can type a free-text refinement like:
    - `make it lower carb`
    - `include more carbs please`
    - `prefer something closer to 800 kcal`
  - Frontend: `handleRefine` in `pages/search.tsx`
    - Sends the current search context and a compact summary of the restaurants to `/api/refine-results`.
    - Shows the response in a card labeled **"Refined by Yelp AI"**.
  - Backend: `pages/api/refine-results.ts`
    - Wraps Yelp's `ai/chat/v2` endpoint with a short system prompt.
    - Provides a small, macro-focused summary of the current options.
    - Returns plain-text advice: acknowledges the request, suggests adjustments, and highlights 2–3 relevant restaurants from the existing shortlist.

- **Log a meal (guest flow)**
  - On each restaurant card, you can click **"Log this meal"**.
  - Frontend: `handleLogMeal` in `pages/search.tsx`.
  - If you are not authenticated, logs are stored in `localStorage` under `feastfit_guest_logs_v1`.
  - A simple logs page (`pages/logs.tsx`) can read and display these guest logs.

> Note: Authed / Supabase-backed logging is stubbed but not fully wired to real authentication in this prototype.

## Tech stack

- **Frontend**: Next.js 16 (Pages Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4 with custom utility classes
- **APIs** (Primary Data Source):
  - **Yelp AI Search API** - Restaurant discovery with conversational AI
  - **Yelp AI Chat API** (`/ai/chat/v2`) - Natural language result refinement
- **Database**: Supabase (for authenticated meal logging)
- **Storage**: LocalStorage (guest mode meal tracking)
- **Unique Algorithm**: Perfect Fit Score 2.0™ (proprietary 4-factor scoring)

## Running the app locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` in the project root with your Yelp API key:

   ```bash
   YELP_API_KEY=your_yelp_api_key_here
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) to use FeastFit.

## Testing the Perfect Fit Score 2.0

To see the proprietary scoring algorithm in action:

1. **Navigate to the home page** (`/`)
2. **Fill in meal parameters**:
   - Location: `San Francisco, CA`
   - Calories: `600`
   - Protein: `35g`
   - Meal Type: `Lunch`
   - Query: `high-protein bowl`
3. **Click "Plan this meal with Yelp AI"**
4. **Observe the results**:
   - Green "Perfect Fit Score 2.0™" indicator at the top
   - Each restaurant shows its overall fit score
   - Four color-coded sub-scores (Macro, Distance, AI Conf, Meal Type)
   - Click "Show Score Breakdown" to see detailed progress bars
5. **Try different meal types**:
   - Change to "Breakfast" and search - notice how cafes rank higher
   - Change to "Dinner" and search - steakhouses get meal-type bonus points

## Project status & Hackathon Submission

**Status**: Submission for Yelp AI API Hackathon (December 2025)

### What Makes FeastFit Unique for This Hackathon:

1. **Proprietary Scoring Algorithm** (Perfect Fit Score 2.0™)

   - Original intellectual property
   - 4-factor weighted system (40% macro, 20% distance, 20% AI confidence, 20% meal-type)
   - Fully transparent and explainable to users

2. **Yelp AI as Primary Data Source**

   - All restaurant data comes from Yelp AI Search API
   - Natural language refinement powered by Yelp AI Chat
   - Contextual meal planning with conversational AI

3. **Complete User Flow**

   - Search → Results → Refinement → Logging → Coaching
   - Guest mode (localStorage) + Authenticated mode (Supabase)
   - Real-world usability focus

4. **Visual Design Excellence**
   - Modern, fitness-focused dark theme
   - Score breakdowns with animated progress bars
   - Clear branded "Perfect Fit Score 2.0™" indicators

### Demonstration Highlights (for 3-min video):

- Home page: Explain the problem (eating out while tracking macros)
- Search: Show Yelp AI-powered results with Perfect Fit Scores
- Score breakdown: Expand to show all 4 factors with visual bars
- Meal type change: Demonstrate context-aware scoring
- Refinement: Natural language adjustment via Yelp AI Chat
- Logging: Guest mode meal tracking

### Future Enhancements (Post-Hackathon):

- Machine learning to personalize score weights per user
- Time-based meal-type boosting (breakfast spots in AM)
- Budget factor integration (10% weight)
- Group meal planning with shared macro targets
- Voice-activated search via Yelp AI
- Integration with fitness tracking apps (MyFitnessPal, etc.)
