// Light + dark palettes. The dark values mirror the web app's dark theme so
// the two products read as one brand. `theme` stays exported as the light
// palette for backward compatibility with screens that read it at module load.
export const palettes = {
  light: {
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
  dark: {
    background: "#020617",
    card: "#0f172a",
    ink: "#f8fafc",
    muted: "#94a3b8",
    border: "rgba(255,255,255,0.10)",
    blue: "#60a5fa",
    green: "#34d399",
    red: "#f87171",
    amber: "#fbbf24",
  },
};

// getTheme("dark") -> { colors }. Screens can opt into theming by building
// their StyleSheet from getTheme(mode).colors inside the component.
export function getTheme(mode = "light") {
  return { colors: palettes[mode] || palettes.light };
}

export const theme = { colors: palettes.light };

export const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
