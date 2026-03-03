// src/validation/registerValidation.js

// ---- regex (shared) ----
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const usernameRegex = /^[a-zA-Z0-9]{8,20}$/;
export const postalCodeCA = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;

// ---- phone helpers ----
export const PHONE_MAX_DIGITS = 10;

export function digitsOnly(s) {
    return String(s || "").replace(/\D/g, "");
}

export function formatPhoneFromDigits(digits) {
    const d = (digits || "").slice(0, PHONE_MAX_DIGITS);

    if (d.length <= 3) return d.length ? `(${d}` : "";
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

// ---- postal helper: "XXX XXX" ----
export function formatPostalCode(value) {
    if (!value) return "";

    const cleaned = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    const first = cleaned.slice(0, 3);
    const second = cleaned.slice(3, 6);

    if (cleaned.length <= 3) return first;
    return `${first} ${second}`;
}

// ---- main validator ----
export function validateRegisterForm({
                                         form,
                                         isBusiness,
                                         isNormalSignup,
                                         isOAuthComplete,
                                         oauthEmailMissing,
                                         oauthEmail,
                                     }) {
    const errors = {};

    // shared required
    if (!form.firstName?.trim()) errors.firstName = "First name is required.";
    if (!form.lastName?.trim()) errors.lastName = "Last name is required.";

    const phoneDigits = digitsOnly(form.homePhone);
    if (!phoneDigits) errors.homePhone = "Phone is required.";
    else if (phoneDigits.length !== 10) errors.homePhone = "Phone must be 10 digits (e.g., (403) 555-1234).";

    if (isBusiness && !form.businessName?.trim()) errors.businessName = "Business name is required.";

    if (!form.billingStreet1?.trim()) errors.billingStreet1 = "Street address is required.";
    if (!form.billingCity?.trim()) errors.billingCity = "City is required.";
    if (!form.billingProvince?.trim()) errors.billingProvince = "Province is required.";
    if (!form.billingCountry?.trim()) errors.billingCountry = "Country is required.";

    if (!form.billingPostalCode?.trim()) {
        errors.billingPostalCode = "Postal code is required.";
    } else if (
        form.billingCountry?.trim().toLowerCase() === "canada" &&
        !postalCodeCA.test(form.billingPostalCode.trim())
    ) {
        errors.billingPostalCode = "Enter a valid Canadian postal code (e.g., T2X 1V4).";
    }

    // email rules
    const effectiveEmail = (isOAuthComplete ? (oauthEmail || form.email) : form.email).trim();
    if ((isNormalSignup || (isOAuthComplete && oauthEmailMissing)) && !effectiveEmail) {
        errors.email = "Email is required.";
    } else if (effectiveEmail && !emailRegex.test(effectiveEmail)) {
        errors.email = "Enter a valid email address.";
    }

    // normal signup rules
    if (isNormalSignup) {
        if (!form.username?.trim()) errors.username = "Username is required.";
        else if (!usernameRegex.test(form.username.trim())) {
            errors.username = "8–20 chars. Letters and numbers only.";
        }

        if (!form.password) errors.password = "Password is required.";
        else if (form.password.length < 8) errors.password = "Password must be at least 8 characters.";
        else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(form.password)) {
            errors.password =
                "Password must include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.";
        }

        if (!form.confirmPassword) errors.confirmPassword = "Please confirm your password.";
        else if (form.password !== form.confirmPassword) errors.confirmPassword = "Passwords do not match.";
    }

    return errors;
}