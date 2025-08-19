const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 8000;

// Use /tmp for temporary screenshots (Render ephemeral storage)
const OUTPUT_DIR = "/tmp/screenshots";
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Global browser instance
let browser;

// Launch Puppeteer browser at startup
(async () => {
  browser = await puppeteer.launch({
    executablePath: "/usr/bin/chromium", // system Chromium on Render
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
})();

// Home route
app.get("/", (req, res) => {
  res.json({ message: "Screenshot API is running" });
});

// Screenshot route
app.get("/screenshot", async (req, res) => {
  const url = req.query.url;
  const fullPage = req.query.full_page === "true";

  if (!url) return res.status(400).json({ error: "URL is required" });

  const filename = `${uuidv4()}.png`;
  const filepath = path.join(OUTPUT_DIR, filename);

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await page.screenshot({ path: filepath, fullPage });
    await page.close();

    // Send file and delete after sending
    res.sendFile(filepath, (err) => {
      if (!err) fs.unlink(filepath, () => {});
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to take screenshot" });
  }
});

// Gracefully close browser on exit
process.on("exit", async () => {
  if (browser) await browser.close();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
