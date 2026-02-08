import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import { useTheme } from "../context/ThemeContext"; // adjust path if needed
import { Eye, EyeOff } from "lucide-react";
import { FaGoogle, FaGithub, FaFacebook } from "react-icons/fa";


export default function LoginPage({ setUser }) {
    const navigate = useNavigate();
    const { darkMode } = useTheme();
    const [showPassword, setShowPassword] = useState(false);

    const [form, setForm] = useState({ username: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                const msg = await res.text();
                setError(msg || "Invalid username or password");
                setLoading(false);
                return;
            }

            const user = await res.json();
            localStorage.setItem("tc_user", JSON.stringify(user));
            setUser?.(user); // safe call

            navigate("/");
        } catch (err) {
            setError("Cannot reach backend. Is Spring Boot running?");
        } finally {
            setLoading(false);
        }
    };

    function loginWithProvider(provider) {
        return (e) => {
            e?.preventDefault?.();            // stop form submit
            window.location.assign(`/oauth2/authorization/${provider}`);
        };
    }


    return (
        <Container className="py-5">
            <div className="d-flex justify-content-center">
                <Card
                    className={darkMode ? "tc-card-dark" : "bg-white shadow-sm border-0"}
                    style={{ width: "100%", maxWidth: 480, borderRadius: 20 }}
                >
                    <Card.Body className="p-4 p-md-5">
                        <h1 className={`fw-black mb-2 ${darkMode ? "text-light" : "text-dark"}`} style={{ fontWeight: 900 }}>
                            Welcome back
                        </h1>
                        <p className={darkMode ? "tc-muted-dark" : "tc-muted-light"}>
                            Log in to manage your plans and perks.
                        </p>

                        {error && (
                            <Alert variant="danger" className="mt-3">
                                {error}
                            </Alert>
                        )}

                        <Form className="mt-3" onSubmit={handleSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label className={darkMode ? "text-light" : "text-dark"}>Username</Form.Label>
                                <Form.Control
                                    value={form.username}
                                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                                    placeholder="Enter username"
                                    autoComplete="username"
                                />
                            </Form.Group>
                            <Form.Group className="mb-4">
                                <Form.Label className={darkMode ? "text-light" : "text-dark"}>
                                    Password
                                </Form.Label>

                                <div className="input-group">
                                    <Form.Control
                                        type={showPassword ? "text" : "password"}
                                        value={form.password}
                                        onChange={(e) =>
                                            setForm({ ...form, password: e.target.value })
                                        }
                                        placeholder="Enter password"
                                        autoComplete="current-password"

                                    />

                                    <Button
                                        variant={darkMode ? "outline-light" : "outline-secondary"}
                                        onClick={() => setShowPassword((v) => !v)}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </Button>
                                </div>
                            </Form.Group>
                            <Button
                                type="submit"
                                className="w-100 fw-bold border-0"
                                disabled={loading}
                                style={{
                                    borderRadius: 14,
                                    padding: "0.8rem 1rem",
                                    background: "linear-gradient(90deg, #7c3aed, #ec4899)",
                                }}
                            >
                                {loading ? "Signing in..." : "Login"}
                            </Button>
                            <div className="text-center m-2">
                                <button  className="btn m-1" onClick={loginWithProvider("google")}>
                                    <FaGoogle size={22} />
                                </button>
                                <button className="btn m-1" onClick={loginWithProvider("github")}>
                                    <FaGithub size={22} />
                                </button>
                                <button className="btn m-1" onClick={loginWithProvider("facebook")}>
                                    <FaFacebook size={22} />
                                </button>
                            </div>
                            <div className={`text-center mt-3 ${darkMode ? "tc-muted-dark" : "tc-muted-light"}`}>
                                <Button variant="link" className="fw-semibold" onClick={() => navigate("/forgetpassword")}>Forget Password?</Button> |
                                <Button variant="link" className="pl-3 fw-semibold" onClick={() => navigate("/register")}>
                                    Register
                                </Button>
                            </div>
                        </Form>
                    </Card.Body>
                </Card>
            </div>
        </Container>
    );
}
