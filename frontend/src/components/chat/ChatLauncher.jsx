import React from "react";
import { Button } from "react-bootstrap";

export default function ChatLauncher({
    title = "Customer Support Chat",
    statusDotColor = "#6b7280",
    onOpen
}) {
    return (
        <Button
            onClick={onOpen}
            variant="light"
            className="shadow border d-flex align-items-center justify-content-between px-3"
            style={{
                width: "280px",
                height: "44px",
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                marginLeft: "auto"
            }}
        >
            <span className="fw-semibold d-flex align-items-center gap-2">
                <span
                    style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        display: "inline-block",
                        backgroundColor: statusDotColor
                    }}
                />
                {title}
            </span>
        </Button>
    );
}