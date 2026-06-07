import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getTheme } from "./theme";

const STORAGE_KEY = "finalMileThemeMode";

const ThemeContext = createContext({
  mode: "light",
  colors: getTheme("light").colors,
  isDark: false,
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState("light");

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (active && (stored === "dark" || stored === "light")) setMode(stored);
    });
    return () => {
      active = false;
    };
  }, []);

  const toggleTheme = () => {
    setMode((current) => {
      const next = current === "dark" ? "light" : "dark";
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  };

  const value = {
    mode,
    colors: getTheme(mode).colors,
    isDark: mode === "dark",
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
