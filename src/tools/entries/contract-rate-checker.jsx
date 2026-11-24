import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ContractCheckerTool from "../ContractCheckerTool";

createRoot(document.getElementById("tool-root")).render(
  <StrictMode>
    <ContractCheckerTool />
  </StrictMode>,
);
