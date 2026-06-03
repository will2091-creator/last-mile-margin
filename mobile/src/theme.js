export const theme = {
  colors: {
    background: "#eef3f8",
    card: "#ffffff",
    ink: "#070b1f",
    muted: "#65758b",
    border: "#dbe3ee",
    blue: "#2563eb",
    green: "#059669",
    red: "#dc2626",
    amber: "#b45309",
  },
};

export const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
