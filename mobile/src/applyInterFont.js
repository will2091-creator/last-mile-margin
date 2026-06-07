import React from "react";
import { StyleSheet, Text } from "react-native";

// Maps a React Native fontWeight to the corresponding loaded Inter variant.
const WEIGHT_TO_INTER = {
  "100": "Inter_400Regular",
  "200": "Inter_400Regular",
  "300": "Inter_400Regular",
  "400": "Inter_400Regular",
  normal: "Inter_400Regular",
  "500": "Inter_500Medium",
  "600": "Inter_600SemiBold",
  "700": "Inter_700Bold",
  bold: "Inter_700Bold",
  "800": "Inter_800ExtraBold",
  "900": "Inter_900Black",
};

let applied = false;

// Patches the base <Text> renderer once so every Text in the app is rendered
// in the Inter variant that matches its fontWeight. Idempotent.
export function applyInterFont() {
  if (applied || !Text || typeof Text.render !== "function") return;
  applied = true;

  const originalRender = Text.render;
  Text.render = function patchedTextRender(...args) {
    const element = originalRender.apply(this, args);
    const flattened = StyleSheet.flatten(element.props.style) || {};
    const family = WEIGHT_TO_INTER[String(flattened.fontWeight ?? "400")] || "Inter_400Regular";
    return React.cloneElement(element, {
      style: [{ fontFamily: family }, element.props.style],
    });
  };
}
