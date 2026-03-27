import { HelmetProvider } from "react-helmet-async";
import AppRouter from "./router";
import { ThemeModeProvider } from "./context/ThemeModeContext";
import { Analytics } from "@vercel/analytics/react";
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://678c5ddf8669769c2199994e3567c3ba@o4511094071164928.ingest.us.sentry.io/4511094077587456",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
});

function App() {
  return (
    <>
      <HelmetProvider>
        <ThemeModeProvider>
          <AppRouter />
        </ThemeModeProvider>
      </HelmetProvider>
      <Analytics />
    </>
  );
}

export default App;
