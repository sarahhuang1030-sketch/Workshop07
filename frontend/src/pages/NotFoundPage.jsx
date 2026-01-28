import { Container, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function NotFoundPage() {
    const { darkMode } = useTheme();

    return (
        <div
            className="d-flex align-items-center justify-content-center"
            style={{
                minHeight: "80vh",
                background: darkMode
                    ? "linear-gradient(135deg, #020617, #1e1b4b)"
                    : "linear-gradient(135deg, #f5f3ff, #eef2ff)",
            }}
        >
            <Container className="text-center">
                <div
                    className="mx-auto mb-4 d-flex align-items-center justify-content-center"
                    style={{
                        width: 96,
                        height: 96,
                        borderRadius: 24,
                        background: "linear-gradient(135deg, #7c3aed, #ec4899)",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
                    }}
                >
                    <AlertTriangle size={44} color="white" />
                </div>

                <h1
                    className={`fw-black mb-3 ${
                        darkMode ? "text-light" : "text-dark"
                    }`}
                    style={{ fontWeight: 900, fontSize: "3rem" }}
                >
                    404
                </h1>

                <h2
                    className={`fw-bold mb-3 ${
                        darkMode ? "text-light" : "text-dark"
                    }`}
                >
                    Page Not Found
                </h2>

                <p
                    className="mb-4"
                    style={{
                        maxWidth: 480,
                        margin: "0 auto",
                        color: darkMode
                            ? "rgba(255,255,255,0.65)"
                            : "rgba(0,0,0,0.6)",
                    }}
                >
                    Oops! The page you’re looking for doesn’t exist or may have been moved.
                </p>

                <Button
                    as={Link}
                    to="/"
                    className="fw-bold border-0"
                    style={{
                        background: "linear-gradient(90deg, #7c3aed, #ec4899)",
                        borderRadius: 999,
                        padding: "0.75rem 1.75rem",
                    }}
                >
                    Go Back Home
                </Button>
            </Container>
        </div>
    );
}
