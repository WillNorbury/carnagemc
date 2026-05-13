import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { bootstrapTheme } from "./lib/preferences";

bootstrapTheme();

createRoot(document.getElementById("root")!).render(<App />);
