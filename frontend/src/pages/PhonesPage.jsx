import React, { useEffect, useMemo, useState } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Form,
    Badge,
    Spinner,
    Alert,
} from "react-bootstrap";
import { useTheme } from "../context/ThemeContext";
import { Smartphone, Search, Filter, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";

export default function PhonesPage() {
    const { darkMode } = useTheme();
    const mutedClass = darkMode ? "tc-muted-dark" : "tc-muted-light";
    const navigate = useNavigate();

    const [phones, setPhones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [brandFilter, setBrandFilter] = useState("All");

    useEffect(() => {
        let cancelled = false;

        async function loadPhones() {
            try {
                setLoading(true);
                setError("");

                const res = await apiFetch("/api/phones");

                if (!res.ok) {
                    throw new Error(`Phones API failed: ${res.status}`);
                }

                const data = await res.json();

                if (!cancelled) {
                    setPhones(data ?? []);
                }
            } catch (e) {
                if (!cancelled) {
                    setError(e.message || "Failed to load phones.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadPhones();

        return () => {
            cancelled = true;
        };
    }, []);

    const brandOptions = useMemo(() => {
        const brands = [...new Set(phones.map((p) => p.brand).filter(Boolean))];
        return ["All", ...brands];
    }, [phones]);

    const filteredPhones = useMemo(() => {
        return phones.filter((phone) => {
            const matchesSearch =
                `${phone.brand ?? ""} ${phone.model ?? ""} ${phone.storage ?? ""} ${phone.color ?? ""}`
                    .toLowerCase()
                    .includes(search.toLowerCase());

            const matchesBrand =
                brandFilter === "All" || phone.brand === brandFilter;

            return matchesSearch && matchesBrand;
        });
    }, [phones, search, brandFilter]);

    return (
        <div
            style={{
                minHeight: "100vh",
                background: darkMode
                    ? "linear-gradient(135deg, #15151b, #1f1f2b)"
                    : "linear-gradient(135deg, #fdf2f8, #eef2ff)",
                padding: "2rem 0 4rem",
            }}
        >
            <Container>
                <div
                    className="mx-auto mb-5"
                    style={{
                        maxWidth: "1100px",
                    }}
                >
                    <div className="text-center mb-4">
                        <div
                            className="d-inline-flex align-items-center justify-content-center mb-3"
                            style={{
                                width: "72px",
                                height: "72px",
                                borderRadius: "50%",
                                background: darkMode ? "#2a2a31" : "#f7ecff",
                                color: "#8b5cf6",
                            }}
                        >
                            <Smartphone size={30} />
                        </div>

                        <h1
                            className={`fw-black mb-3 ${darkMode ? "text-light" : "text-dark"}`}
                            style={{ fontSize: "3rem" }}
                        >
                            Browse phones
                        </h1>

                        <p
                            className={`mx-auto ${mutedClass}`}
                            style={{
                                maxWidth: "760px",
                                fontSize: "1.08rem",
                            }}
                        >
                            Explore the latest smartphones with flexible monthly financing
                            and full-price options.
                        </p>
                    </div>

                    <Card
                        className="border-0 shadow-sm mb-4"
                        style={{
                            borderRadius: "22px",
                            background: darkMode ? "#1f1f24" : "#ffffff",
                            color: darkMode ? "#f5f5f5" : "#1f2430",
                        }}
                    >
                        <Card.Body className="p-4">
                            <Row className="g-3 align-items-end">
                                <Col md={8}>
                                    <Form.Label className="fw-bold d-flex align-items-center gap-2">
                                        <Search size={16} />
                                        Search phones
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Search by brand, model, storage, or color"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        style={{
                                            borderRadius: "12px",
                                            padding: "0.85rem 1rem",
                                            background: darkMode ? "#2a2a31" : "#ffffff",
                                            color: darkMode ? "#f5f5f5" : "#1f2430",
                                            border: darkMode
                                                ? "1px solid #444"
                                                : "1px solid #d6d6d6",
                                        }}
                                    />
                                </Col>

                                <Col md={4}>
                                    <Form.Label className="fw-bold d-flex align-items-center gap-2">
                                        <Filter size={16} />
                                        Brand
                                    </Form.Label>
                                    <Form.Select
                                        value={brandFilter}
                                        onChange={(e) => setBrandFilter(e.target.value)}
                                        style={{
                                            borderRadius: "12px",
                                            padding: "0.85rem 1rem",
                                            background: darkMode ? "#2a2a31" : "#ffffff",
                                            color: darkMode ? "#f5f5f5" : "#1f2430",
                                            border: darkMode
                                                ? "1px solid #444"
                                                : "1px solid #d6d6d6",
                                        }}
                                    >
                                        {brandOptions.map((brand) => (
                                            <option key={brand} value={brand}>
                                                {brand}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {loading && (
                        <div className="py-5 text-center">
                            <Spinner animation="border" />
                            <div className={`mt-2 ${mutedClass}`}>Loading phones…</div>
                        </div>
                    )}

                    {!loading && error && (
                        <Alert variant="danger">{error}</Alert>
                    )}

                    {!loading && !error && (
                        <>
                            <Row className="g-4">
                                {filteredPhones.map((phone) => (
                                    <Col key={phone.phoneId} md={6} lg={4}>
                                        <Card
                                            className="h-100 border-0 shadow-sm overflow-hidden"
                                            style={{
                                                borderRadius: "22px",
                                                background: darkMode ? "#1f1f24" : "#ffffff",
                                                color: darkMode ? "#f5f5f5" : "#1f2430",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    height: "260px",
                                                    background: darkMode ? "#18181b" : "#f8f4ff",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    padding: "1.5rem",
                                                }}
                                            >
                                                <img
                                                    src={phone.imageUrl}
                                                    alt={`${phone.brand} ${phone.model}`}
                                                    style={{
                                                        maxWidth: "100%",
                                                        maxHeight: "100%",
                                                        objectFit: "contain",
                                                    }}
                                                />
                                            </div>

                                            <Card.Body className="p-4 d-flex flex-column">
                                                <div className="d-flex align-items-center justify-content-between mb-2">
                                                    <Badge bg="primary" pill>
                                                        {phone.brand}
                                                    </Badge>

                                                    {phone.inStock ? (
                                                        <span
                                                            className="d-inline-flex align-items-center gap-1"
                                                            style={{
                                                                color: darkMode ? "#9AE6B4" : "#15803d",
                                                                fontSize: "0.9rem",
                                                                fontWeight: 700,
                                                            }}
                                                        >
                                                            <CheckCircle2 size={15} />
                                                            In Stock
                                                        </span>
                                                    ) : (
                                                        <span
                                                            style={{
                                                                color: darkMode ? "#fca5a5" : "#b91c1c",
                                                                fontSize: "0.9rem",
                                                                fontWeight: 700,
                                                            }}
                                                        >
                                                            Out of Stock
                                                        </span>
                                                    )}
                                                </div>

                                                <h4 className="fw-bold mb-1">
                                                    {phone.model}
                                                </h4>

                                                <div
                                                    className={mutedClass}
                                                    style={{ fontSize: "0.96rem", marginBottom: "1rem" }}
                                                >
                                                    {phone.storage} • {phone.color}
                                                </div>

                                                <div className="mb-3">
                                                    <div
                                                        style={{
                                                            fontSize: "2rem",
                                                            fontWeight: 800,
                                                            lineHeight: 1,
                                                        }}
                                                    >
                                                        ${Number(phone.monthlyPrice ?? 0).toFixed(2)}
                                                        <span
                                                            style={{
                                                                fontSize: "1rem",
                                                                fontWeight: 600,
                                                                color: darkMode ? "#cfcfd6" : "#6b7280",
                                                                marginLeft: "0.35rem",
                                                            }}
                                                        >
                                                            /mo
                                                        </span>
                                                    </div>

                                                    <div
                                                        className={mutedClass}
                                                        style={{ fontSize: "0.95rem", marginTop: "0.35rem" }}
                                                    >
                                                        Full price: ${Number(phone.fullPrice ?? 0).toFixed(2)}
                                                    </div>
                                                </div>

                                                <div
                                                    className="mb-4"
                                                    style={{
                                                        color: darkMode ? "#d2d2da" : "#5f6777",
                                                        fontSize: "0.95rem",
                                                    }}
                                                >
                                                    Flexible financing available with eligible TeleConnect
                                                    plans.
                                                </div>

                                                <Button
                                                    className="mt-auto"
                                                    disabled={!phone.inStock}
                                                    onClick={() => navigate(`/phones/${phone.phoneId}`)}
                                                    style={{
                                                        borderRadius: "12px",
                                                        fontWeight: 700,
                                                        padding: "0.8rem 1rem",
                                                        background: phone.inStock
                                                            ? "linear-gradient(90deg,#4f46e5,#7c3aed)"
                                                            : undefined,
                                                        border: "none",
                                                    }}
                                                >
                                                    View Details
                                                </Button>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>

                            {filteredPhones.length === 0 && (
                                <Card
                                    className="border-0 shadow-sm mt-4"
                                    style={{
                                        borderRadius: "18px",
                                        background: darkMode ? "#1f1f24" : "#ffffff",
                                        color: darkMode ? "#f5f5f5" : "#1f2430",
                                    }}
                                >
                                    <Card.Body className="p-4 text-center">
                                        No phones matched your filters.
                                    </Card.Body>
                                </Card>
                            )}
                        </>
                    )}
                </div>
            </Container>
        </div>
    );
}