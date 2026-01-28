import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

export default function AppFooter() {
    const { darkMode } = useTheme();

    return (
        <footer className={`mt-5 py-5 ${darkMode ? "tc-footer-dark" : "tc-footer-light"}`}>
            <Container fluid className="px-4">
                <Row className="g-4">
                    <Col md={4}>
                        <div className="fw-black" style={{ fontWeight: 900, fontSize: "1.2rem" }}>
                            TeleConnect
                        </div>
                        <div style={{ color: "rgba(255,255,255,0.75)" }}>
                            Fast plans, rewards, and support—built for your project demo.
                        </div>
                        <div className="small mt-2" style={{ color: "rgba(255,255,255,0.6)" }}>
                            CPRG220 • React + Spring Boot
                        </div>
                    </Col>

                    <Col md={3}>
                        <div className="fw-bold mb-2">Quick Links</div>
                        <div className="d-flex flex-column gap-1">
                            <Link to="/" style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none" }}>Home</Link>
                            <Link to="/plans" style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none" }}>Plans</Link>
                            <Link to="/packages" style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none" }}>Packages</Link>
                            <Link to="/booking" style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none" }}>Booking</Link>
                        </div>
                    </Col>

                    <Col md={3}>
                        <div className="fw-bold mb-2">Support</div>
                        <div style={{ color: "rgba(255,255,255,0.75)" }}>support@teleconnect.ca</div>
                        <div style={{ color: "rgba(255,255,255,0.75)" }}>1-800-555-0100</div>
                        <div className="small mt-2" style={{ color: "rgba(255,255,255,0.6)" }}>
                            24/7 Chat Support
                        </div>
                    </Col>

                    <Col md={2}>
                        <div className="fw-bold mb-2">Legal</div>
                        <div className="d-flex flex-column gap-1" style={{ color: "rgba(255,255,255,0.75)" }}>
                            <span>Privacy</span>
                            <span>Terms</span>
                        </div>
                    </Col>
                </Row>

                <hr style={{ borderColor: "rgba(255,255,255,0.15)" }} />

                <div className="text-center small" style={{ color: "rgba(255,255,255,0.6)" }}>
                    © {new Date().getFullYear()} TeleConnect. Made with ❤️ in Canada
                </div>
            </Container>
        </footer>
    );
}
