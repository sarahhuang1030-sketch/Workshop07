import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useMemo
} from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
    const [plan, setPlan] = useState(null);
    const [addOns, setAddOns] = useState([]);

    // Restore cart from localStorage
    useEffect(() => {
        const savedCart = localStorage.getItem("tc_cart");
        if (savedCart) {
            try {
                const parsed = JSON.parse(savedCart);
                setPlan(parsed.plan || null);
                setAddOns(parsed.addOns || []);
            } catch {
                localStorage.removeItem("tc_cart");
            }
        }
    }, []);

    // Persist cart
    useEffect(() => {
        localStorage.setItem(
            "tc_cart",
            JSON.stringify({ plan, addOns })
        );
    }, [plan, addOns]);

    // Add / Replace plan
    const addPlan = (p) => {
        setPlan(p);
        setAddOns([]); 
    };

    // Remove plan
    const removePlan = () => {
        setPlan(null);
        setAddOns([]);
    };

    // Add add-on
    const addAddOn = (a) => {
        if (!addOns.find((x) => x.addOnId === a.addOnId)) {
            setAddOns((prev) => [...prev, a]);
        }
    };

    // Remove add-on
    const removeAddOn = (id) => {
        setAddOns((prev) =>
            prev.filter((a) => a.addOnId !== id)
        );
    };

    // Clear entire cart
    const clearCart = () => {
        setPlan(null);
        setAddOns([]);
    };

    // Calculate subtotal only
    const total = useMemo(() => {
        if (!plan) return 0;

        const addOnsTotal = addOns.reduce(
            (sum, a) => sum + Number(a.monthlyPrice),
            0
        );

        return Number(plan.price) + addOnsTotal;
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
                clearCart
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}
