import React from "react";
import { Container } from "react-bootstrap";
import ManagerChatWorkspace from "../../components/chat/ManagerChatWorkspace";

export default function ManagerChatHub() {
    return (
        <Container fluid className="py-4">
            <div className="mb-4">
                <h2 className="fw-bold mb-2">Chat Hub</h2>
                <div className="text-muted">
                    Monitor chat requests, manage support conversations, and review customer context.
                </div>
            </div>

            <ManagerChatWorkspace />
        </Container>
    );
}