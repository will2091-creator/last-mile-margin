import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import DriverPayTool from "../DriverPayTool";

createRoot(document.getElementById("tool-root")).render(
  <StrictMode>
    <DriverPayTool />
  </StrictMode>,
);
