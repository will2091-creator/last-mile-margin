import { guidedDemoSteps } from "./guidedDemoContent.js";

export const productTourSteps = guidedDemoSteps.map((step) => ({
  id: `tour-${step.id}`,
  tab: step.tab,
  title: step.title,
  description: `${step.lesson} ${step.why}`,
  fallback: step.lesson,
  selectors: [step.selector],
  nextLabel: step.nextLabel,
}));
