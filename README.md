# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ["./tsconfig.node.json", "./tsconfig.app.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    "react-x": reactX,
    "react-dom": reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs["recommended-typescript"].rules,
    ...reactDom.configs.recommended.rules,
  },
});
```

# Calendar App

A single-page application that displays events from a public Google Calendar. The goal is to provide a clean, performant, and user-friendly interface for visualizing a schedule, built as a modern frontend application that fetches data from an external API and presents it in an intuitive way.

## Core Features

- **Dual Calendar Views**:
  - **Month View**: Provides a high-level, "at-a-glance" overview of an entire month.
  - **Week View**: Offers a detailed, hourly breakdown of the week, allowing users to see the precise timing and duration of events.
- **Standardized Timezone**: All events, regardless of their original timezone, are converted to and displayed in **"America/New_York"** to ensure consistency and prevent day-shifting bugs.
- **Interactive UI Elements**:
  - **Event Tooltips**: Hover over an event to see its full title, description, and time.
  - **Default 6 AM Start**: The `WeekView` automatically scrolls to 6 AM on load, focusing on the most active part of the day.
  - **Live Time Indicator**: A dynamic red line in the `WeekView` indicates the current time for a real-time reference.
- **Performance Optimized**: Utilizes memoization and caching to ensure a smooth and responsive user experience, even with a large number of events.

## Technology Stack

- **React**: The core UI library used for building the component-based user interface.
- **TypeScript**: Adds static typing to JavaScript to improve code quality and catch errors early.
- **Vite**: A next-generation build tool that provides an extremely fast development server and optimized production builds.
- **Tailwind CSS**: A utility-first CSS framework used for efficient styling.

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/calendar-app.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd calendar-app
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```

### Configuration

This project requires a Google API Key and a Google Calendar ID to fetch events.

1.  Create a file named `.env` in the root of the project.
2.  Add the following variables to the `.env` file, replacing the placeholder values with your actual credentials:

    ```env
    # Get your API key from the Google Cloud Console: https://console.cloud.google.com/
    VITE_GOOGLE_API_KEY="YOUR_GOOGLE_API_KEY"

    # The ID of the public Google Calendar you want to display events from.
    # You can find this in your Google Calendar settings under "Integrate calendar".
    VITE_GOOGLE_CALENDAR_ID="YOUR_GOOGLE_CALENDAR_ID"
    ```

## Available Scripts

In the project directory, you can run:

- `npm run dev`: Starts the development server at `http://localhost:5173`.
- `npm run build`: Builds the app for production to the `dist` folder.
- `npm run lint`: Lints the code using ESLint to find and fix problems.
- `npm run preview`: Serves the production build locally to preview it before deployment.

## Project Structure

The code is organized into a logical and maintainable structure within the `src` directory:

```
/src
|-- /components     # Reusable React components (MonthView.tsx, WeekView.tsx).
|-- /services       # Handles external API communication (googleCalendarApi.ts).
|-- /utils          # Contains helper functions, constants, and shared logic.
|   |-- dateTime.ts # Centralizes all date/time manipulation and timezone logic.
|-- /types          # Holds custom TypeScript type definitions (e.g., for Events).
|-- App.tsx         # The main application component, handling routing and layout.
|-- main.tsx        # The entry point of the application.
```

## Key Technical Implementations

### Google Calendar Integration

The application fetches data from the Google Calendar API using the `axios` library inside `src/services/googleCalendarApi.ts`. It requires the two environment variables (`VITE_GOOGLE_API_KEY` and `VITE_GOOGLE_CALENDAR_ID`) to authenticate and identify the target calendar.

### Advanced Timezone Handling & Performance

A significant challenge in this project was correctly and efficiently handling timezones. Initial implementations led to two issues: events appearing on the wrong day and UI lag.

**The Problem:**

1.  **Incorrect Date Filtering**: Events were being filtered by day _before_ their times were converted from their source timezone (e.g., UTC) to the app's display timezone ("America/New_York"). This caused events scheduled late in the UTC day to incorrectly shift to the next day in the UI.
2.  **Performance Bottleneck**: Timezone conversions were being performed repeatedly inside the render logic, which is computationally expensive and caused noticeable lag.

**The Solution:**
A multi-layered solution was implemented to fix both issues:

1.  **Centralized Logic**: All date and timezone logic was consolidated into `src/utils/dateTime.ts` to create a single, reliable source of truth.
2.  **Pre-computation with `useMemo`**: In both the `WeekView` and `MonthView` components, the raw event list from the API is now processed inside a `useMemo` hook. This hook runs only when the event data changes. It iterates through the events _once_, converts all start and end times to the "America/New_York" timezone, and stores this processed list. The components then use this pre-processed data for all filtering and rendering, ensuring correctness.
3.  **Caching with `Map`**: To make the `useMemo` hook even faster, the underlying `convertToTimezone` function in `dateTime.ts` uses a `Map` as a cache. Before performing a conversion, it checks if the result for a specific timestamp is already cached. If so, it returns the value instantly, avoiding redundant, expensive calculations.

This strategy of pre-processing data and caching results ensures that the application is not only displaying times correctly but is also highly performant and responsive.
