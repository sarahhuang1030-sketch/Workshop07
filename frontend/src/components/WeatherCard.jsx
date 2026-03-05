import React, { useEffect, useState } from "react";
import { Badge, Spinner } from "react-bootstrap";
import { CloudSun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function WeatherCard() {
    const { darkMode } = useTheme();
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function loadWeather() {
            try {
                setLoading(true);
                const res = await fetch("/api/weather", { credentials: "include" });
                if (!res.ok) return;

                const data = await res.json();
                if (!cancelled) setWeather(data);
            } catch {
                // ignore
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadWeather();
        return () => {
            cancelled = true;
        };
    }, []);

    // Hide completely if not logged in / no address
    if (!loading && !weather) return null;

    const pillStyle = {
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        borderRadius: 999,
        border: darkMode ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(0,0,0,0.1)",
        background: darkMode ? "rgba(33,37,41,0.65)" : "rgba(255,255,255,0.75)",
        backdropFilter: "blur(10px)",
        whiteSpace: "nowrap",
    };

    return (
        <div style={pillStyle}>
            <CloudSun size={18} />

            {loading && (
                <div className="d-inline-flex align-items-center gap-2">
                    <Spinner animation="border" size="sm" />
                    <span className={darkMode ? "text-light small" : "text-dark small"}>Weather…</span>
                </div>
            )}

            {!loading && weather && (
                <>
          <span className={darkMode ? "text-light fw-semibold" : "text-dark fw-semibold"}>
            {weather.city}
          </span>

                    <Badge bg={darkMode ? "secondary" : "light"} text={darkMode ? "light" : "dark"}>
                        {Number(weather.tempC).toFixed(1)}°C
                    </Badge>

                    <span className={darkMode ? "text-secondary small" : "text-muted small"}>
            {weather.description || "—"}
          </span>
                </>
            )}
        </div>
    );
}