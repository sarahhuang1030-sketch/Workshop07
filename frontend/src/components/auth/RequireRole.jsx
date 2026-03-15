import { Navigate } from "react-router-dom";
import { Spinner } from "react-bootstrap";

export default function RequireRole({ user, allow = [], authReady, children }) {
    if (!authReady) {
        return (
            <div className="container py-5 text-center">
                <Spinner animation="border" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const role = String(user.role || "").toLowerCase();
    const allowed = allow.map((r) => String(r).toLowerCase());

    if (!allowed.includes(role)) {
        return <Navigate to="/" replace />;
    }

    return children;
}