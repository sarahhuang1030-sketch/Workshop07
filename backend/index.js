// backend/index.js
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// mock data
const plans = [
    { planId: 1, planName: "Basic", monthlyPrice: 10, tagline: "Simple plan", features: [], addOns: [] },
    { planId: 2, planName: "Pro", monthlyPrice: 20, tagline: "Power plan", features: [], addOns: [] }
];

const addOns = [
    { addOnId: 1, addOnName: "Extra Data", monthlyPrice: 5, description: "Add more data" }
];

// routes
app.get("/api/plans", (req, res) => {
    res.json(plans);
});

app.get("/api/addons", (req, res) => {
    res.json(addOns);
});

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
