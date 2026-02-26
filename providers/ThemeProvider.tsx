"use client";

{/* Not In Use right , for future use */}
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: "dark", toggle: () => {} });

export function useTheme() { return useContext(ThemeContext); }

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("tars-theme") as Theme | null;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    // Set data-theme attribute — drives all CSS var() tokens
    html.setAttribute("data-theme", theme);

    if (theme === "light") {
      // Force white background on BOTH html and body — nothing stays black
      html.style.background = "#f4f4f8";
      body.style.background = "#f4f4f8";
      body.style.color = "#0f0f14";
    } else {
      html.style.background = "#000000";
      body.style.background = "#000000";
      body.style.color = "#ffffff";
    }

    localStorage.setItem("tars-theme", theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}