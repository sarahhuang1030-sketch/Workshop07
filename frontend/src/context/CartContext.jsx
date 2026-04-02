import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext();

function getCartKey() {
    const raw = localStorage.getItem("tc_user");
    if (!raw) return null;

    try {
        const u = JSON.parse(raw);

        const id =
            u?.customerId ??
            u?.raw?.customerId ??
            u?.id ??
            u?.email ??
            u?.username ??
            null;

        if (!id) return null;

        return `tc_cart_${String(id).toLowerCase()}`;
    } catch {
        return null;
    }
}

export function CartProvider({ children }) {
    // Keep cart plans as an array so we can support:
    // - multiple Mobile plans
    // - one Internet plan
    // - one Bundle plan
    const [plans, setPlans] = useState([]);
    const [addOns, setAddOns] = useState([]);

    const [sessionKey, setSessionKey] = useState(() => localStorage.getItem("tc_user") || "");
    const [hydrated, setHydrated] = useState(false);

    // Remove legacy cart storage
    useEffect(() => {
        localStorage.removeItem("tc_cart");
    }, []);

    // Watch for login/logout changes
    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === "tc_user") {
                setSessionKey(e.newValue || "");
            }
        };

        window.addEventListener("storage", onStorage);

        const id = setInterval(() => {
            const cur = localStorage.getItem("tc_user") || "";
            setSessionKey((prev) => (prev === cur ? prev : cur));
        }, 500);

        return () => {
            window.removeEventListener("storage", onStorage);
            clearInterval(id);
        };
    }, []);

    // Load cart for current user
    useEffect(() => {
        setHydrated(false);

        const key = getCartKey();

        if (!key) {
            setPlans([]);
            setAddOns([]);
            setHydrated(true);
            return;
        }

        const saved = localStorage.getItem(key);

        if (saved) {
            try {
                const parsed = JSON.parse(saved);

                // Backward compatibility:
                // old cart shape = { plan, addOns }
                // new cart shape = { plans, addOns }
                if (Array.isArray(parsed.plans)) {
                    setPlans(parsed.plans);
                } else if (parsed.plan) {
                    setPlans([parsed.plan]);
                } else {
                    setPlans([]);
                }

                setAddOns(Array.isArray(parsed.addOns) ? parsed.addOns : []);
            } catch {
                localStorage.removeItem(key);
                setPlans([]);
                setAddOns([]);
            }
        } else {
            setPlans([]);
            setAddOns([]);
        }

        setHydrated(true);
    }, [sessionKey]);

    // Persist cart whenever it changes
    useEffect(() => {
        if (!hydrated) return;

        const key = getCartKey();
        if (!key) return;

        localStorage.setItem(
            key,
            JSON.stringify({
                plans,
                addOns,
            })
        );
    }, [plans, addOns, sessionKey, hydrated]);

    const addPlan = (p) => {
        setPlans((prev) => {
            const serviceType = p?.serviceType ?? "Unknown";

            // Allow multiple mobile plans in the same cart
            if (serviceType === "Mobile") {
                return [...prev, p];
            }

            // Replace only the same non-mobile service type
            // so Internet and Bundle stay single-select
            const filtered = prev.filter(
                (existing) => (existing?.serviceType ?? "Unknown") !== serviceType
            );

            return [...filtered, p];
        });
    };

    // Backward-compatible removePlan:
    // - removePlan() clears all plans
    // - removePlan("Mobile") removes all mobile plans
    // - removePlan("Internet") removes only internet
    // - removePlan("Bundle") removes only bundle
    const removePlan = (serviceType) => {
        if (!serviceType) {
            setPlans([]);
            setAddOns([]);
            return;
        }
useEffect(() => {
    if (plans.length === 0) {
        setAddOns([]);
    }
}, [plans]);

        setPlans((prev) =>
            prev.filter((p) => (p?.serviceType ?? "Unknown") !== serviceType)
        );
    };
const removePlanAtIndex = (indexToRemove) => {
        setPlans((prev) => prev.filter((_, index) => index !== indexToRemove));
    };

    const addAddOn = (a) => {
        if (!addOns.find((x) => x.addOnId === a.addOnId)) {
            setAddOns((prev) => [...prev, a]);
        }
    };

    const removeAddOn = (id) => {
        setAddOns((prev) => prev.filter((a) => a.addOnId !== id));
    };

    const clearCart = () => {
        const key = getCartKey();
        if (key) localStorage.removeItem(key);

        setPlans([]);
        setAddOns([]);
    };

    // Helpful derived values
    const mobilePlan = plans.find((p) => p?.serviceType === "Mobile") || null;
    const internetPlan = plans.find((p) => p?.serviceType === "Internet") || null;

    // Backward compatibility for older pages that still expect a single "plan"
    // Priority:
    // 1. mobilePlan
    // 2. internetPlan
    // 3. first available plan
    const plan = mobilePlan || internetPlan || plans[0] || null;

    // Calculate total price
    const total = useMemo(() => {
        const plansTotal = plans.reduce(
            (sum, p) => sum + Number(p?.totalPrice ?? p?.price ?? p?.monthlyPrice ?? 0),
            0
        );

        const addOnsTotal = addOns.reduce(
            (sum, a) => sum + Number(a?.monthlyPrice ?? a?.price ?? 0),
            0
        );

        return plansTotal + addOnsTotal;
    }, [plans, addOns]);

    return (
        <CartContext.Provider
                    value={{
                        // New shape
                        plans,
                        mobilePlan,
                        internetPlan,

                        // Backward compatibility
                        plan,

                        addOns,
                        total,
                        addPlan,
                        removePlan,
                        removePlanAtIndex,
                        addAddOn,
                        removeAddOn,
                        clearCart,
                    }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}