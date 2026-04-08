/**
 Description: OAuth success callback page. After user completes OAuth flow with Google,
 they are redirected here, which brings the user to profile page if successful, or back to login if not.
 Created by: Sarah
 Created on: February 2026
 **/

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {apiFetch} from "../services/api.js";

export default function OAuthSuccess({ setUser }) {
    const navigate = useNavigate();

    useEffect(() => {
        async function run() {
            try {
                const res = await apiFetch("/api/me");
                if (!res.ok) throw new Error("Not logged in");

                const me = await res.json();

                // map OAuth2User -> your app user shape (best-effort)
                const mapped = {
                    oauth: true,
                    username: me.email || me.name || "google-user",
                    email: me.email || "",
                    firstName: me.given_name || (me.name ? me.name.split(" ")[0] : "—"),
                    lastName: me.family_name || (me.name ? me.name.split(" ").slice(1).join(" ") : ""),
                    phone: me.phone ?? me.homePhone ?? me.HomePhone ?? "—",
                    avatarUrl: me.avatarUrl ?? me.picture ?? null,
                    raw: me,
                    customerId: me.customerId ?? null,
                };

                setUser?.(mapped);
                localStorage.setItem("tc_user", JSON.stringify(mapped));

                navigate("/profile", { replace: true });
            } catch (err) {
                console.error(err);
                navigate("/login", { replace: true });
            }
        }

        run();
    }, [navigate, setUser]);

    return <div style={{ padding: 24 }}>Signing you in…</div>;
}
