/**
 Description: Navbar component, shown on all pages. Displays different navigation links based on user role,
 and includes a dark mode toggle and shopping cart icon with item count badge.

 Created by: Sarah
 Created on: February 2026
 **/

import React from "react";
import { Signal, Moon, Sun, ShoppingCart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { Badge } from "react-bootstrap";
import { useCart } from "../../context/CartContext";
import { ROLE_UI, roleKeyFromUser } from "../../config/roleUi";
import WeatherCard from "../WeatherCard";
import verticalLogo from "../../../public/verticallogo.png";

export default function AppNavbar({ user, setUser, onLogout }) {
    const { darkMode, toggleDarkMode } = useTheme();
    const { plans, addOns, devices } = useCart();
    const location = useLocation();

    const planCount = plans.reduce((sum, p) => sum + (p.lines ?? 1), 0);
    const deviceCount = devices.length;
    const cartCount = planCount + deviceCount;

    // Role-based UI config
    const roleKey = roleKeyFromUser(user);
    const ui = ROLE_UI[roleKey] || ROLE_UI.customer;

    const displayName =
        user?.firstName ||
        user?.raw?.firstName ||
        user?.oauth?.given_name ||
        user?.raw?.given_name ||
        user?.username ||
        user?.raw?.name ||
        user?.email ||
        "there";

    const showCart = !user || roleKey === "customer";
    const showWeather = true;

    const [isLgUp, setIsLgUp] = React.useState(false);

    React.useEffect(() => {
        const onResize = () => setIsLgUp(window.innerWidth >= 992);
        onResize();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const closeNavbar = () => {
        if (window.innerWidth < 992) {
            const navbarCollapse = document.getElementById("teleconnectNavbar");
            if (navbarCollapse && navbarCollapse.classList.contains("show")) {
                navbarCollapse.classList.remove("show");
            }
        }
    };

    // Optional extra safety: close navbar on route change
    React.useEffect(() => {
        closeNavbar();
    }, [location.pathname]);

    return (
        <nav
            className={[
                "navbar navbar-expand-lg sticky-top shadow-sm border-bottom",
                darkMode ? "navbar-dark border-secondary" : "navbar-light",
            ].join(" ")}
            style={{
                backdropFilter: "blur(12px)",
                backgroundColor: darkMode
                    ? "rgba(33,37,41,0.85)"
                    : "rgba(255,255,255,0.85)",
            }}
        >
            <div className="container-xl px-3 py-2 position-relative">
                {/* Brand */}
                <Link
                    className="navbar-brand d-flex align-items-center gap-3"
                    to="/"
                    onClick={closeNavbar}
                >
                    <img
                        src={verticalLogo}
                        alt="SJY Telecom Logo"
                        style={{ height: "45px", objectFit: "contain" }}
                    />
                </Link>

                {/* Weather pill */}
                {showWeather && (
                    <div
                        className="d-none d-lg-flex justify-content-center"
                        style={{
                            position: "absolute",
                            left: "43%",
                            transform: "translateX(-50%)",
                        }}
                    >
                        <WeatherCard />
                    </div>
                )}

                {/* Mobile toggler */}
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#teleconnectNavbar"
                    aria-controls="teleconnectNavbar"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon" />
                </button>

                {/* Collapsible */}
                <div
                    className="collapse navbar-collapse"
                    id="teleconnectNavbar"
                    style={{
                        position: isLgUp ? "static" : "absolute",
                        top: isLgUp ? "auto" : "100%",
                        right: isLgUp ? "auto" : 0,
                        minWidth: isLgUp ? "auto" : 260,
                        padding: isLgUp ? 0 : 16,
                        borderRadius: isLgUp ? 0 : "0 0 16px 16px",
                        boxShadow: isLgUp ? "none" : "0 .5rem 1rem rgba(0,0,0,.15)",
                        backgroundColor: isLgUp
                            ? "transparent"
                            : darkMode
                                ? "rgba(33,37,41,0.95)"
                                : "rgba(255,255,255,0.95)",
                        backdropFilter: isLgUp ? "none" : "blur(12px)",
                        zIndex: 1050,
                    }}
                >
                    {/* Left group */}
                    <ul className="navbar-nav ms-lg-auto mt-0 gap-2">
                        <li className="nav-item">
                            <Link className="nav-link fw-semibold" to="/plans" onClick={closeNavbar}>
                                Plans
                            </Link>
                        </li>

                        {!user ? (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link fw-semibold" to="/login" onClick={closeNavbar}>
                                        Login
                                    </Link>
                                </li>
                            </>
                        ) : (
                            ui.nav.map((item) => (
                                <li className="nav-item" key={item.to}>
                                    <Link
                                        className="nav-link fw-semibold"
                                        to={item.to}
                                        onClick={closeNavbar}
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))
                        )}
                    </ul>

                    <hr className={darkMode ? "border-secondary d-lg-none my-3" : "d-lg-none my-3"} />

                    {/* Right group */}
                    <div className="d-flex flex-column flex-lg-row align-items-end align-items-lg-center ms-lg-3 gap-2">
                        {!user ? (
                            <Link
                                className="btn text-white fw-bold px-4 py-2"
                                to="/register"
                                onClick={closeNavbar}
                                style={{
                                    borderRadius: 999,
                                    background: "linear-gradient(90deg, #7c3aed, #ec4899)",
                                }}
                            >
                                Get Started
                            </Link>
                        ) : (
                            <>
                                <span
                                    className={
                                        darkMode
                                            ? "text-light fw-semibold me-lg-2"
                                            : "text-dark fw-semibold me-lg-2"
                                    }
                                >
                                    Hi, {displayName}
                                </span>
                                <button
                                    type="button"
                                    className={
                                        darkMode
                                            ? "btn btn-outline-light fw-bold"
                                            : "btn btn-outline-secondary fw-bold"
                                    }
                                    onClick={() => {
                                        closeNavbar();
                                        onLogout();
                                    }}
                                >
                                    Logout
                                </button>
                            </>
                        )}

                        <button
                            type="button"
                            className={[
                                "btn d-inline-flex align-items-center justify-content-center",
                                darkMode ? "btn-outline-light" : "btn-outline-secondary",
                            ].join(" ")}
                            onClick={toggleDarkMode}
                            aria-label="Toggle dark mode"
                            style={{ width: 42, height: 42, borderRadius: 10 }}
                        >
                            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        {showCart && (
                            <Link
                                to="/cart"
                                onClick={closeNavbar}
                                className={[
                                    "btn d-inline-flex align-items-center justify-content-center position-relative",
                                    darkMode ? "btn-outline-light" : "btn-outline-secondary",
                                ].join(" ")}
                                style={{ width: 42, height: 42, borderRadius: 10 }}
                            >
                                <ShoppingCart size={24} />
                                {cartCount > 0 && (
                                    <Badge
                                        bg="danger"
                                        pill
                                        className="position-absolute top-0 start-100 translate-middle"
                                    >
                                        {cartCount}
                                    </Badge>
                                )}
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}