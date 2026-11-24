const offers = {
  "route-profit-calculator": {
    title: "See what every route earns.",
    description: "Save route days and track margin over time, so one good day doesn’t hide a route that’s losing money.",
  },
  "contract-rate-checker": {
    title: "Track margin after you sign.",
    description: "Compare contracts against your actual route revenue, costs, and deductions as the work comes in.",
  },
  "chargeback-dispute-letter": {
    title: "Stay on top of every dispute.",
    description: "Keep claims, deadlines, and evidence together from the first deduction to the final decision.",
  },
  "driver-pay-calculator": {
    title: "See what crew pay does to profit.",
    description: "Track payroll costs alongside the revenue, fuel, and claims for every route you run.",
  },
};

export default function ToolUpgrade({ source }) {
  const { title, description } = offers[source];

  return (
    <section className="tool-upgrade">
      <p className="site-kicker">Last Mile Margin</p>
      <h3>{title}</h3>
      <p>{description}</p>
      <a href={`/?auth=signup&from=${source}`} className="site-button">
        Start 3-day free trial <span aria-hidden="true">↗</span>
      </a>
      <p className="upgrade-price">$99/month for your first 12 months, then $199/month. Cancel anytime.</p>
    </section>
  );
}
