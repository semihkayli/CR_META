const fs = require("fs");
const path = require("path");

// Load .env
const envPath = path.join(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const eqIdx = trimmed.indexOf("=");
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim();
      process.env[key] = val;
    }
  });
}

async function test() {
  const apiKey = process.env.CLASH_ROYALE_API_KEY;
  const tag = "28VGG8YQL"; // LucasGSM
  const url = `https://api.clashroyale.com/v1/players/%23${tag}`;

  console.log("Fetching player 28VGG8YQL");
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" }
  });
  console.log("Status:", res.status);
  
  if (!res.ok) {
    console.error("HTTP Error", res.status, await res.text());
    return;
  }

  const data = await res.json();
  console.log("Response keys:", Object.keys(data));
  console.log("Items count:", data.items ? data.items.length : 0);
  if (data.items && data.items.length > 0) {
    console.log("First clan:", JSON.stringify(data.items[0], null, 2));
  }
}

test().catch(console.error);
