import { Container, Row, Col } from "react-bootstrap";

const DOCK_ITEMS = [
    {
        key: "mobile",
        title: "Mobile",
        img: "https://images.ctfassets.net/8utyj17y1gom/2VRrUtd56WSYip6V0ptRNu/f8143b975132a3758b03655e43aec162/spotlight4.png",
        action: "mobile",
    },
    {
        key: "internet",
        title: "Internet",
        img: "https://images.ctfassets.net/8utyj17y1gom/4PiiPC8GYTTwobGz3NBh6F/4bac37e946791ab0425df690bdf814ec/XB8_Front_2.png",
        action: "home",
    },
    {
        key: "support",
        title: "Support",
        img: "/headset.svg",
    },
];

export default function HomepageDock({ onSelect }) {
    return (
        <section className="py-4">
            <Container>
                <Row className="justify-content-center g-3">
                    {DOCK_ITEMS.map((item) => (
                        <Col key={item.key} xs={6} sm={3} md={2} className="text-center">
                            <div
                                className={`tc-dock-item ${!item.action ? "disabled" : ""}`}
                                onClick={() => item.action && onSelect?.(item.action)}
                            >
                                <img
                                    src={item.img}
                                    alt={item.title}
                                    className="img-fluid rounded"
                                    style={{ width: "100px", height: "100px", objectFit: "contain" }}
                                />
                                <div className="mt-2 fw-semibold">{item.title}</div>
                            </div>
                        </Col>
                    ))}
                </Row>
            </Container>
        </section>
    );
}