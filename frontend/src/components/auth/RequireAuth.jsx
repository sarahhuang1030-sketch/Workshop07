import { Navigate } from "react-router-dom";
import { Spinner } from "react-bootstrap";

export default function RequireAuth({ user, authReady, children }) {
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

    return children;
}