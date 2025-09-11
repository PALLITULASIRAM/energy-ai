# AI Energy Oracle (React + Vite)

Minimal React + Vite + Tailwind scaffold inspired by the original static prototype.

## Features
- Vite + React 18 + React Router
- Tailwind CSS (basic glass + gradient theme inspired by original)
- Login route (/login) with mock auth -> navigates to /dashboard
- Dashboard placeholder with stat cards + guidance for next steps

# AI Energy Oracle (React + Vite)

Minimal React + Vite + Tailwind scaffold inspired by the original static prototype. Features circular progress indicators, data visualization, and AI-powered insights.

## Features
- Vite + React 18 + React Router + Tailwind CSS
- Circular progress bars for key metrics
- Interactive Chart.js trend visualization
- AI inference with Gemini API integration
- Minimal, polished UI with subtle animations
- Responsive design with glass morphism effects

## Setup

1. **Install dependencies:**
   ```fish
   npm install
   ```

2. **Configure API Key:**
   - Copy `.env.example` to `.env`
   - Add your Gemini API key: `VITE_GEMINI_API_KEY=your_key_here`
   - **Security Note:** For production, move API calls to a backend to avoid exposing keys client-side.

3. **Run development server:**
   ```fish
   npm run dev
   ```
   Open http://localhost:5173

## App Structure
- `/login` - Simple login page (any credentials work)
- `/dashboard` - Main dashboard with:
  - **Basic Stats** tab: Circular progress for data points, units, cost, voltage + trend chart
  - **AI Inference** tab: Monthly bill prediction, consumption patterns, recommendations

## Key Components
- `CircularProgress.jsx` - Animated circular progress indicators
- `TrendChart.jsx` - Chart.js line chart for daily cost trends
- `useEnergyData.js` - Hook for fetching ThingSpeak data + AI prediction
- `Dashboard.jsx` - Main dashboard with tabbed views

## Data Flow
1. Fetches data from ThingSpeak channel 629098
2. Processes daily aggregates and statistics
3. If < 20 days: Uses Gemini AI for prediction
4. If >= 20 days: Uses statistical calculation
5. Displays results in circular progress + chart + AI insights

## Customization
- Update `CHANNEL_ID` in `useEnergyData.js` for different ThingSpeak channels
- Modify color schemes in `CircularProgress.jsx`
- Adjust chart options in `TrendChart.jsx`
- Customize UI in `src/styles.css`

## Build & Deploy
```fish
npm run build
npm run preview
```

---
MIT License.

## Development

```fish
# Install deps
npm install

# Start dev server
npm run dev

# Build
npm run build

# Preview production build
npm run preview
```

## Tailwind IntelliSense
If classes seem not to apply, ensure your editor has the Tailwind CSS IntelliSense extension and that PostCSS is picking up `tailwind.config.cjs`.

---
MIT License.
