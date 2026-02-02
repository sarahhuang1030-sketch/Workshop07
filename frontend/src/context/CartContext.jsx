import React, { createContext, useContext, useEffect, useState, useMemo } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
    const [plan, setPlan] = useState(null);
    const [addOns, setAddOns] = useState([]);

    // Restore cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem("tc_cart");
        if (savedCart) {
            const { plan, addOns } = JSON.parse(savedCart);
            setPlan(plan);
            setAddOns(addOns);
        }
    }, []);

    // Save cart to localStorage whenever plan/addOns change
    useEffect(() => {
        localStorage.setItem("tc_cart", JSON.stringify({ plan, addOns }));
    }, [plan, addOns]);

    // Add or replace plan
    const addPlan = (p) => setPlan(p);

    // Add add-on if not already added
    const addAddOn = (a) => {
        if (!addOns.find((x) => x.addOnId === a.addOnId)) {
            setAddOns([...addOns, a]);
        }
    };

    const removeAddOn = (id) => setAddOns(addOns.filter((a) => a.addOnId !== id));

    const clearCart = () => {
        setPlan(null);
        setAddOns([]);
    };

    // Calculate total price
    const total = useMemo(() => {
        return plan ? plan.price + addOns.reduce((sum, a) => sum + Number(a.monthlyPrice), 0) : 0;
    }, [plan, addOns]);

    return (
        <CartContext.Provider value={{ plan, addOns, total, addPlan, addAddOn, removeAddOn, clearCart }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}
