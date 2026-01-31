import { Outlet } from "react-router-dom";
import AppNavbar from "./Navbar";
import AppFooter from "./Footer";
import { useTheme } from "../../context/ThemeContext";
import "../../style/style.css";

export default function Layout({ user, setUser }) {
    const { darkMode } = useTheme();

    return (
        <div
            className={`${darkMode ? "tc-bg-dark" : "tc-bg-light"} d-flex flex-column`}
            style={{ minHeight: "100vh" }}
            data-bs-theme={darkMode ? "dark" : "light"}
        >
            <AppNavbar user={user} setUser={setUser}/>
            <main className="flex-grow-1">
                <Outlet />
            </main>

            <AppFooter />
        </div>
    );
}
