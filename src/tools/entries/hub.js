import { computeRouteResults, getGrade } from "../../lib/routeProfit";
import { cleanForm, money, pct } from "../format";
import { ROUTE_EXAMPLE } from "../lib/routeExample";

const demo = document.querySelector("[data-route-demo]");
const slider = demo.querySelector("input");
const routeLink = demo.querySelector("[data-route-link]");
const example = cleanForm(ROUTE_EXAMPLE);

function updateDemo() {
  const routePay = Number(slider.value);
  const route = computeRouteResults({ ...example, routePay });
  const grade = getGrade(route);
  const tone = route.netProfit < 0 ? "bad" : route.profitMargin < 0.15 ? "warn" : "good";

  slider.setAttribute("aria-valuetext", `${money(routePay)} per route day`);
  demo.dataset.tone = tone;
  demo.querySelector("[data-demo-pay]").textContent = money(routePay);
  demo.querySelector("[data-demo-profit]").textContent = money(route.netProfit);
  demo.querySelector("[data-demo-margin]").textContent = `${pct(route.profitMargin)} margin`;
  demo.querySelector("[data-demo-grade]").textContent = `Grade ${grade.grade}`;
  demo.style.setProperty("--profit-width", `${Math.max(0, route.profitMargin) * 100}%`);
  routeLink.hash = `calc?routePay=${routePay}`;
}

slider.addEventListener("input", updateDemo);
updateDemo();
