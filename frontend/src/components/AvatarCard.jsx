/**
 Description: Avatar/Profile Picture component, used in the profile page and settings page.
 Shows the user's current avatar (from backend or OAuth), and allows uploading a new one or deleting it.
 Also displays user's name, email, phone, customer ID, and role badge.

 Created by: Sarah
 Created on: February 2026

 Modified by: Sherry
 Modified on: March 2026
 **/

import React, { useState, useEffect } from "react";
import { Card, Button, Form, Badge } from "react-bootstrap";

const DEFAULT_AVATAR = "/uploads/avatars/default.jpg";

export function AvatarCard({
                               profile,
                               sessionUser,
                               darkMode,
                               onSaveAvatar,
                               onDeleteAvatar,
                           }) {
    const cardBase = darkMode ? "bg-dark border-secondary" : "bg-white";
    const mutedClass = darkMode ? "text-light-50 text-secondary" : "text-muted";

    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [error, setError] = useState(null);

    /* -------------------------
       Extract OAuth picture URL
    -------------------------- */
    function pictureToUrl(pic) {
        if (!pic) return null;
        if (typeof pic === "string") return pic;
        if (pic?.data?.url) return pic.data.url;
        if (pic?.url) return pic.url;
        return null;
    }

    const oauthPictureUrl =
        pictureToUrl(sessionUser?.picture) ||
        pictureToUrl(sessionUser?.raw?.picture) ||
        pictureToUrl(sessionUser?.raw?.avatarUrl) ||
        null;

    const savedAvatarUrl = profile?.avatarUrl || null;

    /* -------------------------
       Decide which avatar to show
    -------------------------- */
    useEffect(() => {
        if (savedAvatarUrl) {
            setAvatarUrl(savedAvatarUrl);
        } else if (oauthPictureUrl) {
            setAvatarUrl(oauthPictureUrl);
        } else {
            setAvatarUrl(DEFAULT_AVATAR);
        }
    }, [savedAvatarUrl, oauthPictureUrl]);

    /* -------------------------
       Pick local file (preview)
    -------------------------- */
    function onPickAvatar(file) {
        if (!file) return;
        setAvatarFile(file);
        setAvatarUrl(URL.createObjectURL(file));
    }

    /* -------------------------
       Save avatar to backend
    -------------------------- */
    async function saveAvatarToBackend() {
        if (!avatarFile) return;

        try {
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

            const freshUrl = `${data.avatarUrl}${data.avatarUrl.includes("?") ? "&" : "?"}t=${Date.now()}`;

            setAvatarUrl(freshUrl);
            setAvatarFile(null);
            setError(null);

            onSaveAvatar?.(freshUrl);
        } catch (err) {
            setError("Upload failed");
        }
    }

    /* -------------------------
       Delete avatar
    -------------------------- */
    async function deleteAvatarFromBackend() {
        try {
            const res = await fetch("/api/me/avatar", {
                method: "DELETE",
                credentials: "include",
            });

            if (!res.ok) {
                const msg = await res.text();
                setError(msg || "Failed to delete avatar");
                return;
            }

            setAvatarFile(null);

            if (oauthPictureUrl) {
                setAvatarUrl(oauthPictureUrl);
            } else {
                setAvatarUrl(DEFAULT_AVATAR);
            }

            if (onDeleteAvatar) {
                onDeleteAvatar();
            }

            setError(null);
        } catch (err) {
            setError("Delete failed");
        }
    }

    /* -------------------------
       Cleanup preview URL
    -------------------------- */
    useEffect(() => {
        return () => {
            if (avatarUrl?.startsWith("blob:")) {
                URL.revokeObjectURL(avatarUrl);
            }
        };
    }, [avatarUrl]);


    // -------------change the badge color and label based on role----------------//
    const roleKey = String(profile?.role ?? "").toUpperCase();

    const roleLabel =
        roleKey === "EMPLOYEE"
            ? "Employee"
            : roleKey === "CUSTOMER"
                ? "Customer"
                : "Guest";

    let badgeVariant = "secondary"; // default grey

    if (roleKey === "EMPLOYEE") {
        badgeVariant = "info";        // light blue
    } else if (roleKey === "CUSTOMER") {
        badgeVariant = "secondary";   // grey
    } else {
        badgeVariant = "light";       // guest (very light)
    }

    return (
        <Card className={`${cardBase} mt-4 p-3`} style={{ borderRadius: 22 }}>
            <div className="d-flex align-items-center gap-3">
                {/* Left Information */}
                <img
                    src={avatarUrl || DEFAULT_AVATAR}
                    alt="Avatar"
                    style={{
                        width: 100,
                        height: 100,
                        borderRadius: "50%",
                        objectFit: "cover",
                    }}
                />

                {/* Right Information */}
                <div className="flex-grow-1">
                    <div
                        className={`fw-bold ${darkMode ? "text-light" : "text-dark"}`}
                        style={{ fontSize: "2rem" }}
                    >
                        {profile?.firstName} {profile?.lastName}
                    </div>
                    {/* ----------------- Email & Phone ----------------- */}
                    {profile?.email && (
                        <div className={`mt-1 small ${mutedClass}`}>
                            Email: {profile.email}
                        </div>
                    )}

                    <div className={`mt-1 small ${mutedClass}`}>
                        Phone: {profile?.phone ?? "—"}
                    </div>

                    <div className={`mt-1 small ${mutedClass}`}>
                        Customer ID: {profile?.customerId ?? "—"}
                    </div>

                    <div className="mt-1">
                        <Badge bg={badgeVariant}>
                            {roleLabel}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* ------------------- Upload Avatar Control ------------------- */}
            <Form.Group className="mt-3 text-center">

                <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={(e) => onPickAvatar(e.target.files?.[0])}
                    className="mt-2"
                />

                <div className="d-flex gap-2 mt-2 justify-content-center">
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
                        onClick={() => {
                            setAvatarFile(null);
                            if (savedAvatarUrl) {
                                setAvatarUrl(savedAvatarUrl);
                            } else if (oauthPictureUrl) {
                                setAvatarUrl(oauthPictureUrl);
                            } else {
                                setAvatarUrl(DEFAULT_AVATAR);
                            }
                        }}
                        disabled={!avatarFile}
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

                {error && <div className="text-danger mt-2 small">{error}</div>}
            </Form.Group>
        </Card>
    );
}