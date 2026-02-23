import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";
import {StrictMode} from "react";
import {HashRouter} from "react-router-dom";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </StrictMode>,
)
