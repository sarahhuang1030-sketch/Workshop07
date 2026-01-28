import { Outlet } from "react-router-dom";
import AppNavbar from "./Navbar";
import AppFooter from "./Footer";
import { useTheme } from "../../context/ThemeContext";

// If your theme classes (tc-bg-dark/light) are in a css file, import it once here:
import "../../style/style.css"; // adjust path if needed

export default function Layout() {
    const { darkMode } = useTheme();

    return (
        <div className={darkMode ? "tc-bg-dark" : "tc-bg-light"} style={{ minHeight: "100vh" }}>
            <AppNavbar />
            <main>
                <Outlet />
            </main>
            <AppFooter />
        </div>
    );
}
