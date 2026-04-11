import { Navigate, useLocation } from "react-router-dom";
import { Spinner } from "react-bootstrap";

export default function RequireRole({ user, allow = [], authReady, children }) {
    const location = useLocation();

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

    const pathname = location.pathname || "";

    const isEmployeeDashboardRoute =
        pathname === "/manager" ||
        pathname.startsWith("/manager/") ||
        pathname === "/sales" ||
        pathname.startsWith("/sales/") ||
        pathname === "/service" ||
        pathname.startsWith("/service/");

    const isInactiveEmployee =
        !!user.employeeId &&
        user.employeeActive !== true;

    if (isInactiveEmployee && isEmployeeDashboardRoute) {
        sessionStorage.setItem(
            "inactive_dashboard_message",
            `Hello ${user.firstName || "there"}, your profile is inactive, so you can't access the dashboard.`
        );
        return <Navigate to="/profile" replace />;
    }

    const role = String(user.role || "").toLowerCase();
    const allowed = allow.map((r) => String(r).toLowerCase());

    const hasCustomerAccess =
        allowed.includes("customer") && !!user.customerId;

    const hasRoleAccess =
        allowed.includes(role);

    if (!hasRoleAccess && !hasCustomerAccess) {
        return <Navigate to="/" replace />;
    }

    return children;
}