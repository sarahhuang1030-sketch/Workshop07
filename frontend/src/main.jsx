import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

import "bootstrap/dist/css/bootstrap.min.css";
import "../src/style/style.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import "./index.css";
import { ThemeProvider } from "./context/ThemeContext";
import { CartProvider } from "./context/CartContext";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe("pk_test_51T6jBuLr4XDHMXI1QxycdUAh5AYTaPv4fdQmRPoJ9u7mIdgKCCK7cfgONBZUU6rblw8Ww20V1kFjqvUqRvL2S4tc00p8tt4Rxp");

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
            <ThemeProvider>
                <Elements stripe={stripePromise}>
                    <CartProvider>
                        <App />
                    </CartProvider>
                </Elements>
            </ThemeProvider>
        </BrowserRouter>
    </React.StrictMode>
);