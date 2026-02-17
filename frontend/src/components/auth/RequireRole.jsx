import React from "react";
import { Navigate, useLocation } from "react-router-dom"; // ✅ add useLocation
import { roleKeyFromUser } from "../../config/roleUi";

export default function RequireRole({ user, allow, children }) {
    const location = useLocation();

    if (!user) {
        sessionStorage.setItem("post_login_redirect", location.pathname);
        return <Navigate to="/login" replace />;
    }

    const roleKey = roleKeyFromUser(user);

    if (Array.isArray(allow) && allow.length > 0 && !allow.includes(roleKey)) {
        return <Navigate to="/" replace />;
    }

    return children;
}
