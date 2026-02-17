export function roleKeyFromUser(user) {
    const roleRaw = user?.role || user?.raw?.role || "Customer";
    return roleRaw.trim().toLowerCase().replace(/\s+/g, ""); // "Sales Agent" -> "salesagent"
}

export const ROLE_UI = {
    customer: {
        dashboardPath: "/customer",
        nav: [
            { label: "Home", to: "/" },
            { label: "My Plan", to: "/customer/plan" },
            { label: "Billing", to: "/customer/billing" },
            { label: "Support", to: "/customer/support" },
            { label: "Profile", to: "/profile" },
        ],
    },
    salesagent: {
        dashboardPath: "/sales",
        nav: [
            { label: "Dashboard", to: "/sales" },
            { label: "Customers", to: "/sales/customers" },
            { label: "Create Quote", to: "/sales/quotes/new" },
            { label: "Activations", to: "/sales/activations" },
            { label: "Profile", to: "/profile" },
        ],
    },
    servicetechnician: {
        dashboardPath: "/service",
        nav: [
            { label: "Work Orders", to: "/service/work-orders" },
            { label: "Assigned Tickets", to: "/service/tickets" },
            { label: "Profile", to: "/profile" },
        ],
    },
    manager: {
        dashboardPath: "/manager",
        nav: [
            { label: "Dashboard", to: "/manager" },
            { label: "User Management", to: "/manager/users" },
            { label: "Reports", to: "/manager/reports" },
            { label: "Promotions", to: "/manager/promotions" },
            { label: "Profile", to: "/profile" },
        ],
    },
};
