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
    const [plans, setPlans] = useState([]);
    const [addOns, setAddOns] = useState([]);


    const [devices, setDevices] = useState([]);

    const [sessionKey, setSessionKey] = useState(() => localStorage.getItem("tc_user") || "");
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        localStorage.removeItem("tc_cart");
    }, []);

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

    useEffect(() => {
        setHydrated(false);

        const key = getCartKey();

        if (!key) {
            setPlans([]);
            setAddOns([]);
            setDevices([]);
            setHydrated(true);
            return;
        }

        const saved = localStorage.getItem(key);

        if (saved) {
            try {
                const parsed = JSON.parse(saved);

                if (Array.isArray(parsed.plans)) {
                    setPlans(parsed.plans);
                } else if (parsed.plan) {
                    setPlans([parsed.plan]);
                } else {
                    setPlans([]);
                }

                setAddOns(Array.isArray(parsed.addOns) ? parsed.addOns : []);


                setDevices(Array.isArray(parsed.devices) ? parsed.devices : []);
            } catch {
                localStorage.removeItem(key);
                setPlans([]);
                setAddOns([]);
                setDevices([]);
            }
        } else {
            setPlans([]);
            setAddOns([]);
            setDevices([]);
        }

        setHydrated(true);
    }, [sessionKey]);

    useEffect(() => {
        if (!hydrated) return;

        const key = getCartKey();
        if (!key) return;

        localStorage.setItem(
            key,
            JSON.stringify({
                plans,
                addOns,
                devices,
            })
        );
    }, [plans, addOns, devices, sessionKey, hydrated]);

    const addPlan = (p) => {
        setPlans((prev) => {
            const serviceType = p?.serviceType ?? "Unknown";

            if (serviceType === "Mobile") {
                return [...prev, p];
            }

            const filtered = prev.filter(
                (existing) => (existing?.serviceType ?? "Unknown") !== serviceType
            );

            return [...filtered, p];
        });
    };

    const removePlan = (serviceType) => {
        if (!serviceType) {
            setPlans([]);
            setAddOns([]);
            setDevices([]);
            return;
        }

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


    const addDevice = (device) => {
        setDevices((prev) => [...prev, device]);
    };

    const removeDevice = (cartDeviceId) => {
        setDevices((prev) =>
            prev.filter((d) => d.cartDeviceId !== cartDeviceId)
        );
    };

    const clearCart = () => {
        const key = getCartKey();
        if (key) localStorage.removeItem(key);

        setPlans([]);
        setAddOns([]);
        setDevices([]);
    };

    const mobilePlan = plans.find((p) => p?.serviceType === "Mobile") || null;
    const internetPlan = plans.find((p) => p?.serviceType === "Internet") || null;

    const plan = mobilePlan || internetPlan || plans[0] || null;

    const total = useMemo(() => {
        const plansTotal = plans.reduce(
            (sum, p) => sum + Number(p?.totalPrice ?? p?.price ?? p?.monthlyPrice ?? 0),
            0
        );

        const addOnsTotal = addOns.reduce(
            (sum, a) => sum + Number(a?.monthlyPrice ?? a?.price ?? 0),
            0
        );


        const devicesTotal = devices.reduce(
            (sum, d) => sum + Number(d?.totalPrice ?? 0),
            0
        );

        return plansTotal + addOnsTotal + devicesTotal;
    }, [plans, addOns, devices]);

    return (
        <CartContext.Provider
            value={{
                plans,
                mobilePlan,
                internetPlan,
                plan,
                addOns,

                // ✅ NEW
                devices,

                total,
                addPlan,
                removePlan,
                removePlanAtIndex,
                addAddOn,
                removeAddOn,


                addDevice,
                removeDevice,

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