// src/context/ThemeContext.tsx
import React, { createContext, useState, useContext, useEffect } from "react";

type ThemeMode = "dark" | "light";

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Try to get the saved theme from localStorage, default to 'dark'
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    // Verificar si hay un tema guardado en localStorage
    const savedTheme = localStorage.getItem("libgantt-theme");

    // Verificar si hay una preferencia de sistema
    if (!savedTheme) {
      const prefersDarkMode = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      return prefersDarkMode ? "dark" : "light";
    }

    return (savedTheme as ThemeMode) || "dark";
  });

  // Update the document with the current theme
  useEffect(() => {
    // Aplicar el tema al elemento html
    document.documentElement.setAttribute("data-theme", theme);
    // Guardar la preferencia en localStorage
    localStorage.setItem("libgantt-theme", theme);

    // Opcionalmente, puedes también cambiar la clase en el body si es necesario
    if (theme === "dark") {
      document.body.classList.add("dark-theme");
      document.body.classList.remove("light-theme");
    } else {
      document.body.classList.add("light-theme");
      document.body.classList.remove("dark-theme");
    }
  }, [theme]);

  // Añadir un listener para cambios en preferencia del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      // Solo cambiar automáticamente si el usuario no ha explícitamente elegido un tema
      if (!localStorage.getItem("libgantt-theme")) {
        setThemeState(mediaQuery.matches ? "dark" : "light");
      }
    };

    // Añadir listener
    mediaQuery.addEventListener("change", handleChange);

    // Limpieza al desmontar
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = () => {
    setThemeState((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeContext;
