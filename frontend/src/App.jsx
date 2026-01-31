import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import Layout from "./components/layout/Layout"; // ✅ import Layout
import Navbar from "./components/layout/Navbar.jsx"; // (you won’t need this if Layout already renders Navbar)

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import PlansPage from "./pages/PlansPage";

import "bootstrap/dist/css/bootstrap.min.css";
import "./style/style.css";

export default function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const saved = localStorage.getItem("tc_user");
        if (saved) setUser(JSON.parse(saved));
    }, []);

    return (
        <Routes>
            {/* Everything inside Layout gets the gradient background */}
            <Route element={<Layout user={user} setUser={setUser}/>}>
                <Route path="/" element={<HomePage />} />
                <Route path="/profile" element={<ProfilePage user={user} />} />
                <Route path="/plans" element={<PlansPage />} />
                <Route path="/login" element={<LoginPage setUser={setUser} />} />
                <Route path="/register" element={<RegisterPage setUser={setUser} />} />
            </Route>
        </Routes>
    );
}
