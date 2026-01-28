import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [darkMode, setDarkMode] = useState(false);

    // Load saved mode
    useEffect(() => {
        const saved = localStorage.getItem("tc_darkMode");
        if (saved !== null) setDarkMode(saved === "true");
    }, []);

    // Save mode
    useEffect(() => {
        localStorage.setItem("tc_darkMode", String(darkMode));
    }, [darkMode]);

    const toggleDarkMode = () => setDarkMode((v) => !v);

    return (
        <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
    return ctx;
}
