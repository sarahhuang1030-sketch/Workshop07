import { Routes, Route } from "react-router-dom";
import Layout from "../components/layout/Layout";

import HomePage from "../pages/HomePage";
import PlansPage from "../pages/PlansPage";
import RegisterPage from "../pages/RegisterPage"
import BookingPage from "../pages/BookingPage";
import ProfilePage from "../pages/ProfilePage";
import LoginPage from "../pages/LoginPage";
import NotFoundPage from "../pages/NotFoundPage";

export default function AppRoutes() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/plans" element={<PlansPage />} />
                <Route path="/booking" element={<BookingPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="*" element={<NotFoundPage />} />
            </Route>
        </Routes>
    );
}
