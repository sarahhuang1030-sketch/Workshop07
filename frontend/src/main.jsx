import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

import "bootstrap/dist/css/bootstrap.min.css";
import "./style/style.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./index.css";

import { ThemeProvider } from "./context/ThemeContext";
import { CartProvider } from "./context/CartContext";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <ThemeProvider>
            <BrowserRouter>
                <CartProvider>
                    <App />
                </CartProvider>
            </BrowserRouter>
        </ThemeProvider>
    </React.StrictMode>
);