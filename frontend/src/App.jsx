import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import Layout from "./components/layout/Layout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import PlansPage from "./pages/PlansPage";
import ShoppingCartPage from "./pages/ShoppingCartPage";
import CheckoutPage from "./pages/CheckoutPage";

import { CartProvider } from "./context/CartContext";

import "bootstrap/dist/css/bootstrap.min.css";
import "./style/style.css";

export default function App() {
    const [user, setUser] = useState(null);
    const [usersList, setUsersList] = useState([]); // 用来存后端返回数据

    useEffect(() => {
        // 从 localStorage 获取登录信息
        const saved = localStorage.getItem("tc_user");
        if (saved) setUser(JSON.parse(saved));

        // 调用后端 API，只在组件挂载时执行一次
        fetch("/api/users")
            .then(res => res.json())
            .then(data => {
                console.log(data);
                setUsersList(data); // 保存到 state
            })
            .catch(err => console.error(err));
    }, []); // 空依赖数组 = 只执行一次

    return (
        <CartProvider>
            <Routes>
                <Route element={<Layout user={user} setUser={setUser} />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/profile" element={<ProfilePage user={user} />} />
                    <Route path="/plans" element={<PlansPage />} />
                    <Route path="/cart" element={<ShoppingCartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/login" element={<LoginPage setUser={setUser} />} />
                    <Route path="/register" element={<RegisterPage setUser={setUser} />} />
                </Route>
            </Routes>
        </CartProvider>
    );
}
