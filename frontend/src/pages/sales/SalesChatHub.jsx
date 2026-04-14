import React from "react";
import { Container } from "react-bootstrap";
import EmployeeChatWorkspace from "../../components/chat/EmployeeChatWorkspace";

export default function SalesChatHub() {
    return (
        <Container fluid className="py-4">
            <div className="mb-4">
                <h2 className="fw-bold mb-2">Chat Hub</h2>
                <div className="text-muted">
                    Manage pending customer chat requests and active support conversations.
                </div>
            </div>

            <EmployeeChatWorkspace role="agent" />
        </Container>
    );
}