/**
 * StripeProvider.jsx
 * Wrap app with Stripe Elements
 */

import React from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
    "pk_test_51T6jBuLr4XDHMXI1QxycdUAh5AYTaPv4fdQmRPoJ9u7mIdgKCCK7cfgONBZUU6rblw8Ww20V1kFjqvUqRvL2S4tc00p8tt4Rxp");

export default function StripeProvider({ children }) {

    const options = {
        appearance: {
            theme: "stripe"
        }
    };

    return (
        <Elements stripe={stripePromise} options={options}>
            {children}
        </Elements>
    );
}