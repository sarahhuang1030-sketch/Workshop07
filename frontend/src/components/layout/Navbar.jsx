import React from "react";
import { Signal, Moon, Sun, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { Badge } from "react-bootstrap";
import { useCart } from "../../context/CartContext";

export default function AppNavbar({ user, setUser }) {
    const { darkMode, toggleDarkMode } = useTheme();
    const navigate = useNavigate();
    const { plan, addOns } = useCart();

    // Calculate total cart items (plan counts as 1)
    const cartCount = (plan ? 1 : 0) + addOns.length;

    const handleLogout = () => {
        localStorage.removeItem("tc_user");
        setUser(null);
        navigate("/");
    };

    const displayName =
        user?.firstName ||
        user?.oauth?.given_name ||
        user?.raw?.given_name ||
        user?.email ||
        "there";

    return (
        <nav
            className={[
                "navbar navbar-expand-lg sticky-top shadow-sm border-bottom",
                darkMode ? "navbar-dark border-secondary" : "navbar-light",
            ].join(" ")}
            style={{
                backdropFilter: "blur(12px)",
                backgroundColor: darkMode ? "rgba(33,37,41,0.85)" : "rgba(255,255,255,0.85)",
            }}
        >
            <div className="container-xl px-3 py-2">
                {/* Brand */}
                <Link className="navbar-brand d-flex align-items-center gap-3" to="/">
                    <div
                        className="d-flex align-items-center justify-content-center shadow"
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: 16,
                            background: "linear-gradient(135deg, rgb(168,85,247), rgb(236,72,153), rgb(249,115,22))",
                        }}
                    >
                        <Signal size={22} color="white" />
                    </div>
                    <div className="lh-sm">
                        <div
                            className="fw-black"
                            style={{
                                fontSize: "1.35rem",
                                fontWeight: 900,
                                background: "linear-gradient(90deg, rgb(147,51,234), rgb(236,72,153))",
                                WebkitBackgroundClip: "text",
                                color: "transparent",
                            }}
                        >
                            TeleConnect
                        </div>
                        <div className={darkMode ? "text-secondary small fw-semibold" : "text-muted small fw-semibold"}>
                            Stay Connected, Stay You
                        </div>
                    </div>
                </Link>

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

                {/* Links */}
                <div className="collapse navbar-collapse" id="teleconnectNavbar">
                    <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-2 mt-3 mt-lg-0">
                        <li className="nav-item">
                            <Link className="nav-link fw-semibold" to="/plans">Plans</Link>
                        </li>

                        {!user ? (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link fw-semibold" to="/login">Login</Link>
                                </li>
                                <li className="nav-item ms-lg-2">
                                    <Link
                                        className="btn text-white fw-bold px-4 py-2"
                                        to="/register"
                                        style={{ borderRadius: 999, background: "linear-gradient(90deg, #7c3aed, #ec4899)" }}
                                    >
                                        Get Started
                                    </Link>
                                </li>
                            </>
                        ) : (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link fw-semibold" to="/profile">Profile</Link>
                                </li>
                                <li className="nav-item ms-lg-2">
                                    <button
                                        type="button"
                                        className={darkMode ? "btn btn-outline-light fw-bold" : "btn btn-outline-secondary fw-bold"}
                                        onClick={handleLogout}
                                    >
                                        Logout
                                    </button>
                                </li>
                            </>
                        )}

                        {/* Theme toggle */}
                        <li className="nav-item ms-lg-2">
                            <button
                                type="button"
                                className={["btn d-inline-flex align-items-center justify-content-center",
                                    darkMode ? "btn-outline-light" : "btn-outline-secondary"
                                ].join(" ")}
                                onClick={toggleDarkMode}
                                aria-label="Toggle dark mode"
                                style={{ width: 42, height: 42, borderRadius: 10 }}
                            >
                                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                        </li>

                        {/* Shopping cart icon */}
                        <li className="nav-item ms-lg-2">
                            <Link to="/cart" className="position-relative text-decoration-none">
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
                        </li>

                        {user && (
                            <li className="nav-item me-lg-2">
                              <span className={darkMode ? "nav-link text-light fw-semibold" : "nav-link text-dark fw-semibold"}>
                                Hi, {displayName}
                              </span>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
}
