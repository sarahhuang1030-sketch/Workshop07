/**
 Description: roleUi Helping functions and constants for role-based UI rendering, such as navigation
 links and dashboard paths for each user role.
 Created by: Sarah
 Created on: February 2026
 **/

export function roleKeyFromUser(user) {
    const roleRaw = user?.role || user?.raw?.role || "Customer";
    return roleRaw.trim().toLowerCase().replace(/\s+/g, ""); // "Sales Agent" -> "salesagent"
}

export const ROLE_UI = {
    customer: {
        dashboardPath: "/customer",
        nav: [
            // { label: "My Plan", to: "/customer/plan" },
            // { labell: "Billing", to: "/customer/billing" },
            { label: "Support", to: "/customer/support" },
            { label: "Profile", to: "/profile" },
        ],
    },
    salesagent: {
        dashboardPath: "/sales",
        nav: [
            { label: "Dashboard", to: "/sales" },
            { label: "Chat Hub", to: "/sales/chat" },
            // { label: "Customers", to: "/sales/CustomersPage.jsx" },
            // { label: "Create Quote", to: "/sales/quotes/new" },
            // { label: "Activations", to: "/sales/activations" },
            { label: "Profile", to: "/profile" },
        ],
    },
    servicetechnician: {
        dashboardPath: "/service",
        nav: [
            { label: "Dashboard", to: "/service" },
            { label: "Profile", to: "/profile" },
        ],
    },
    manager: {
        dashboardPath: "/manager",
        nav: [
            { label: "Dashboard", to: "/manager" },
            { label: "Chat Hub", to: "/manager/chat" },
            // { label: "User Management", to: "/manager/users" },
            // { label: "Reports", to: "/manager/reports" },
            // { label: "Promotions", to: "/manager/promotions" },
            { label: "Profile", to: "/profile" },
        ],
    },
};
