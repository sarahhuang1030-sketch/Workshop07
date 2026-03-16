import React, { useEffect, useState } from "react";
import { Badge, Spinner } from "react-bootstrap";
import { CloudSun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function WeatherCard() {
    const { darkMode } = useTheme();
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [guestMode, setGuestMode] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function loadWeather() {
            try {
                const res = await fetch("/api/weather", { credentials: "include" });
                const data = await res.json();

                if (!cancelled) {
                    setWeather((prev) => {
                        if (
                            prev &&
                            prev.city === data.city &&
                            prev.tempC === data.tempC &&
                            prev.description === data.description
                        ) {
                            return prev;
                        }
                        return data;
                    });

                    setGuestMode(Boolean(data?.guestMode));
                }
            } catch {
                if (!cancelled) {
                    setWeather({
                        city: "Calgary",
                        tempC: 0,
                        description: "weather unavailable",
                    });
                    setGuestMode(false);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadWeather();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!guestMode) return;

        const intervalId = setInterval(async () => {
            try {
                const res = await fetch("/api/weather", { credentials: "include" });
                const data = await res.json();

                setWeather((prev) => {
                    if (
                        prev &&
                        prev.city === data.city &&
                        prev.tempC === data.tempC &&
                        prev.description === data.description
                    ) {
                        return prev;
                    }
                    return data;
                });
            } catch {
                // do nothing on guest refresh failure
            }
        }, 15000);

        return () => clearInterval(intervalId);
    }, [guestMode]);

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
        minHeight: 42,
    };

    return (
        <div style={pillStyle}>
            <CloudSun size={18} />

            {loading ? (
                <div className="d-inline-flex align-items-center gap-2">
                    <Spinner animation="border" size="sm" />
                    <span className={darkMode ? "text-light small" : "text-dark small"}>
                        Weather...
                    </span>
                </div>
            ) : (
                <>
                    <span className={darkMode ? "text-light fw-semibold" : "text-dark fw-semibold"}>
                        {weather?.city || "Calgary"}
                    </span>

                    <Badge bg={darkMode ? "secondary" : "light"} text={darkMode ? "light" : "dark"}>
                        {Number(weather?.tempC ?? 0).toFixed(1)}°C
                    </Badge>

                    <span className={darkMode ? "text-secondary small" : "text-muted small"}>
                        {weather?.description || "weather unavailable"}
                    </span>
                </>
            )}
        </div>
    );
}