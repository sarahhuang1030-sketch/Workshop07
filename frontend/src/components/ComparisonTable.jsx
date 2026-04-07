import React, { useState } from "react";
import { Table, Form } from "react-bootstrap";

/*
  Telecom-style comparison table
  - Desktop: table comparison
  - Mobile: dropdown selector
*/

export default function ComparisonTable() {

    const options = [
        "With a Rogers credit card",
        "With a mobile plan",
        "With Save & Return"
    ];

    const [selected, setSelected] = useState(options[0]);

    const data = [
        {
            label: "Full price",
            values: ["$1200", "$1200", "$1200"]
        },
        {
            label: "Save & Return amount",
            values: ["-", "-", "$570"]
        },
        {
            label: "Financing amount",
            values: ["$1200", "$1200", "$630"]
        },
        {
            label: "Term",
            values: ["48 months", "24 months", "24 months"]
        },
        {
            label: "Keep phone?",
            values: ["Yes", "Yes", "No"]
        },
        {
            label: "Monthly device payments",
            values: ["$25/mo", "$50/mo", "$26.24/mo"],
            highlight: true
        }
    ];

    const selectedIndex = options.indexOf(selected);

    return (
        <div className="bg-white rounded-4 shadow-lg p-4 mt-4">

            {/* ================= MOBILE ================= */}
            <div className="d-md-none">

                <Form.Select
                    className="mb-3"
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                >
                    {options.map(o => (
                        <option key={o}>{o}</option>
                    ))}
                </Form.Select>

                <h5 className="text-center fw-bold mb-3">{selected}</h5>

                {data.map((row, i) => (
                    <div key={i} className="border-bottom py-2 text-center">
                        <div className="fw-bold">{row.label}</div>
                        <div className={row.highlight ? "fw-bold fs-5 text-primary" : ""}>
                            {row.values[selectedIndex]}
                        </div>
                    </div>
                ))}
            </div>

            {/* ================= DESKTOP ================= */}
            <div className="d-none d-md-block">

                <Table bordered hover className="text-center align-middle mb-0">

                    <thead className="table-light">
                    <tr>
                        <th className="text-start">Details</th>
                        {options.map(o => (
                            <th key={o}>{o}</th>
                        ))}
                    </tr>
                    </thead>

                    <tbody>
                    {data.map((row, i) => (
                        <tr key={i}>
                            <td className="text-start fw-bold">{row.label}</td>

                            {row.values.map((v, idx) => (
                                <td key={idx}>
                                    <span className={row.highlight ? "fw-bold text-primary fs-5" : ""}>
                                        {v}
                                    </span>
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>

                </Table>
            </div>
        </div>
    );
}