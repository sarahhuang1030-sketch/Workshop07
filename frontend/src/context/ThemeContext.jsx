/**Description: ThemeContext provides a React context for managing dark mode state across the app.
 It loads the user's preference from localStorage on mount, and saves any changes back to localStorage.
 Components can use the useTheme hook to access the current mode and toggle function.
 Created by: Sarah
 Created on: February 2026
 **/

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
