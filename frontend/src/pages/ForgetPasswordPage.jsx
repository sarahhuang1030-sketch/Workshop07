/**
Description: Forget password page, where user enters their email or
username to receive a password reset link.
Created by: Sarah
Created on: February 2026
**/

import { useState } from "react";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";

export default function ForgetPasswordPage() {
    const { darkMode } = useTheme();
    const navigate = useNavigate();
    const [status, setStatus] = useState("idle");
    const [value, setValue] = useState(""); // email or username
    const [msg, setMsg] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function submit(e) {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        setError("");
        setMsg("");
        try {
            console.log("FORGET PASSWORD PAGE VERSION: 2026-02-07 v5");
            const res = await fetch("/api/auth/forgetpassword", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier:value }),
            });

            const text = await res.text(); // helpful for debugging

            // Always show same message (don’t leak whether account exists)
            setMsg("If an account exists, a reset link has been sent.");

            if (!res.ok) {
                console.error("Forget password failed:", res.status, text);
                setMsg("If an account exists, a reset link has been sent.");
                return;
            }
            setStatus("sent");

        } catch (err) {
            console.error("Cannot reach backend:", err);
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
                        <h2 className={`fw-black mb-2 ${darkMode ? "text-light" : "text-dark"}`}>
                            Reset your password
                        </h2>

                        <p className={darkMode ? "tc-muted-dark" : "tc-muted-light"}>
                            Enter your username or email and we’ll send a reset link.
                        </p>

                        {error && <Alert variant="danger">{error}</Alert>}
                        {msg && <Alert variant="success">{msg}</Alert>}


                        <Form onSubmit={submit} className="mt-3">
                            <Form.Group className="mb-3">
                                <Form.Label className={darkMode ? "text-light" : "text-dark"}>
                                    Username or Email
                                </Form.Label>
                                <Form.Control
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder="john or john@email.com"
                                />
                            </Form.Group>

                            <Button
                                type="submit"
                                className="w-100 fw-bold border-0"
                                disabled={loading || !value.trim()}
                                style={{
                                    borderRadius: 14,
                                    padding: "0.8rem 1rem",
                                    background: "linear-gradient(90deg, #7c3aed, #ec4899)",
                                }}
                            >
                                {loading ? "Sending..." : "Send reset link"}
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            </div>
        </Container>
    );
}