import { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Card, Form, Button, Alert, InputGroup } from "react-bootstrap";
import { useTheme } from "../context/ThemeContext";
import { Signal, Eye, EyeOff } from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";

function providerFromNeedsRegistration(needsRegistration) {
    const lk = needsRegistration?.lookupKey ? String(needsRegistration.lookupKey) : "";
    const fromLookupKey = lk.includes(":") ? lk.split(":")[0] : "";
    return (
        (needsRegistration?.provider || fromLookupKey || needsRegistration?.attributes?.provider || "")
            .toLowerCase()
            .trim()
    );
}

function pickOAuthEmail(needsRegistration, prefill) {
    const attrs = needsRegistration?.attributes || {};
    return String(prefill?.email ?? needsRegistration?.email ?? attrs.email ?? attrs.mail ?? "").trim();
}

function pickFirstName(needsRegistration, prefill) {
    const attrs = needsRegistration?.attributes || {};
    const name = String(attrs.name || "").trim();
    const guess = name ? name.split(" ")[0] : "";
    return String(prefill?.firstName ?? attrs.given_name ?? attrs.first_name ?? guess ?? "").trim();
}

function pickLastName(needsRegistration, prefill) {
    const attrs = needsRegistration?.attributes || {};
    const name = String(attrs.name || "").trim();
    const guess = name ? name.split(" ").slice(1).join(" ") : "";
    return String(prefill?.lastName ?? attrs.family_name ?? attrs.last_name ?? guess ?? "").trim();
}

