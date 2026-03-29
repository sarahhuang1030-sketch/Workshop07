import { Outlet } from "react-router-dom";
import AppNavbar from "./Navbar";
import AppFooter from "./Footer";
import { useTheme } from "../../context/ThemeContext";
import "../../style/style.css";
import { useState } from "react";
import ReviewModal from "../common/ReviewModal"; // adjust path if needed

export default function Layout({ user, setUser, onLogout }) {
    const { darkMode } = useTheme();
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviews, setReviews] = useState([
        {
            id: 1,
            name: "Emily R.",
            role: "Mobile Customer",
            review: "TeleConnect made switching plans so easy...",
            rating: 5,
        },
        {
            id: 2,
            name: "James T.",
            role: "Internet Customer",
            review: "The setup was quick and the connection speed has been excellent.",
            rating: 5,
        },
        {
            id: 3,
            name: "Sophia L.",
            role: "Family Plan Customer",
            review: "Affordable plans, good coverage, and support whenever I need it.",
            rating: 4,
        },
    ]);

    function handleAddReview(newReview) {
        setReviews(prev => [newReview, ...prev]);
    }

    return (
        <div
            className={`${darkMode ? "tc-bg-dark" : "tc-bg-light"} d-flex flex-column`}
            style={{ minHeight: "100vh" }}
            data-bs-theme={darkMode ? "dark" : "light"}
        >
            <AppNavbar user={user} setUser={setUser} onLogout={onLogout}/>
            <main className="flex-grow-1">
                <Outlet context={{ reviews }} />
            </main>

            <AppFooter onOpenReviewModal={() => setShowReviewModal(true)} />

            <ReviewModal
                show={showReviewModal}
                onClose={() => setShowReviewModal(false)}
                onSubmit={handleAddReview}
            />
        </div>
    );
}
