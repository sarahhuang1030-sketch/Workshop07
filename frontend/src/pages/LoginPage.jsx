import { useState } from "react";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";
import { useTheme } from "../context/ThemeContext";
import { Signal, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const { darkMode } = useTheme();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(true);
    const [showPw, setShowPw] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const mutedClass = darkMode ? "tc-muted-dark" : "tc-muted-light";

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // basic validation (frontend only)
        if (!email.trim() || !password.trim()) {
            setError("Please enter your email and password.");
            return;
        }

        // TODO later: call backend login endpoint
        // fetch("/api/auth/login", { ... })

        setSuccess("Login submitted (wire backend later).");
    };

    return (
        <div
            className="d-flex align-items-center"
            style={{
                minHeight: "calc(100vh - 140px)",
                padding: "2rem 0"
            }}
        >
            <Container>
                <Row className="justify-content-center">
                    <Col md={6} lg={5}>
                        <div className="text-center mb-4">
                            <div
                                className="mx-auto mb-3 d-flex align-items-center justify-content-center shadow"
                                style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 18,
                                    background: "linear-gradient(135deg, #7c3aed, #ec4899, #f97316)",
                                }}
                            >
                                <Signal color="white" size={26} />
                            </div>

                            <h1 className={`fw-black mb-1 ${darkMode ? "text-light" : "text-dark"}`} style={{ fontWeight: 900 }}>
                                Welcome back
                            </h1>
                            <div className={mutedClass}>Sign in to manage your plans and add-ons</div>
                        </div>

                        <Card
                            className={`shadow-lg border ${darkMode ? "tc-card-dark" : "bg-white"}`}
                            style={{
                                borderRadius: 22,
                                borderColor: darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
                            }}
                        >
                            <Card.Body className="p-4 p-md-4">
                                {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
                                {success && <Alert variant="success" className="mb-3">{success}</Alert>}

                                <Form onSubmit={handleSubmit}>
                                    <Form.Group className="mb-3" controlId="email">
                                        <Form.Label className={darkMode ? "text-light" : "text-dark"}>Email</Form.Label>
                                        <Form.Control
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-2" controlId="password">
                                        <Form.Label className={darkMode ? "text-light" : "text-dark"}>Password</Form.Label>
                                        <div className="d-flex gap-2">
                                            <Form.Control
                                                type={showPw ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                            <Button
                                                type="button"
                                                variant={darkMode ? "outline-light" : "outline-secondary"}
                                                onClick={() => setShowPw((v) => !v)}
                                                title={showPw ? "Hide password" : "Show password"}
                                            >
                                                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </Button>
                                        </div>
                                    </Form.Group>

                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <Form.Check
                                            type="checkbox"
                                            label="Remember me"
                                            checked={remember}
                                            onChange={(e) => setRemember(e.target.checked)}
                                            className={darkMode ? "text-light" : "text-dark"}
                                        />

                                        <Button variant="link" className="p-0 text-decoration-none">
                                            Forgot password?
                                        </Button>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-100 fw-bold border-0"
                                        style={{
                                            background: "linear-gradient(90deg, #7c3aed, #ec4899)",
                                            borderRadius: 999,
                                            padding: "0.85rem 1rem",
                                        }}
                                    >
                                        Sign In
                                    </Button>
                                </Form>

                                <div className={`text-center mt-3 ${mutedClass}`}>
                                    Don’t have an account?{" "}
                                    <span className="fw-bold" style={{ color: "#7c3aed" }}>
                    Create one
                  </span>
                                </div>
                            </Card.Body>
                        </Card>

                        <div className={`text-center mt-3 small ${mutedClass}`}>
                            By continuing, you agree to TeleConnect Terms & Privacy.
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}
