import React, { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
    const [plan, setPlan] = useState(null);
    const [addOns, setAddOns] = useState([]);

    // 从 localStorage 恢复
    useEffect(() => {
        const savedCart = localStorage.getItem("tc_cart");
        if (savedCart) {
            const { plan, addOns } = JSON.parse(savedCart);
            setPlan(plan);
            setAddOns(addOns);
        }
    }, []);

    // 保存到 localStorage
    useEffect(() => {
        localStorage.setItem("tc_cart", JSON.stringify({ plan, addOns }));
    }, [plan, addOns]);

    const addPlan = (p) => setPlan(p);

    const addAddOn = (a) => {
        if (!addOns.find((x) => x.addOnId === a.addOnId)) {
            setAddOns([...addOns, a]);
        }
    };

    const removeAddOn = (id) => {
        setAddOns(addOns.filter((a) => a.addOnId !== id));
    };

    const clearCart = () => {
        setPlan(null);
        setAddOns([]);
    };

    const total = plan
        ? plan.price + addOns.reduce((sum, a) => sum + Number(a.monthlyPrice), 0)
        : 0;

    return (
        <CartContext.Provider
            value={{
                plan,
                addOns,
                total,
                addPlan,
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
