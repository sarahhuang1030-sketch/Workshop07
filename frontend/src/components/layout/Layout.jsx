import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AppNavbar from "./Navbar";
import AppFooter from "./Footer";
import { useTheme } from "../../context/ThemeContext";
import "../../style/style.css";
import { useState } from "react";
import ReviewModal from "../common/ReviewModal";
import { useEffect } from "react";
import { apiFetch } from "../../services/api.js";


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
    const location = useLocation();
    const navigate = useNavigate();
    const [customerPlans, setCustomerPlans] = useState([]);

    function handleAddReview(newReview) {
        setReviews(prev => [newReview, ...prev]);
    }

    useEffect(() => {
        if (location.state?.openReviewModal) {
            setShowReviewModal(true);
            localStorage.removeItem("openReviewAfterLogin");
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.pathname, location.state, navigate]);



    useEffect(() => {
        async function loadCustomerPlans() {
            if (!showReviewModal || !user?.customerId) return;

            try {
                const res = await apiFetch("/api/customer/review-plans");

                if (!res.ok) {
                    setCustomerPlans([]);
                    return;
                }

                const data = await res.json();
                setCustomerPlans(Array.isArray(data) ? data : []);
            } catch {
                setCustomerPlans([]);
            }
        }

        loadCustomerPlans();
    }, [showReviewModal, user]);

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
                user={user}
                customerPlans={customerPlans}
            />
        </div>
    );
}
