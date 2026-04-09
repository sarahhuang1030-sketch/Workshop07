import React from "react";

export default function CustomerDashboard() {
    return (
        <div className="container py-4">
            <h2>Customer Dashboard</h2>
            <ul>
                <li><a href="/customer/plan">Current Plan</a></li>
                <li>Data usage (placeholder)</li>
                <li><a href="/customer/billing/history">Recent bills</a></li>
                <li><a href="/customer/quotes">My Quotes</a></li>
                <li><a href="/customer/support">Create support ticket</a></li>
            </ul>
        </div>
    );
}
