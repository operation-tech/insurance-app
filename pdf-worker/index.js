const express = require("express");
const fetch = require("node-fetch");
const pdfParse = require("pdf-parse");

const app = express();
app.use(express.json());

app.post("/extract", async (req, res) => {
  if (req.headers["x-worker-secret"] !== process.env.WORKER_SECRET) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  // existing logic continues...
});


app.post("/extract", async (req, res) => {
  try {
    const { pdf_url, request_id } = req.body;

    if (!pdf_url) {
      return res.status(400).json({ ok: false, error: "pdf_url missing" });
    }

    // 1️⃣ Download PDF
    const pdfRes = await fetch(pdf_url);
    if (!pdfRes.ok) {
      throw new Error("Failed to download PDF");
    }

    const buffer = await pdfRes.buffer();

    // 2️⃣ Extract text (THIS NOW WORKS)
    const data = await pdfParse(buffer);
    const text = data.text;

    // 3️⃣ Extract fields
    const cardMatch = text.match(/Card\s*Number\s*:\s*([A-Z0-9]+)/i);
    const nidMatch = text.match(/\b\d{14}\b/);

    if (!cardMatch || !nidMatch) {
      return res.json({
        ok: false,
        reason: "No card or NID found",
        preview: text.slice(0, 300),
      });
    }

    res.json({
      ok: true,
      cardNumber: cardMatch[1],
      nid: nidMatch[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(8080, () => {
  console.log("PDF worker running on port 8080");
});
