import express from "express";
import puppeteer from "puppeteer-core";
import { v4 as uuidv4 } from "uuid";

const app = express();

app.get("/screenshot", async (req, res) => {
  const { url, full_page } = req.query;
  if (!url) return res.status(400).json({ error: "Missing ?url parameter" });

  try {
    const browser = await puppeteer.launch({
      executablePath: "/usr/bin/chromium",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    const screenshot = await page.screenshot({ fullPage: full_page === "true" });
    await browser.close();

    res.set("Content-Type", "image/png");
    res.send(screenshot);
  } catch (err) {
    console.error("Screenshot error:", err);
    res.status(500).json({ error: "Failed to take screenshot" });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