export default function RegisterPage({
                                         forceMode,
                                         embedded = false,

                                         // preferred generic callback
                                         onCompleted,
                                         // backward compatibility
                                         onEmployeeCreated,

                                         // OAuth complete info
                                         needsRegistration = null,

                                         // prefill from caller
                                         prefill = null,

                                         // for modal close
                                         onClose,
                                     }) {
    const { darkMode } = useTheme();
    const navigate = useNavigate();

    const [showPw, setShowPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);

    const { search } = useLocation();
    const modeFromUrl = new URLSearchParams(search).get("mode");
    const mode = forceMode ?? modeFromUrl;

    const isEmployeeMode = mode === "employee";
    const isOAuthComplete = !!needsRegistration;
    const isNormalSignup = !isEmployeeMode && !isOAuthComplete;

    const url = useMemo(() => {
        if (isEmployeeMode || isOAuthComplete) return "/api/me/register-as-customer";
        return "/api/auth/register";
    }, [isEmployeeMode, isOAuthComplete]);

    // Prefill sources
    const oauthProvider = useMemo(
        () => providerFromNeedsRegistration(needsRegistration),
        [needsRegistration]
    );

    const oauthEmail = useMemo(
        () => pickOAuthEmail(needsRegistration, prefill),
        [needsRegistration, prefill]
    );

    const prefillFirstName = useMemo(
        () => pickFirstName(needsRegistration, prefill),
        [needsRegistration, prefill]
    );

    const prefillLastName = useMemo(
        () => pickLastName(needsRegistration, prefill),
        [needsRegistration, prefill]
    );

    // If OAuth didn't provide email (common for GitHub), user must type it.
    const oauthEmailMissing = isOAuthComplete && !oauthEmail;

    const [form, setForm] = useState({
        customerType: "Individual",
        firstName: "",
        lastName: "",
        homePhone: "",
        businessName: "",

        // email input: used by normal signup, employee (optional), and OAuth when missing
        email: "",

        billingStreet1: "",
        billingStreet2: "",
        billingCity: "",
        billingProvince: "",
        billingPostalCode: "",
        billingCountry: "Canada",

        // normal signup only
        username: "",
        password: "",
        confirmPassword: "",
    });

    // Fill form when modal opens / prefill changes
    useEffect(() => {
        setForm((prev) => {
            const next = { ...prev };

            if (!next.firstName) next.firstName = prefillFirstName || "";
            if (!next.lastName) next.lastName = prefillLastName || "";

            // IMPORTANT:
            // - If OAuth email is missing (GitHub), allow user to type (do NOT overwrite).
            // - If OAuth email exists, we display oauthEmail as read-only and do NOT store it in form.email.
            // - For normal signup, leave email alone (user types).
            if (isOAuthComplete && oauthEmailMissing && !next.email) {
                next.email = ""; // just initializes once; won't wipe user typing later
            }

            return next;
        });
    }, [prefillFirstName, prefillLastName, isOAuthComplete, oauthEmailMissing]);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const mutedClass = darkMode ? "tc-muted-dark" : "tc-muted-light";
    const isBusiness = form.customerType === "Business";

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setForm((prev) => {
            const newValue = type === "checkbox" ? checked : value;

            if (name === "customerType" && newValue !== "Business") {
                return { ...prev, customerType: newValue, businessName: "" };
            }

            return { ...prev, [name]: newValue };
        });
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const effectiveEmail = (isOAuthComplete ? (oauthEmail || form.email) : form.email).trim();

        // required basics (shared)
        if (
            !form.firstName.trim() ||
            !form.lastName.trim() ||
            !form.homePhone.trim() ||
            !form.billingStreet1.trim() ||
            !form.billingCity.trim() ||
            !form.billingProvince.trim() ||
            !form.billingPostalCode.trim() ||
            !form.billingCountry.trim()
        ) {
            setError("Please fill in all required fields.");
            return;
        }

        if (isBusiness && !form.businessName.trim()) {
            setError("Business name is required for business accounts.");
            return;
        }

        if (isNormalSignup) {
            if (!effectiveEmail) {
                setError("Email is required.");
                return;
            }
            if (!form.username.trim() || !form.password) {
                setError("Username and password required.");
                return;
            }
            if (form.password !== form.confirmPassword) {
                setError("Passwords do not match.");
                return;
            }
        }

        if (isOAuthComplete && !effectiveEmail) {
            setError(
                oauthProvider === "github"
                    ? "GitHub didn’t provide an email. Please enter one to continue."
                    : "OAuth email is missing. Please re-login with OAuth."
            );
            return;
        }

        // --- OAuth/Employee: /api/me/register-as-customer (RegisterAsCustomerRequestDTO) ---
        const customerProfileBody = {
            customerType: form.customerType,
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            businessName: isBusiness ? form.businessName.trim() : "",
            homePhone: form.homePhone.trim(),
            email: effectiveEmail, // ok even if backend fills it

            street1: form.billingStreet1.trim(),
            street2: form.billingStreet2 ? form.billingStreet2.trim() : "",
            city: form.billingCity.trim(),
            province: form.billingProvince.trim(),
            postalCode: form.billingPostalCode.trim(),
            country: form.billingCountry.trim(),

            addServiceAddress: false,
        };

        // --- Normal signup (Design B): /api/auth/register (RegisterRequestDTO) ---
        const registerBody = {
            customerType: form.customerType,
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            businessName: isBusiness ? form.businessName.trim() : "",

            email: effectiveEmail,
            homephone: form.homePhone.trim(), // DTO expects homephone

            username: form.username.trim(),
            password: form.password,

            billingStreet1: form.billingStreet1.trim(),
            billingStreet2: form.billingStreet2 ? form.billingStreet2.trim() : "",
            billingCity: form.billingCity.trim(),
            billingProvince: form.billingProvince.trim(),
            billingPostalCode: form.billingPostalCode.trim(),
            billingCountry: form.billingCountry.trim(),

            sameAsBilling: true,
        };

        const isMeFlow = isEmployeeMode || isOAuthComplete;
        const body = isMeFlow ? customerProfileBody : registerBody;

        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: isMeFlow ? "include" : "omit",
                body: JSON.stringify(body),
            });

            const text = await res.text();
            let data = null;
            try {
                data = JSON.parse(text);
            } catch {}

            if (!res.ok) {
                setError(data?.error || data?.message || text || "Registration failed.");
                return;
            }

            setSuccess(isNormalSignup ? "Registered successfully!" : "Customer profile created!");

            if (onCompleted) {
                await onCompleted();
                return;
            }

            if ((isEmployeeMode || isOAuthComplete) && onEmployeeCreated) {
                await onEmployeeCreated();
                return;
            }

            if (isEmployeeMode || isOAuthComplete) {
                navigate("/profile", { replace: true });
                return;
            }

