import React from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe("pk_test_your_key");

export default function StripeProvider({ children }) {
    return (
        <Elements stripe={stripePromise}>
            {children}
        </Elements>
    );
}