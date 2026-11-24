import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import RouteProfitTool from "../RouteProfitTool";

createRoot(document.getElementById("tool-root")).render(
  <StrictMode>
    <RouteProfitTool />
  </StrictMode>,
);
