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

    const [plan, setPlan] = useState(null);
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
            setSessionKey(prev => (prev === cur ? prev : cur));
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
            setPlan(null);
            setAddOns([]);
            setHydrated(true);
            return;
        }

        const saved = localStorage.getItem(key);

        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setPlan(parsed.plan || null);
                setAddOns(parsed.addOns || []);
            } catch {
                localStorage.removeItem(key);
                setPlan(null);
                setAddOns([]);
            }
        } else {
            setPlan(null);
            setAddOns([]);
        }

        setHydrated(true);

    }, [sessionKey]);

    // Persist cart whenever it changes
    useEffect(() => {

        if (!hydrated) return;

        const key = getCartKey();
        if (!key) return;

        localStorage.setItem(key, JSON.stringify({ plan, addOns }));

    }, [plan, addOns, sessionKey, hydrated]);

    const addPlan = (p) => {
        setPlan(p);
        setAddOns([]);
    };

    const removePlan = () => {
        setPlan(null);
        setAddOns([]);
    };

    const addAddOn = (a) => {
        if (!addOns.find(x => x.addOnId === a.addOnId)) {
            setAddOns(prev => [...prev, a]);
        }
    };

    const removeAddOn = (id) => {
        setAddOns(prev => prev.filter(a => a.addOnId !== id));
    };

    const clearCart = () => {
        const key = getCartKey();
        if (key) localStorage.removeItem(key);

        setPlan(null);
        setAddOns([]);
    };

    // Calculate total price
    const total = useMemo(() => {

        if (!plan) return 0;

        const addOnsTotal = addOns.reduce(
            (sum, a) => sum + Number(a.monthlyPrice ?? a.price ?? 0),
            0
        );

        return Number(plan.price ?? plan.monthlyPrice ?? 0) + addOnsTotal;

    }, [plan, addOns]);

    return (
        <CartContext.Provider
            value={{
                plan,
                addOns,
                total,
                addPlan,
                removePlan,
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