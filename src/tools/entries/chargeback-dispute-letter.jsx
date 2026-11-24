import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import DisputeLetterTool from "../DisputeLetterTool";

createRoot(document.getElementById("tool-root")).render(
  <StrictMode>
    <DisputeLetterTool />
  </StrictMode>,
);
