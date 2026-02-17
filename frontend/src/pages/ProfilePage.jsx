import React, { useEffect, useMemo, useState } from "react";
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Badge,
    Table,
    Alert,
    Form,
    Spinner,
    ProgressBar,
    Modal
} from "react-bootstrap";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { Crown, CreditCard, Package, Star, ShieldCheck } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

// --------- Business Rules (from your spec) ---------
const POINTS_PER_DOLLAR = 1;
const BRONZE_REQUIREMENT = 5000;
const BRONZE_DISCOUNT_RATE = 0.15;
const BRONZE_DISCOUNT_CAP = 10000;

function formatMoney(n) {
    if (n == null || Number.isNaN(Number(n))) return "—";
    return Number(n).toLocaleString(undefined, { style: "currency", currency: "CAD" });
}

function initials(name = "") {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "TC";
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function prevFirstName(full = "") {
    return String(full).trim().split(/\s+/)[0] || "";
}
function prevLastName(full = "") {
    const parts = String(full).trim().split(/\s+/);
    return parts.slice(1).join(" ");
}


export default function ProfilePage({ user: userProp, onLogout }) {

    const { darkMode } = useTheme();
    const navigate = useNavigate();

    const mutedClass = darkMode ? "tc-muted-dark" : "tc-muted-light";
    const cardBase = darkMode ? "tc-card-dark" : "bg-white border-0 shadow-sm";

    const [avatarUrl, setAvatarUrl] = useState(null);
    const [sessionUser, setSessionUser] = useState(userProp ?? null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const shouldRedirect = !loading && !sessionUser;

    const [profile, setProfile] = useState({
        customerId: null,
        firstName: "—",
        lastName: "",
        email: "",
        phone: "",

        totalSpent: 0,
        points: 0,
        customerType: "Guest Customer",

        plan: {
            name: "—",
            monthlyPrice: null,
            status: "Inactive",
            startedAt: null,
            features: [],
            addOns: [],
        },

        billing: {
            nextBillDate: null,
            nextBillAmount: null,
            paymentMethod: { brand: "—", last4: "—" },
            address: {
                street1: "—",
                street2: "—",
                city: "—",
                province: "—",
                postalCode: "—",
                country: "—",
            },
            invoices: [],
        },
    });

    //edit function billing
    const [showBillingModal, setShowBillingModal] = useState(false);
    const [billingDraft, setBillingDraft] = useState(null);
    const [billingSaving, setBillingSaving] = useState(false);
    const [billingError, setBillingError] = useState("");

    const [addressPromptDismissed, setAddressPromptDismissed] = useState(false);


    const needsAddress = useMemo(() => {
        const hasCustomer = (sessionUser?.customerId ?? 0) > 0;

        const a = profile.billing?.address;
        const missing =
            !a ||
            !a.street1 || a.street1 === "—" ||
            !a.city || a.city === "—" ||
            !a.province || a.province === "—" ||
            !a.postalCode || a.postalCode === "—";

        // ✅ customer exists, but address missing
        return hasCustomer && missing;
    }, [sessionUser?.customerId, profile.billing?.address]);


    const needsPhone = !profile.phone?.trim();

    async function openBillingEditor() {
        setBillingError("");
        setShowBillingModal(true);
        setBillingDraft(null); // show empty while loading (optional)

        try {
            const res = await fetch("/api/billing/address", { credentials: "include" });

            if (res.status === 401) {
                navigate("/login", { replace: true });
                return;
            }

            if (!res.ok) {
                const msg = await res.text();
                setBillingError(msg || "Failed to load billing info");
                // fallback to whatever is in profile
                const a = profile.billing.address || {};
                setBillingDraft({
                    street1: a.street1 === "—" ? "" : (a.street1 ?? ""),
                    street2: a.street2 === "—" ? "" : (a.street2 ?? ""),
                    city: a.city === "—" ? "" : (a.city ?? ""),
                    province: a.province === "—" ? "" : (a.province ?? ""),
                    postalCode: a.postalCode === "—" ? "" : (a.postalCode ?? ""),
                    country: a.country === "—" ? "" : (a.country ?? ""),
                    phone: profile.phone === "—" ? "" : (profile.phone ?? ""),
                    firstName: profile.firstName === "—" ? "" : (profile.firstName ?? ""),
                    lastName: profile.lastName ?? "",
                    email: profile.email ?? "",
                });
                return;
            }

            const data = await res.json();
            console.log("GET /api/billing/address response:", data);

            // Fill the modal from DB
            setBillingDraft({
                street1: data.street1 ?? "",
                street2: data.street2 ?? "",
                city: data.city ?? "",
                province: data.province ?? "",
                postalCode: data.postalCode ?? "",
                country: data.country ?? "",
                phone: data.homePhone ?? "",
                firstName: data.firstName ?? "",
                lastName: data.lastName ?? "",
                email: data.email ?? "",
            });

            // Optional but recommended: also sync profile UI with DB
            setProfile((prev) => ({
                ...prev,
                customerId: data.customerId ?? prev.customerId,
                firstName: data.firstName ?? prev.firstName,
                lastName: data.lastName ?? prev.lastName,
                email: data.email ?? prev.email,
                phone: data.homePhone ?? prev.phone,
                billing: {
                    ...prev.billing,
                    address: {
                        ...prev.billing.address,
                        street1: data.street1 ?? prev.billing.address.street1,
                        street2: data.street2 ?? prev.billing.address.street2,
                        city: data.city ?? prev.billing.address.city,
                        province: data.province ?? prev.billing.address.province,
                        postalCode: data.postalCode ?? prev.billing.address.postalCode,
                        country: data.country ?? prev.billing.address.country,
                    },
                },
            }));
        } catch (e) {
            setBillingError(e?.message || "Failed to load billing info");
        }
    }

    function closeBillingEditor() {
        setShowBillingModal(false);
        setBillingDraft(null);
        setBillingError("");
        // DO NOT setAddressPromptDismissed here
    }

    const dismissKey = useMemo(() => {
        // use something stable and unique
        const id = sessionUser?.raw?.externalId ?? sessionUser?.customerId ?? sessionUser?.username ?? "anon";
        return `tc_profile_prompt_dismissed_${id}`;
    }, [sessionUser]);

    async function saveBillingAddress() {
        setBillingSaving(true);
        setBillingError("");

        try {
            // Map phone -> homePhone before sending to backend
            const payload = {
                ...billingDraft,
                homePhone: billingDraft.phone,
                firstName: billingDraft.firstName === "—" ? "" : billingDraft.firstName,
                lastName: billingDraft.lastName === "—" ? "" : (billingDraft.lastName ?? ""),
                email: billingDraft.email === "—" ? "" : (billingDraft.email ?? ""),
            };

            delete payload.phone;

            const res = await fetch("/api/billing/address", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });


            if (res.status === 401) {
                // session expired
                closeBillingEditor();
                navigate("/login", { replace: true });
                return;
            }

            if (!res.ok) {
                const msg = await res.text();
                setBillingError(msg || "Failed to save address");
                return;
            }

            const updated = await res.json();
      //      console.log("PUT /api/billing/address response:", updated);


// updated = { street1, street2, city, province, postalCode, country, customerId }

            const nextPhone =
                updated.homePhone ??
                updated.phone ??
                billingDraft.phone ??
                "";

            if (updated.customerId) {
                setSessionUser((prev) =>
                    prev ? { ...prev, customerId: updated.customerId, homePhone: nextPhone, firstName: updated.firstName ?? prev.firstName,
                        lastName: updated.lastName ?? prev.lastName,
                        email: updated.email ?? prev.email, } : prev
                );
            }

            setProfile((prev) => ({
                ...prev,
                customerId: updated.customerId ?? prev.customerId,
                phone: nextPhone,
                firstName: updated.firstName ?? prev.firstName,
                lastName: updated.lastName ?? prev.lastName,
                email: updated.email ?? prev.email,
                billing: {
                    ...prev.billing,
                    address: { ...prev.billing.address, ...updated },
                },
            }));

            setAddressPromptDismissed(false);
            localStorage.removeItem(dismissKey);

            closeBillingEditor();

        } catch (e) {
            setBillingError(e?.message || "Failed to save address");
        } finally {
            setBillingSaving(false);
        }
    }



    // keep sessionUser synced with normal-login prop
    useEffect(() => {
        if (!userProp) return;
        setSessionUser((prev) => ({
            ...(prev ?? {}),
            ...userProp,
            employeeId: userProp.employeeId ?? prev?.employeeId ?? null,
            customerId: userProp.customerId ?? prev?.customerId ?? null,
            userType: userProp.userType ?? prev?.userType ?? null,
        }));
    }, [userProp]);



    // OAuth flow: if no userProp, fetch /api/me
    useEffect(() => {

        // if (userProp) {   // ✅ if App already has user, don't fetch /api/me here
        //     setLoading(false);
        //     return;
        // }

        let cancelled = false;

        async function loadMe() {
            try {
                setError("");
                setLoading(true);

                const res = await fetch("/api/me", { credentials: "include" });

                if (res.status === 401 || res.status === 404) {
                    // 401 = not authenticated, 404 = authenticated but no UA row ("Not registered")
                    setSessionUser(null);
                    setLoading(false);
                    return;
                }

                if (!res.ok) {
                    const msg = await res.text().catch(() => "");
                    setError(msg || "Failed to load /api/me");
                    setLoading(false);
                    return;
                }


                const me = await res.json();
            //    console.log("ME RESPONSE:", me);


                // ✅ set identity from /api/me (works for normal + oauth)
                setSessionUser((prev) => ({
                    ...(prev ?? {}),
                    ...(userProp ?? {}),
                    employeeId: me.employeeId ?? prev?.employeeId ?? null,
                    customerId: me.customerId ?? prev?.customerId ?? null,
                    role: me.role ?? prev?.role ?? null,
                    userType: me.userType ?? prev?.userType ?? (me.employeeId ? "Employee" : "Customer"),
                    username: me.name ?? prev?.username ?? userProp?.username ?? "User",
                    raw: me,
                }));


                // ✅ hydrate address for EVERYONE
                // ✅ ALWAYS hydrate identity fields (including phone), even if no address yet
                setProfile((prev) => ({
                    ...prev,
                    avatarUrl: me.avatarUrl ?? prev.avatarUrl,
                    firstName: me.firstName ?? prev.firstName,
                    lastName: me.lastName ?? prev.lastName,
                    email: me.email ?? prev.email,
                    phone: me.homePhone ?? prev.phone,
                }));

                console.log("me.avatarUrl =", me.avatarUrl);


// ✅ hydrate address only if present
                if (me?.address) {
                    setProfile((prev) => ({
                        ...prev,
                        billing: {
                            ...prev.billing,
                            address: {
                                ...prev.billing.address,
                                street1: me.address.street1 ?? prev.billing.address.street1,
                                street2: me.address.street2 ?? prev.billing.address.street2,
                                city: me.address.city ?? prev.billing.address.city,
                                province: me.address.province ?? prev.billing.address.province,
                                postalCode: me.address.postalCode ?? prev.billing.address.postalCode,
                                country: me.address.country ?? prev.billing.address.country,
                            },
                        },
                    }));
                }


                // after you setSessionUser(...) with me
                if (!cancelled) {
                    setLoading(false);
                }
                return;

            } catch (e) {
                if (!cancelled) setError(e?.message || "Failed to load /api/me");
                if (!cancelled) {
                    setSessionUser(null);   // ✅ add this back
                    setLoading(false);
                }
                return;

            }
        }

        loadMe();
        return () => { cancelled = true; };
    }, [userProp]);

    // whenever we have a sessionUser, update base identity fields
    useEffect(() => {
        if (!sessionUser) return;

        setProfile((prev) => ({
            ...prev,
            customerId: sessionUser.customerId ?? null,
            phone: sessionUser.homePhone ?? prev.phone,
            firstName: sessionUser.firstName ?? prev.firstName,
            lastName: sessionUser.lastName ?? prev.lastName,
            email: sessionUser.email ?? prev.email,
            avatarUrl: sessionUser?.raw?.avatarUrl ?? prev.avatarUrl,

        }));
    }, [sessionUser]);

    const canRegisterAsCustomer = useMemo(() => {
        if (loading) return false;
        if (!sessionUser) return false;

        const hasCustomer = (sessionUser.customerId ?? 0) > 0;
        const isEmployee = (sessionUser.employeeId ?? 0) > 0;

        return isEmployee && !hasCustomer;
    }, [loading, sessionUser]);

    const shouldPromptBilling = useMemo(() => {
        const hasCustomer = (sessionUser?.customerId ?? 0) > 0;
        const isEmployee = (sessionUser?.employeeId ?? 0) > 0;

        const a = profile.billing?.address;
        const missing =
            !a ||
            !a.street1 || a.street1 === "—" ||
            !a.city || a.city === "—" ||
            !a.province || a.province === "—" ||
            !a.postalCode || a.postalCode === "—";

        return (hasCustomer && missing) || (isEmployee && !hasCustomer);
    }, [sessionUser, profile.billing?.address]);



    function completeLater() {
        setAddressPromptDismissed(true);
        localStorage.setItem(dismissKey, "1");

        setShowBillingModal(false);
        setBillingDraft(null);
        setBillingError("");
    }


    useEffect(() => {
        if (!dismissKey) return;
        const v = localStorage.getItem(dismissKey);
        setAddressPromptDismissed(v === "1");
    }, [dismissKey]);


    // useEffect(() => {
    //     if (!loading && sessionUser && shouldPromptBilling && !showBillingModal && !addressPromptDismissed) {
    //         openBillingEditor();
    //     }
    // }, [loading, sessionUser, shouldPromptBilling, showBillingModal, addressPromptDismissed]);


    const tierInfo = useMemo(() => {
        const pts = Number(profile.points ?? 0);
        const isBronze = pts >= BRONZE_REQUIREMENT;
        const progress = Math.min(100, Math.round((pts / BRONZE_REQUIREMENT) * 100));
        const remaining = Math.max(0, BRONZE_REQUIREMENT - pts);
        return { isBronze, progress, remaining };
    }, [profile.points]);

    const isEmployee =
        sessionUser?.userType === "Employee" || (sessionUser?.employeeId ?? 0) > 0;

    const customerTypeLabel = tierInfo.isBronze
        ? "Frequent Traveler (Bronze)"
        : (isEmployee ? "Employee Customer" : "Guest Customer");

    const rewardsLabel = tierInfo.isBronze
        ? "Frequent Traveler (Bronze)"
        : "Guest Customer";


    const [avatarFile, setAvatarFile] = useState(null);

    const onPickAvatar = (file) => {
        if (!file) return;
        setAvatarFile(file);
        setAvatarUrl(URL.createObjectURL(file)); // preview
    };


// profile picture logic
    const isOAuthUser = !!sessionUser?.picture ||
        !!sessionUser?.raw?.provider; // since /api/me adds provider for OAuth;
    const canEditAvatar = !isOAuthUser; // owner implied since it's /profile

// avatarUrl = local preview only (from file input)
// profile.avatarUrl = saved custom avatar url (from your backend)
// sessionUser.picture = oauth provider picture

    const savedAvatarUrl = profile.avatarUrl || null;

    const oauthPicture =
        sessionUser?.picture ||
        sessionUser?.raw?.picture ||
        sessionUser?.raw?.attributes?.picture ||
        null;

    const displayAvatar = isOAuthUser
        ? oauthPicture
        : (avatarUrl || savedAvatarUrl || null);
    // preview > saved > initials

    console.log("savedAvatarUrl =", savedAvatarUrl);
    console.log("oauthPicture   =", oauthPicture);
    console.log("displayAvatar  =", displayAvatar);


    async function saveAvatarToBackend() {
        if (!avatarFile) return;


        // You need the actual File, so store it when picking:
        // const [avatarFile, setAvatarFile] = useState(null);

        const formData = new FormData();
        formData.append("avatar", avatarFile);

        const res = await fetch("/api/me/avatar", {
            method: "PUT",
            credentials: "include",
            body: formData,
        });

        if (!res.ok) {
            const msg = await res.text();
            setError(msg || "Failed to save avatar");
            return;
        }

        const data = await res.json(); // { avatarUrl: "..." }
        setProfile(p => ({ ...p, avatarUrl: data.avatarUrl }));
        setSessionUser(u =>
            u ? { ...u, raw: { ...(u.raw ?? {}), avatarUrl: data.avatarUrl } } : u
        );
        setAvatarUrl(null); // clear preview after saving
        setAvatarFile(null);

    }

    async function deleteAvatarFromBackend() {
        const res = await fetch("/api/me/avatar", {
            method: "DELETE",
            credentials: "include",
        });

        if (!res.ok) {
            const msg = await res.text();
            setError(msg || "Failed to delete avatar");
            return;
        }

        setProfile(p => ({ ...p, avatarUrl: null }));
        setSessionUser(u =>
            u ? { ...u, raw: { ...(u.raw ?? {}), avatarUrl: null } } : u
        );
        setAvatarUrl(null);
        setAvatarFile(null);
    }

    useEffect(() => {
        return () => {
            if (avatarUrl) URL.revokeObjectURL(avatarUrl);
        };
    }, [avatarUrl]);


    // shoiwng customer/employee id
    const employeeId = Number(sessionUser?.employeeId ?? sessionUser?.raw?.employeeId ?? 0);
    const customerId =
        sessionUser?.raw?.externalId ??
        sessionUser?.customerId ??
        profile.customerId ??
        "—";

  //  console.log("sessionUser.employeeId:", sessionUser?.employeeId, "raw:", sessionUser?.raw?.employeeId);


    // deleting the profile logic
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    async function deleteMyProfile() {
        setDeleting(true);
        setDeleteError("");

        try {
            const res = await fetch("/api/me", {
                method: "DELETE",
                credentials: "include",
            });

            if (!res.ok && res.status !== 401) {
                const msg = await res.text();
                setDeleteError(msg || "Failed to delete profile.");
                return;
            }

            // ✅ clear any cached client auth
            localStorage.removeItem(dismissKey);
            localStorage.removeItem("tc_user");

            // ✅ also tell the parent/global auth to clear (so navbar updates)
            if (onLogout) {
                await onLogout(); // should setUser(null) in App
            }

            setShowDeleteModal(false);
            setSessionUser(null);
            navigate("/", { replace: true });
        } catch (e) {
            setDeleteError(e?.message || "Failed to delete profile.");
        } finally {
            setDeleting(false);
        }
    }


    if (shouldRedirect) return <Navigate to="/" replace />;

    return (

        <Container className="py-4 py-md-5 px-4">
            {/*compelete your profile alert*/}
            {shouldPromptBilling && !addressPromptDismissed && !showBillingModal && (
                <Alert variant="info" className="mb-3">
                    <div className="fw-bold">Complete your profile</div>
                    <div className="small">
                        Please add your billing address to continue.
                    </div>
                    <Button className="mt-2" onClick={openBillingEditor}>
                        Add Address
                    </Button>
                </Alert>
            )}


            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
                <div>
                    <h1
                        className={`fw-black mb-1 ${darkMode ? "text-light" : "text-dark"}`}
                        style={{ fontWeight: 900 }}
                    >
                        My Profile
                    </h1>

                    <div className={`d-flex align-items-center gap-4 ${mutedClass}`}>
                        <div>
                            Customer ID:{" "}
                            <span className={darkMode ? "text-light" : "text-dark"}>
      {sessionUser?.raw?.externalId ?? profile.customerId ?? "—"}
    </span>
                        </div>

                        {employeeId > 0 && (
                            <div>
                                Employee ID:{" "}
                                <span className={darkMode ? "text-light" : "text-dark"}>
                                {employeeId}
                              </span>
                            </div>
                        )}
                    </div>


                </div>

                <div className="d-flex gap-2">
                    <Button
                        variant={darkMode ? "outline-light" : "outline-secondary"}
                        as={Link}
                        to="/plans"
                        style={{ borderRadius: 14 }}
                    >
                        Manage Plans
                    </Button>

                    <Button
                        variant={darkMode ? "outline-danger" : "danger"}
                        style={{ borderRadius: 14 }}
                        onClick={() => {
                            setDeleteConfirm("");
                            setDeleteError("");
                            setShowDeleteModal(true);
                        }}
                    >
                        Delete Profile
                    </Button>
                </div>
            </div>

            {error && (
                <Alert variant="danger">
                    <div className="fw-bold">Profile error</div>
                    <div className="small">{error}</div>
                </Alert>
            )}

            {loading ? (
                <div className="py-5 text-center">
                    <Spinner animation="border" />
                    <div className={`mt-2 ${mutedClass}`}>Loading your profile…</div>
                </div>
            ) : (
                <Row className="g-4">
                    {/* LEFT */}
                    <Col lg={4}>
                        <Card className={`${cardBase}`} style={{ borderRadius: 22 }}>
                            <Card.Body className="p-4">
                                <div className="d-flex align-items-center gap-3">
                                    {/* Avatar circle */}
                                    <div
                                        className="d-flex align-items-center justify-content-center overflow-hidden"
                                        style={{
                                            width: 72,
                                            height: 72,
                                            borderRadius: 18,
                                            background: displayAvatar
                                                ? "transparent"
                                                : "linear-gradient(135deg, #7c3aed, #ec4899)",
                                            color: "white",
                                            fontWeight: 900,
                                            fontSize: 20,
                                        }}
                                        aria-label="Profile picture"
                                        title="Profile picture"
                                    >
                                        {displayAvatar ? (
                                            <img
                                                src={displayAvatar}
                                                alt="Profile"
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                referrerPolicy="no-referrer"
                                                onError={() => {
                                                    setAvatarUrl(null);
                                                    setAvatarFile(null);
                                                    if (!isOAuthUser) {
                                                        setProfile((p) => ({ ...p, avatarUrl: null }));
                                                    }
                                                }}

                                            />
                                        ) : (
                                            initials(`${profile.firstName} ${profile.lastName}`)
                                        )}
                                    </div>

                                    {/* Name + contact */}
                                    <div className="flex-grow-1">
                                        <div
                                            className={`fw-black ${darkMode ? "text-light" : "text-dark"}`}
                                            style={{ fontWeight: 900, fontSize: "1.25rem" }}
                                        >
                                            {profile.firstName} {profile.lastName}
                                        </div>

                                        <div className={mutedClass}>
                                            {profile.email || sessionUser?.username || "—"}
                                        </div>

                                        <div className={mutedClass}>
                                            {profile.phone?.trim() ? `Phone: ${profile.phone}` : "Phone: —"}
                                        </div>

                                        <div className="mt-2">
                                            <Badge
                                                bg={tierInfo.isBronze ? "warning" : (isEmployee ? "info" : "secondary")}
                                                style={{ borderRadius: 999, padding: "0.4rem 0.7rem" }}
                                            >
                                                {customerTypeLabel}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Avatar controls */}
                                <Form.Group className="mt-3">
                                    <Form.Label className={mutedClass}>Profile picture</Form.Label>

                                    {isOAuthUser ? (
                                        <div className={`small ${mutedClass}`}>
                                            Using your OAuth profile picture.
                                        </div>
                                    ) : (
                                        <>
                                            <Form.Control
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => onPickAvatar(e.target.files?.[0])}
                                            />

                                            <div className="d-flex gap-2 mt-2">
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={saveAvatarToBackend}
                                                    disabled={!avatarFile}
                                                >
                                                    Save
                                                </Button>
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    onClick={() => { setAvatarUrl(null); setAvatarFile(null); }}
                                                    disabled={!avatarUrl}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={deleteAvatarFromBackend}
                                                    disabled={!savedAvatarUrl}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </Form.Group>



                            </Card.Body>
                        </Card>

                        {/* Points */}
                        <Card className={`${cardBase} mt-4`} style={{ borderRadius: 22 }}>
                            <Card.Body className="p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div
                                        className={`fw-black ${darkMode ? "text-light" : "text-dark"}`}
                                        style={{ fontWeight: 900 }}
                                    >
                                        Rewards Points
                                    </div>
                                    <Star size={18} />
                                </div>

                                <div className="mt-3">
                                    <div
                                        className={`fw-black ${darkMode ? "text-light" : "text-dark"}`}
                                        style={{ fontWeight: 900, fontSize: "2rem" }}
                                    >
                                        {Number(profile.points ?? 0).toLocaleString()} pts
                                    </div>
                                    <div className={mutedClass}>
                                        Earn {POINTS_PER_DOLLAR} point per $1 spent • Spend tracked:{" "}
                                        {formatMoney(profile.totalSpent)}
                                    </div>
                                </div>

                                <div className="mt-3">
                                    <div className="d-flex justify-content-between small">
                    <span className={mutedClass}>
                      Progress to Bronze ({BRONZE_REQUIREMENT.toLocaleString()} pts)
                    </span>
                                        <span className={mutedClass}>{tierInfo.progress}%</span>
                                    </div>
                                    <ProgressBar now={tierInfo.progress} className="mt-1" />

                                    {!tierInfo.isBronze ? (
                                        <div className={`small mt-2 ${mutedClass}`}>
                                            {tierInfo.remaining.toLocaleString()} pts to become a Frequent Traveler (Bronze).
                                        </div>
                                    ) : (
                                        <div className="small mt-2 text-warning">
                                            <Crown size={16} className="me-1" />
                                            Bronze active: 15% discount on the first {formatMoney(BRONZE_DISCOUNT_CAP)} spent
                                            after joining.
                                        </div>
                                    )}
                                </div>

                                <div className="mt-3">
                                    <Alert variant={tierInfo.isBronze ? "warning" : "secondary"} className="mb-0">
                                        <div className="fw-bold">Customer Types</div>
                                        <ul className="mb-0 mt-2">
                                            <li>
                                                <strong>Guest Customer:</strong> Standard booking access with no additional discounts.
                                            </li>
                                            <li>
                                                <strong>Frequent Traveler (Bronze):</strong> Requires{" "}
                                                {BRONZE_REQUIREMENT.toLocaleString()} pts. After becoming a member, get{" "}
                                                <strong>{Math.round(BRONZE_DISCOUNT_RATE * 100)}%</strong> off the first{" "}
                                                <strong>{formatMoney(BRONZE_DISCOUNT_CAP)}</strong> spent.
                                            </li>
                                        </ul>
                                    </Alert>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* RIGHT */}
                    <Col lg={8}>
                        {/* Subscription & Plan */}
                        <Card className={`${cardBase}`} style={{ borderRadius: 22 }}>
                            <Card.Body className="p-4">
                                <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
                                    <div>
                                        <div
                                            className={`fw-black ${darkMode ? "text-light" : "text-dark"}`}
                                            style={{ fontWeight: 900, fontSize: "1.25rem" }}
                                        >
                                            Subscription & Plan
                                        </div>
                                        <div className={mutedClass}>
                                            Your current registered plan and subscription details.
                                        </div>
                                    </div>

                                    <Badge
                                        bg={profile.plan.status === "Active" ? "success" : "secondary"}
                                        style={{ borderRadius: 999, padding: "0.45rem 0.75rem", width: "fit-content" }}
                                    >
                                        {profile.plan.status || "Inactive"}
                                    </Badge>
                                </div>

                                <Row className="g-3 mt-3">
                                    <Col md={6}>
                                        <div className={`p-3 ${darkMode ? "tc-card-dark" : "bg-light"}`} style={{ borderRadius: 18 }}>
                                            <div className="d-flex align-items-center gap-2">
                                                <Package size={18} />
                                                <div className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`}>Plan</div>
                                            </div>
                                            <div
                                                className={`fw-black mt-2 ${darkMode ? "text-light" : "text-dark"}`}
                                                style={{ fontWeight: 900, fontSize: "1.4rem" }}
                                            >
                                                {profile.plan.name || "—"}
                                            </div>
                                            <div className={mutedClass}>
                                                {profile.plan.monthlyPrice != null
                                                    ? `${formatMoney(profile.plan.monthlyPrice)}/month`
                                                    : "—"}
                                            </div>
                                            {profile.plan.startedAt && (
                                                <div className={`small mt-2 ${mutedClass}`}>Started: {String(profile.plan.startedAt)}</div>
                                            )}
                                        </div>
                                    </Col>

                                    <Col md={6}>
                                        <div className={`p-3 ${darkMode ? "tc-card-dark" : "bg-light"}`} style={{ borderRadius: 18 }}>
                                            <div className="d-flex align-items-center gap-2">
                                                <ShieldCheck size={18} />
                                                <div className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`}>Included</div>
                                            </div>

                                            {(profile.plan.features?.length ?? 0) > 0 ? (
                                                <ul className={`mt-2 mb-0 ${mutedClass}`}>
                                                    {profile.plan.features.slice(0, 6).map((f, idx) => (
                                                        <li key={idx}>
                                                            {typeof f === "string" ? f : `${f.name}: ${f.value}${f.unit ?? ""}`}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <div className={`mt-2 ${mutedClass}`}>No plan features loaded yet.</div>
                                            )}
                                        </div>
                                    </Col>
                                </Row>

                                {/* Add-ons */}
                                <div className="mt-4">
                                    <div className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`}>Add-ons</div>
                                    {(profile.plan.addOns?.length ?? 0) > 0 ? (
                                        <Row className="g-2 mt-1">
                                            {profile.plan.addOns.map((a, idx) => (
                                                <Col md={6} key={idx}>
                                                    <div className={`p-3 ${darkMode ? "tc-card-dark" : "bg-light"}`} style={{ borderRadius: 16 }}>
                                                        <div className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`}>
                                                            {a.name ?? a.addOnName ?? a}
                                                        </div>
                                                        {a.monthlyPrice != null && (
                                                            <div className={mutedClass}>+{formatMoney(a.monthlyPrice)}/month</div>
                                                        )}
                                                        {a.description && <div className={`small mt-1 ${mutedClass}`}>{a.description}</div>}
                                                    </div>
                                                </Col>
                                            ))}
                                        </Row>
                                    ) : (
                                        <div className={mutedClass}>No add-ons attached.</div>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Billing */}
                        <Card className={`${cardBase} mt-4`} style={{ borderRadius: 22 }}>
                            <Card.Body className="p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <div>
                                        <div
                                            className={`fw-black ${darkMode ? "text-light" : "text-dark"}`}
                                            style={{ fontWeight: 900, fontSize: "1.25rem" }}
                                        >
                                            Billing Information
                                        </div>
                                        <div className={mutedClass}>Payment method, next bill, and billing address.</div>
                                    </div>
                                    <CreditCard size={18} />
                                </div>

                                <Row className="g-3 mt-3">
                                    <Col md={6}>
                                        <div className={`p-3 ${darkMode ? "tc-card-dark" : "bg-light"}`} style={{ borderRadius: 18 }}>
                                            <div className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`}>Next bill</div>
                                            <div
                                                className={`fw-black mt-2 ${darkMode ? "text-light" : "text-dark"}`}
                                                style={{ fontWeight: 900, fontSize: "1.6rem" }}
                                            >
                                                {profile.billing.nextBillAmount != null ? formatMoney(profile.billing.nextBillAmount) : "—"}
                                            </div>
                                            <div className={mutedClass}>
                                                {profile.billing.nextBillDate
                                                    ? `Due: ${String(profile.billing.nextBillDate)}`
                                                    : "No upcoming invoice loaded."}
                                            </div>

                                            <div className="mt-3">
                                                <div className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`}>Payment method</div>
                                                <div className={mutedClass}>
                                                    {profile.billing.paymentMethod?.brand ?? "—"} •••• {profile.billing.paymentMethod?.last4 ?? "—"}
                                                </div>
                                            </div>
                                        </div>
                                    </Col>

                                    <Col md={6}>
                                        <div className={`p-3 ${darkMode ? "tc-card-dark" : "bg-light"}`} style={{ borderRadius: 18 }}>
                                            <div className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`}>Billing address</div>

                                            <div className={`mt-2 ${mutedClass}`}>
                                                <div>{profile.billing.address?.street1 ?? "—"}</div>

                                                {profile.billing.address?.street2 &&
                                                    profile.billing.address.street2 !== "—" &&
                                                    profile.billing.address.street2.trim() !== "" && (
                                                        <div>{profile.billing.address.street2}</div>
                                                    )}

                                                <div>
                                                    {(profile.billing.address?.city ?? "—")},{" "}
                                                    {(profile.billing.address?.province ?? "—")}{" "}
                                                    {(profile.billing.address?.postalCode ?? "")}
                                                </div>
                                                <div>{profile.billing.address?.country ?? "—"}</div>
                                            </div>

                                            <Button
                                                variant={darkMode ? "outline-light" : "outline-secondary"}
                                                className="mt-3 fw-bold"
                                                style={{ borderRadius: 14 }}
                                                onClick={openBillingEditor}
                                            >
                                                Edit Billing
                                            </Button>
                                        </div>
                                    </Col>
                                </Row>

                                {/* Invoices */}
                                <div className="mt-4">
                                    <div className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`}>Billing History</div>
                                    {(profile.billing.invoices?.length ?? 0) > 0 ? (
                                        <Table responsive className="mt-2" bordered hover>
                                            <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Amount</th>
                                                <th>Status</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {profile.billing.invoices.map((inv, idx) => (
                                                <tr key={idx}>
                                                    <td>{inv.date ?? "—"}</td>
                                                    <td>{inv.amount != null ? formatMoney(inv.amount) : "—"}</td>
                                                    <td>{inv.status ?? "—"}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </Table>
                                    ) : (
                                        <div className={mutedClass}>No invoices loaded yet.</div>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}
        {/* ============== for edit billing ====================   */}
            <Modal
                show={showBillingModal}
                onHide={needsAddress ? undefined : closeBillingEditor}
                backdrop={needsAddress ? "static" : true}
                keyboard={!needsAddress}
                centered
            >

            <Modal.Header closeButton={!needsAddress}>
                    <Modal.Title>Edit Billing Address</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {billingError && <Alert variant="danger">{billingError}</Alert>}

                    {!billingDraft ? null : (
                        <>
                            <Form.Group className="mb-3">
                                <Form.Label>First Name</Form.Label>
                                <Form.Control
                                    value={billingDraft.firstName}
                                    onChange={(e) => setBillingDraft(d => ({ ...d, firstName: e.target.value }))}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Last Name</Form.Label>
                                <Form.Control
                                    value={billingDraft.lastName}
                                    onChange={(e) => setBillingDraft(d => ({ ...d, lastName: e.target.value }))}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                    type="email"
                                    value={billingDraft.email}
                                    onChange={(e) => setBillingDraft(d => ({ ...d, email: e.target.value }))}
                                />
                            </Form.Group>
                            {needsPhone && (
                                <Form.Group className="mb-3">
                                    <Form.Label>Phone Number</Form.Label>
                                    <Form.Control
                                        value={billingDraft.phone}
                                        onChange={(e) => setBillingDraft((d) => ({ ...d, phone: e.target.value }))}
                                        placeholder="403-555-1234"
                                    />

                                </Form.Group>
                            )}

                            <Form.Group className="mb-3">
                                <Form.Label>Street 1</Form.Label>
                                <Form.Control
                                    value={billingDraft.street1}
                                    onChange={(e) => setBillingDraft((d) => ({ ...d, street1: e.target.value }))}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Street 2 (optional)</Form.Label>
                                <Form.Control
                                    value={billingDraft.street2}
                                    onChange={(e) => setBillingDraft((d) => ({ ...d, street2: e.target.value }))}
                                />
                            </Form.Group>

                            <Row className="g-2">
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>City</Form.Label>
                                        <Form.Control
                                            value={billingDraft.city}
                                            onChange={(e) => setBillingDraft((d) => ({ ...d, city: e.target.value }))}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Province</Form.Label>
                                        <Form.Control
                                            value={billingDraft.province}
                                            onChange={(e) => setBillingDraft((d) => ({ ...d, province: e.target.value }))}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row className="g-2">
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Postal Code</Form.Label>
                                        <Form.Control
                                            value={billingDraft.postalCode}
                                            onChange={(e) => setBillingDraft((d) => ({ ...d, postalCode: e.target.value }))}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Country</Form.Label>
                                        <Form.Control
                                            value={billingDraft.country}
                                            onChange={(e) => setBillingDraft((d) => ({ ...d, country: e.target.value }))}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={closeBillingEditor}
                        disabled={billingSaving || needsAddress}
                    >
                        Cancel
                    </Button>
                    <Button onClick={saveBillingAddress}
                            disabled={
                        billingSaving ||
                        !billingDraft?.street1?.trim()||
                        (needsPhone && !billingDraft?.phone?.trim())
                    }>
                        {billingSaving ? "Saving..." : "Save"}
                    </Button>
                </Modal.Footer>
            </Modal>

        {/* Deleting profile modal  */}
            <Modal
                show={showDeleteModal}
                onHide={deleting ? undefined : () => setShowDeleteModal(false)}
                backdrop={deleting ? "static" : true}
                keyboard={!deleting}
                centered
            >
                <Modal.Header closeButton={!deleting}>
                    <Modal.Title>Delete Profile</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {deleteError && <Alert variant="danger">{deleteError}</Alert>}

                    <Alert variant="warning" className="mb-3">
                        <div className="fw-bold">This can’t be undone.</div>
                        <div className="small">
                            Your account and associated customer data will be permanently removed.
                        </div>
                    </Alert>

                    <Form.Group>
                        <Form.Label className="fw-bold">
                            Type <span className="text-danger">DELETE</span> to confirm
                        </Form.Label>
                        <Form.Control
                            value={deleteConfirm}
                            onChange={(e) => setDeleteConfirm(e.target.value)}
                            placeholder="DELETE"
                            disabled={deleting}
                        />
                    </Form.Group>
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowDeleteModal(false)}
                        disabled={deleting}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="danger"
                        onClick={deleteMyProfile}
                        disabled={deleting || deleteConfirm.trim().toUpperCase() !== "DELETE"}
                    >
                        {deleting ? "Deleting..." : "Delete permanently"}
                    </Button>
                </Modal.Footer>
            </Modal>


        </Container>
    );
}
