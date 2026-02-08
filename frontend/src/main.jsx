import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

import "bootstrap/dist/css/bootstrap.min.css";
import "../src/style/style.css"; // make sure this is the file with tc-bg-light/tc-bg-dark etc.
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import { ThemeProvider } from "./context/ThemeContext";


ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <ThemeProvider>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </ThemeProvider>
    </React.StrictMode>
);
