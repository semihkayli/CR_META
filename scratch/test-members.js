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
  // Query clan members for #GVVG9J9Y (Queso)
  const url = `https://api.clashroyale.com/v1/clans/%23GVVG9J9Y/members`;

  console.log("Fetching clan members...");
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" }
  });
  console.log("Status:", res.status);

  if (!res.ok) {
    console.error("HTTP Error", res.status, await res.text());
    return;
  }

  const data = await res.json();
  console.log("Members count:", data.items ? data.items.length : 0);
  if (data.items && data.items.length > 0) {
    const firstMember = data.items[0];
    console.log("First member name:", firstMember.name);
    console.log("First member tag:", firstMember.tag); // This tag will contain '#' at the beginning
    
    // Now let's query this member's profile!
    // URL encode the tag (replace '#' with '%23')
    const encodedTag = firstMember.tag.replace("#", "%23");
    const playerUrl = `https://api.clashroyale.com/v1/players/${encodedTag}`;
    console.log("Querying player URL:", playerUrl);
    
    const playerRes = await fetch(playerUrl, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" }
    });
    console.log("Player profile status:", playerRes.status);
    if (playerRes.ok) {
      const playerData = await playerRes.json();
      console.log("Successfully fetched player profile!", playerData.name, "level:", playerData.expLevel);
    } else {
      console.error("Player profile fetch failed:", playerRes.status, await playerRes.text());
    }
  }
}

test().catch(console.error);