// --- Normal signup: auto-login then go to profile ---
            try {
                const loginRes = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include", // IMPORTANT for session cookie
                    body: JSON.stringify({
                        username: form.username.trim(),
                        password: form.password,
                    }),
                });

                if (!loginRes.ok) {
                    navigate("/login");
                    return;
                }

                navigate("/profile", { replace: true });
            } catch {
                navigate("/login");
            }
        } catch {
            setError("Cannot reach backend. Make sure Spring Boot is running.");
        }
    };

    // Email UI rules:
    // - Normal signup: editable
    // - OAuth complete: read-only if provider gave email, editable if missing (GitHub case)
    const showEmailField = !isEmployeeMode || isOAuthComplete || !!prefill?.email;
    const emailReadOnly = isOAuthComplete && !oauthEmailMissing;

    const emailValue = isOAuthComplete ? (oauthEmailMissing ? form.email : oauthEmail) : form.email;

    return (
        <div
            className="d-flex align-items-center"
            style={{
                minHeight: embedded ? "auto" : "calc(100vh - 140px)",
                padding: embedded ? 0 : "2rem 0",
            }}
        >
            <Container>
                <Row className="justify-content-center">
                    <Col md={7} lg={6}>
                        <div className="text-center mb-4">
                            <div
                                className="mx-auto mb-3 d-flex align-items-center justify-content-center shadow"
                                style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 18,
                                    background: "linear-gradient(135deg, #7c3aed, #ec4899, #f97316)",
                                }}
                            >
                                <Signal color="white" size={26} />
                            </div>

                            <h1 className={`fw-black mb-1 ${darkMode ? "text-light" : "text-dark"}`} style={{ fontWeight: 900 }}>
                                {isOAuthComplete ? "Complete your profile" : "Create your account"}
                            </h1>
                            <div className={mutedClass}>
                                {isOAuthComplete ? "Finish setup to start using TeleConnect." : "Join TeleConnect and manage your plans with ease"}
                            </div>
                        </div>

                        <Card
                            className={`shadow-lg border ${darkMode ? "tc-card-dark" : "bg-white"}`}
                            style={{
                                borderRadius: 22,
                                borderColor: darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
                            }}
                        >
                            <Card.Body className="p-4 p-md-4">
                                {embedded && (
                                    <div className="d-flex justify-content-end mb-2">
                                        <Button
                                            type="button"
                                            variant={darkMode ? "outline-light" : "outline-secondary"}
                                            size="sm"
                                            onClick={() => onClose?.()}
                                            aria-label="Close"
                                            title="Close"
                                        >
                                            ✕
                                        </Button>
                                    </div>
                                )}

                                {error && <Alert variant="danger">{error}</Alert>}
                                {success && <Alert variant="success">{success}</Alert>}

                                <Form onSubmit={handleSubmit}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className={darkMode ? "text-light" : "text-dark"}>Account Type</Form.Label>
                                        <Form.Select name="customerType" value={form.customerType} onChange={handleChange}>
                                            <option value="Individual">Individual</option>
                                            <option value="Business">Business</option>
                                        </Form.Select>
                                    </Form.Group>

                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className={darkMode ? "text-light" : "text-dark"}>First Name</Form.Label>
                                                <Form.Control name="firstName" value={form.firstName} onChange={handleChange} />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className={darkMode ? "text-light" : "text-dark"}>Last Name</Form.Label>
                                                <Form.Control name="lastName" value={form.lastName} onChange={handleChange} />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Form.Group className="mb-3">
                                        <Form.Label className={darkMode ? "text-light" : "text-dark"}>Phone</Form.Label>
                                        <Form.Control
                                            type="tel"
                                            name="homePhone"
                                            placeholder="403-999-8888"
                                            value={form.homePhone}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>

                                    {isBusiness && (
                                        <Form.Group className="mb-3">
                                            <Form.Label className={darkMode ? "text-light" : "text-dark"}>Business Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="businessName"
                                                placeholder="Your company name"
                                                value={form.businessName}
                                                onChange={handleChange}
                                            />
                                        </Form.Group>
                                    )}

                                    {showEmailField && (
                                        <Form.Group className="mb-3">
                                            <Form.Label className={darkMode ? "text-light" : "text-dark"}>Email</Form.Label>
                                            <Form.Control
                                                type="email"
                                                name="email"
                                                placeholder={isOAuthComplete ? "Enter your email (GitHub may not share it)" : "you@example.com"}
                                                value={emailValue}
                                                onChange={handleChange}
                                                disabled={emailReadOnly}
                                            />

                                            {/* Optional helper text — delete if you want it super clean */}
                                            {isOAuthComplete && !oauthEmailMissing && (
                                                <div className={`small mt-1 ${mutedClass}`}>
                                                    Using the email from your {oauthProvider || "OAuth"} account.
                                                </div>
                                            )}

                                            {isOAuthComplete && oauthEmailMissing && (
                                                <div className="small text-warning mt-1">
                                                    {oauthProvider || "OAuth"} didn’t provide an email. Please enter one to finish setup.
                                                </div>
                                            )}
                                        </Form.Group>
                                    )}

                                    {isNormalSignup && (
                                        <>
                                            <Form.Group className="mb-3">
                                                <Form.Label className={darkMode ? "text-light" : "text-dark"}>Username</Form.Label>
                                                <Form.Control
                                                    name="username"
                                                    placeholder="Choose a username"
                                                    value={form.username}
                                                    onChange={handleChange}
                                                />
                                            </Form.Group>

                                            <Form.Group className="mb-3">
                                                <Form.Label className={darkMode ? "text-light" : "text-dark"}>Password</Form.Label>
                                                <InputGroup>
                                                    <Form.Control
                                                        type={showPw ? "text" : "password"}
                                                        name="password"
                                                        value={form.password}
                                                        onChange={handleChange}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant={darkMode ? "outline-light" : "outline-secondary"}
                                                        onClick={() => setShowPw((v) => !v)}
                                                        title={showPw ? "Hide password" : "Show password"}
                                                    >
                                                        {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </Button>
                                                </InputGroup>
                                            </Form.Group>

                                            <Form.Group className="mb-3">
                                                <Form.Label className={darkMode ? "text-light" : "text-dark"}>Confirm Password</Form.Label>
                                                <InputGroup>
                                                    <Form.Control
                                                        type={showConfirmPw ? "text" : "password"}
                                                        name="confirmPassword"
                                                        value={form.confirmPassword}
                                                        onChange={handleChange}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant={darkMode ? "outline-light" : "outline-secondary"}
                                                        onClick={() => setShowConfirmPw((v) => !v)}
                                                        title={showConfirmPw ? "Hide password" : "Show password"}
                                                    >
                                                        {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </Button>
                                                </InputGroup>
                                            </Form.Group>
                                        </>
                                    )}

                                    <Form.Group className="mb-3">
                                        <Form.Label className={darkMode ? "text-light" : "text-dark"}>Street 1</Form.Label>
                                        <Form.Control name="billingStreet1" value={form.billingStreet1} onChange={handleChange} />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label className={darkMode ? "text-light" : "text-dark"}>Street 2 (optional)</Form.Label>
                                        <Form.Control name="billingStreet2" value={form.billingStreet2} onChange={handleChange} />
                                    </Form.Group>

                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className={darkMode ? "text-light" : "text-dark"}>City</Form.Label>
                                                <Form.Control name="billingCity" value={form.billingCity} onChange={handleChange} />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className={darkMode ? "text-light" : "text-dark"}>Province</Form.Label>
                                                <Form.Control name="billingProvince" value={form.billingProvince} onChange={handleChange} />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className={darkMode ? "text-light" : "text-dark"}>Postal Code</Form.Label>
                                                <Form.Control
                                                    name="billingPostalCode"
                                                    value={form.billingPostalCode}
                                                    onChange={handleChange}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label className={darkMode ? "text-light" : "text-dark"}>Country</Form.Label>
                                                <Form.Control name="billingCountry" value={form.billingCountry} onChange={handleChange} />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Button
                                        type="submit"
                                        className="w-100 fw-bold border-0"
                                        style={{
                                            background: "linear-gradient(90deg, #7c3aed, #ec4899)",
                                            borderRadius: 999,
                                            padding: "0.85rem 1rem",
                                        }}
                                    >
                                        {isEmployeeMode ? "Create Customer Profile" : isOAuthComplete ? "Complete Profile" : "Create Account"}
                                    </Button>
                                </Form>

                                {!embedded && !isOAuthComplete && (
                                    <div className={`text-center mt-3 ${mutedClass}`}>
                                        Already have an account?{" "}
                                        <NavLink to="/login" style={{ color: "#7c3aed", fontWeight: 700, textDecoration: "none" }}>
                                            Sign in
                                        </NavLink>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>

                        {!embedded && (
                            <div className={`text-center mt-3 small ${mutedClass}`}>
                                By signing up, you agree to TeleConnect Terms &amp; Privacy.
                            </div>
                        )}
                    </Col>
                </Row>
            </Container>
        </div>
    );
}