# FeastFit

FeastFit helps you bridge your nutrition plan to **real-world restaurant meals**.

You tell FeastFit where you are, your calorie / protein targets, and dietary preferences; it returns a shortlist of restaurants and macro-friendly dish suggestions. On top of that, you can ask in plain English to **refine** those options using Yelp AI.

This is a prototype built on Next.js (Pages Router).

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

- **Frontend**: Next.js (Pages Router), React, TypeScript
- **Styling**: Tailwind-style utility classes (no separate component library yet)
- **APIs**:
  - Yelp AI Search for the initial restaurant shortlist
  - Yelp AI Chat (`/ai/chat/v2`) for refinement
  - LocalStorage for guest meal logs

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

4. Open [http://localhost:3000/search](http://localhost:3000/search) to use FeastFit.

## Project status

This is an early prototype focused on:

- Proving out macro-aware restaurant search using Yelp AI
- Demonstrating a **single-turn refinement** step rather than a full conversational agent
- Simple guest logging to show how meals could later be tracked per user

Possible next directions (not implemented yet):

- Real user auth and persistent, per-user logs
- More detailed nutrition breakdowns (carbs/fats) per dish
- A richer "coach" experience that reasons over logs + searches across multiple days
