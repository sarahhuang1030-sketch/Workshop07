import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import { Moon, Sun, Signal } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";


export default function AppNavbar() {
    const { darkMode, toggleDarkMode } = useTheme();
    const navigate = useNavigate();

    const linkClass = ({ isActive }) =>
        `nav-link ${isActive ? "fw-bold" : ""} ${darkMode ? "text-light" : "text-dark"}`;

    return (
        <div className={`sticky-top ${darkMode ? "tc-header-dark" : "tc-header-light"}`}>
            <Navbar expand="md" className="py-3">
                <Container fluid>
                    <Navbar.Brand
                        className="d-flex align-items-center gap-3"
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate("/")}
                    >
                        <div
                            className="tc-rounded-2xl d-flex align-items-center justify-content-center shadow"
                            style={{
                                width: 48,
                                height: 48,
                                background: "linear-gradient(135deg, #7c3aed, #ec4899, #f97316)",
                            }}
                        >
                            <Signal size={22} color="white" />
                        </div>

                        <div className="lh-1">
                            <div
                                className="fw-black"
                                style={{
                                    fontWeight: 900,
                                    fontSize: "1.35rem",
                                    background: "linear-gradient(90deg, #7c3aed, #ec4899)",
                                    WebkitBackgroundClip: "text",
                                    color: "transparent",
                                }}
                            >
                                TeleConnect
                            </div>
                            <div className={`small ${darkMode ? "tc-muted-dark" : "tc-muted-light"}`}>
                                Stay Connected, Stay You
                            </div>
                        </div>
                    </Navbar.Brand>

                    <Navbar.Toggle aria-controls="tc-nav" />
                    <Navbar.Collapse id="tc-nav">
                        <Nav className="ms-auto align-items-md-center gap-md-3">
                            <NavLink to="/" className={linkClass}>Home</NavLink>
                            <NavLink to="/plans" className={linkClass}>Plans</NavLink>
                            <NavLink to="/login" className={linkClass}>Login</NavLink>
                            {/*<NavLink to="/profile" className={linkClass}>Login</NavLink>*/}

                            <Button
                                variant={darkMode ? "outline-light" : "outline-secondary"}
                                className="d-flex align-items-center justify-content-center"
                                onClick={toggleDarkMode}
                            >
                                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                            </Button>

                            <Button
                                className="fw-bold border-0"
                                style={{
                                    background: "linear-gradient(90deg, #7c3aed, #ec4899)",
                                    borderRadius: 999,
                                    paddingLeft: 18,
                                    paddingRight: 18,
                                }}
                                onClick={() => navigate("/register")}
                            >
                                Join us
                            </Button>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        </div>
    );
}
