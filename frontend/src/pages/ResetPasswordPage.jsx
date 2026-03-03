/**
Description: Reset password page, accessed via the link in the password reset email.
Validates the new password and submits it to the backend.
Created by: Sarah
Created on: February 2026
**/

import { useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Container, Card, Form, Button, Alert, InputGroup } from "react-bootstrap";
import { useTheme } from "../context/ThemeContext";
import { Eye, EyeOff } from "lucide-react";
import {validateResetPassword } from "../pages/validation/Validation.js";

export default function ResetPasswordPage() {
    const { darkMode } = useTheme();
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const token = useMemo(() => params.get("token") || "", [params]);
    const [showPw, setShowPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [pw1, setPw1] = useState("");
    const [pw2, setPw2] = useState("");
    const [msg, setMsg] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [fieldError, setFieldError] = useState({ pw1: "", pw2: "" });

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setMsg("");
        setFieldError({ pw1: "", pw2: "" });

        if (!token) {
            setError("Missing token. Use the link from your email.");
            return;
        }

        const v = validateResetPassword({ pw1, pw2 });
        setFieldError(v);

        if (v.pw1 || v.pw2) {
            setError("Please fix the highlighted fields.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/resetpassword", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword: pw1 }),
            });

            if (!res.ok) {
                const t = await res.text();
                setError(t || "Reset failed.");
                return;
            }

            setMsg("Password updated. You can log in now.");
            setTimeout(() => navigate("/login"), 800);
        } catch {
            setError("Cannot reach backend. Is Spring Boot running?");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-5">
            <div className="d-flex justify-content-center">
                <Card
                    className={darkMode ? "tc-card-dark" : "bg-white shadow-sm border-0"}
                    style={{ width: "100%", maxWidth: 520, borderRadius: 20 }}
                >
                    <Card.Body className="p-4 p-md-5">
                        <h2 className={`fw-bolder mb-2 ${darkMode ? "text-light" : "text-dark"}`}>
                            Choose a new password
                        </h2>

                        {error && <Alert variant="danger">{error}</Alert>}
                        {msg && <Alert variant="success">{msg}</Alert>}

                        <Form onSubmit={submit} className="mt-3">
                            <Form.Group className="mb-3">
                                <Form.Label className={darkMode ? "text-light" : "text-dark"}>
                                    New Password
                                </Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        type={showPw ? "text" : "password"}
                                        value={pw1}
                                        onChange={(e) => setPw1(e.target.value)}
                                        isInvalid={!!fieldError.pw1}
                                    />
                                    <Button
                                        type="button"
                                        variant={darkMode ? "outline-light" : "outline-secondary"}
                                        onClick={() => setShowPw((v) => !v)}
                                        title={showPw ? "Hide password" : "Show password"}
                                    >
                                        {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </Button>
                                    <Form.Control.Feedback type="invalid">{fieldError.pw1}</Form.Control.Feedback>
                                </InputGroup>
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label className={darkMode ? "text-light" : "text-dark"}>
                                    Confirm Password
                                </Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        type={showConfirmPw ? "text" : "password"}
                                        value={pw2}
                                        onChange={(e) => setPw2(e.target.value)}
                                        isInvalid={!!fieldError.pw2}
                                    />
                                    <Form.Control.Feedback type="invalid">{fieldError.pw2}</Form.Control.Feedback>
                                    <Button
                                        type="button"
                                        variant={darkMode ? "outline-light" : "outline-secondary"}
                                        onClick={() => setShowConfirmPw((v) => !v)}
                                        title={showConfirmPw ? "Hide password" : "Show password"}
                                    >
                                        {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </Button>
                                </InputGroup>
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
                                {loading ? "Updating..." : "Update password"}
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            </div>
        </Container>
    );
}