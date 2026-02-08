import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuthSuccess({ setUser }) {
    const navigate = useNavigate();

    useEffect(() => {
        async function run() {
            try {
                const res = await fetch("/api/me", { credentials: "include" });
                if (!res.ok) throw new Error("Not logged in");

                const me = await res.json();

                // map OAuth2User -> your app user shape (best-effort)
                const mapped = {
                    oauth: true,
                    username: me.email || me.name || "google-user",
                    email: me.email || "",
                    firstName: me.given_name || (me.name ? me.name.split(" ")[0] : "—"),
                    lastName: me.family_name || (me.name ? me.name.split(" ").slice(1).join(" ") : ""),
                    // customerId may not exist for OAuth users unless your backend maps it
                    customerId: me.customerId ?? null,
                    raw: me,
                };

                setUser?.(mapped);
                localStorage.setItem("tc_user", JSON.stringify(mapped));

                navigate("/profile", { replace: true });
            } catch (e) {
                navigate("/login", { replace: true });
            }
        }

        run();
    }, [navigate, setUser]);

    return <div style={{ padding: 24 }}>Signing you in…</div>;
}
