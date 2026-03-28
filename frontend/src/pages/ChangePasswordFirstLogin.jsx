import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import { Eye, EyeOff } from "lucide-react";
import { apiFetch } from "../services/api";
import { useTheme } from "../context/ThemeContext";

export default function ChangePasswordFirstLogin({ refreshMe }) {
    const navigate = useNavigate();
    const { darkMode } = useTheme();

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError("Please fill in all fields.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("New password and confirm password do not match.");
            return;
        }

        try {
            setLoading(true);

            const res = await apiFetch("/api/auth/change-password-first-login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    confirmPassword,
                }),
            });

            if (!res.ok) {
                const msg = await res.text().catch(() => "");
                throw new Error(msg || "Unable to update password");
            }

            const updatedUser = JSON.parse(localStorage.getItem("tc_user") || "{}");
            updatedUser.mustChangePassword = false;
            localStorage.setItem("tc_user", JSON.stringify(updatedUser));

            await refreshMe?.();

            setSuccess("Password updated successfully.");

            setTimeout(() => {
                navigate("/profile", { replace: true });
            }, 1000);
        } catch (err) {
            setError(err.message || "Unexpected error");
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
                        <h1
                            className={`fw-black mb-2 ${darkMode ? "text-light" : "text-dark"}`}
                            style={{ fontWeight: 900 }}
                        >
                            Change your password
                        </h1>

                        <p className={darkMode ? "tc-muted-dark" : "tc-muted-light"}>
                            You must change your temporary password before continuing.
                        </p>

                        {error && (
                            <Alert variant="danger" className="mt-3">
                                {error}
                            </Alert>
                        )}

                        {success && (
                            <Alert variant="success" className="mt-3">
                                {success}
                            </Alert>
                        )}

                        <Form className="mt-3" onSubmit={handleSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label className={darkMode ? "text-light" : "text-dark"}>
                                    Temporary Password
                                </Form.Label>
                                <div className="input-group">
                                    <Form.Control
                                        type={showCurrent ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Enter temporary password"
                                        autoComplete="current-password"
                                    />
                                    <Button
                                        variant={darkMode ? "outline-light" : "outline-secondary"}
                                        onClick={() => setShowCurrent((v) => !v)}
                                        tabIndex={-1}
                                        type="button"
                                    >
                                        {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </Button>
                                </div>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label className={darkMode ? "text-light" : "text-dark"}>
                                    New Password
                                </Form.Label>
                                <div className="input-group">
                                    <Form.Control
                                        type={showNew ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                    />
                                    <Button
                                        variant={darkMode ? "outline-light" : "outline-secondary"}
                                        onClick={() => setShowNew((v) => !v)}
                                        tabIndex={-1}
                                        type="button"
                                    >
                                        {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </Button>
                                </div>
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label className={darkMode ? "text-light" : "text-dark"}>
                                    Confirm New Password
                                </Form.Label>
                                <div className="input-group">
                                    <Form.Control
                                        type={showConfirm ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                    />
                                    <Button
                                        variant={darkMode ? "outline-light" : "outline-secondary"}
                                        onClick={() => setShowConfirm((v) => !v)}
                                        tabIndex={-1}
                                        type="button"
                                    >
                                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
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
                                {loading ? "Updating..." : "Update Password"}
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            </div>
        </Container>
    );
}