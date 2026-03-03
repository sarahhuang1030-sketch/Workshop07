/**Description: Delete profile modal, shown when user clicks "Delete Profile" in settings.
Asks user to type "DELETE" to confirm,
and shows a warning that this action is irreversible.
Created by: Sarah
Created on: February 2026

Modified by: Sherry
Modified on: March 2026
**/

import React, { useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";

export function DeleteProfileModal({ show, onClose, onDelete }) {
    const [confirm, setConfirm] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState("");

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await onDelete();
            onClose();
        } catch (err) {
            console.error(err);
            setError("Failed to delete profile.");
        }finally {
            setDeleting(false);
        }
    };

    return (
        <Modal
            show={show}
            onHide={deleting ? undefined : onClose}
            centered
            backdrop={deleting ? "static" : true}
            keyboard={!deleting}
        >
            <Modal.Header closeButton={!deleting}>
                <Modal.Title>Delete Profile</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}

                <Alert variant="warning" className="mb-3">
                    <div className="fw-bold">This can't be undone.</div>
                    <div className="small">Your account and data will be permanently removed.</div>
                </Alert>

                <Form.Group>
                    <Form.Label className="fw-bold">
                        Type <span className="text-danger">DELETE</span> to confirm
                    </Form.Label>
                    <Form.Control
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        placeholder="DELETE"
                        disabled={deleting}
                    />
                </Form.Group>
            </Modal.Body>

            <Modal.Footer>
                <Button
                    variant="secondary"
                    onClick={onClose}
                    disabled={deleting}
                    style={{ borderRadius: 14 }}
                >
                    Cancel
                </Button>

                <Button
                    variant="danger"
                    onClick={handleDelete}
                    disabled={deleting || confirm.trim().toUpperCase() !== "DELETE"}
                    style={{ borderRadius: 14 }}
                >
                    {deleting ? "Deleting..." : "Delete permanently"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}