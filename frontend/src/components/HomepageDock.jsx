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
    // {
    //     key: "tv",
    //     title: "TV",
    //     img: "https://images.ctfassets.net/8utyj17y1gom/6rFMeDwNqXBJPvEVU5EL7D/f20d056a9c254fa2517a5012745c19ad/Spotlight_4_2x.png",
    // },
    // {
    //     key: "security",
    //     title: "Home Security",
    //     img: "https://images.ctfassets.net/8utyj17y1gom/7ccSvg8ULvLI9upVwmYvZB/f20963e3d643e0560a39d94f75755da0/Spotlight_5_2x.png",
    // },
    {
        key: "support",
        title: "Support",
        img: "https://images.ctfassets.net/8utyj17y1gom/1cQjdrhWMC6q19C6nD3UO6/dddf5ee1c3da3d56c6cce4d85367f1f4/Spotlight_6_2x.png",
    },
];

export default function HomepageDock({ onSelect }) {
    return (
        <section className="py-4">
            <Container>
                <Row className="justify-content-center g-3">
                    {DOCK_ITEMS.map((item) => (
                        <Col
                            key={item.key}
                            xs={6}
                            sm={3}
                            md={2}
                            className="text-center"
                        >
                            <div
                                className="tc-dock-item"
                                onClick={() => item.action && onSelect?.(item.action)}
                            >
                                <img
                                    src={item.img}
                                    alt={item.title}
                                    className="img-fluid rounded"
                                />
                                <div className="mt-2 fw-semibold">
                                    {item.title}
                                </div>
                            </div>
                        </Col>
                    ))}
                </Row>
            </Container>
        </section>
    );
}
