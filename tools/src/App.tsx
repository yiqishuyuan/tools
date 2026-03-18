import { HelmetProvider } from "react-helmet-async";
import AppRouter from "./router";
import { ThemeModeProvider } from "./context/ThemeModeContext";
import { Analytics } from "@vercel/analytics/react";

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
