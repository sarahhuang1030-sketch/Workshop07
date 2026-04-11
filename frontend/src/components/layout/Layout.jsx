import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AppNavbar from "./Navbar";
import AppFooter from "./Footer";
import { useTheme } from "../../context/ThemeContext";
import "../../style/style.css";
import { useState, useEffect } from "react";
import ReviewModal from "../common/ReviewModal";
import { apiFetch } from "../../services/api.js";

export default function Layout({ user, setUser, onLogout }) {
    const { darkMode } = useTheme();
    const [showReviewModal, setShowReviewModal] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const [customerPlans, setCustomerPlans] = useState([]);

    const [reviews, setReviews] = useState([
        {
            id: 1,
            name: "Emily R.",
            role: "Mobile Customer",
            review: "SJY Telecom made switching plans so easy...",
            rating: 5,
            targetType: "company",
            targetId: null,
            targetLabel: "SJY Telecom",
        },
        {
            id: 2,
            name: "James T.",
            role: "Internet Customer",
            review: "The setup was quick and the connection speed has been excellent.",
            rating: 5,
            targetType: "company",
            targetId: null,
            targetLabel: "SJY Telecom",
        },
        {
            id: 3,
            name: "Sophia L.",
            role: "Family Plan Customer",
            review: "Affordable plans, good coverage, and support whenever I need it.",
            rating: 4,
            targetType: "company",
            targetId: null,
            targetLabel: "SJY Telecom",
        },
    ]);

    function handleAddReview(newReview) {
        const normalizedReview = {
            id: newReview.id ?? Date.now(),
            name: newReview.name,
            role: newReview.role,
            review: newReview.review,
            rating: Number(newReview.rating),
            targetType: newReview.targetType === "plan" ? "plan" : "company",
            targetId:
                newReview.targetType === "plan" && newReview.targetId != null
                    ? String(newReview.targetId)
                    : null,
            targetLabel:
                newReview.targetType === "plan"
                    ? newReview.targetLabel || newReview.planName || "Selected Plan"
                    : "TeleConnect",
        };

        setReviews((prev) => [normalizedReview, ...prev]);
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

                const normalizedPlans = Array.isArray(data)
                    ? data.map((p) => ({
                        ...p,
                        planId: p.planId ?? p.id,
                        planName: p.planName ?? p.name,
                    }))
                    : [];

                setCustomerPlans(normalizedPlans);
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
            <AppNavbar user={user} setUser={setUser} onLogout={onLogout} />

            <main className="flex-grow-1">
                <Outlet context={{ reviews, customerPlans }} />
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