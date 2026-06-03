import { NextRequest, NextResponse } from "next/server";
import { APP_CONFIG } from "@/config";

// Interface for Clash Royale Card
interface CRCard {
  name: string;
  id: number;
  level: number;
  maxLevel: number;
  count?: number;
  evolutionLevel?: number;
  iconUrls: {
    medium: string;
  };
}

// High-quality Mock Player response for local testing
const MOCK_PLAYER_DATA = {
  tag: "#P90G2PY8",
  name: "Mohamed Light",
  expLevel: 15,
  trophies: 8942,
  bestTrophies: 9000,
  wins: 15420,
  losses: 4890,
  battleCount: 20310,
  threeCrownWins: 6732,
  clan: {
    tag: "#Y2Y8RR8G",
    name: "Team Queso",
    badgeId: 16000135
  },
  currentPathOfLegendSeasonResult: {
    leagueNumber: 10, // Ultimate Champion
    trophies: 2341,
    rank: 1
  },
  // Active Battle Deck
  currentDeck: [
    {
      name: "Knight",
      id: 26000000,
      level: 15,
      maxLevel: 15,
      evolutionLevel: 1, // Evolved Knight
      iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/knight.png" }
    },
    {
      name: "Little Prince",
      id: 26000093,
      level: 15,
      maxLevel: 15,
      iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/littleprince.png" }
    },
    {
      name: "Goblins",
      id: 26000002,
      level: 15,
      maxLevel: 15,
      iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/goblins.png" }
    },
    {
      name: "Giant",
      id: 26000003,
      level: 15,
      maxLevel: 15,
      iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/giant.png" }
    },
    {
      name: "Phoenix",
      id: 26000087,
      level: 15,
      maxLevel: 15,
      iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/phoenix.png" }
    },
    {
      name: "The Log",
      id: 28000011,
      level: 15,
      maxLevel: 15,
      iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/thelog.png" }
    },
    {
      name: "Void",
      id: 28000034,
      level: 15,
      maxLevel: 15,
      iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/void.png" }
    },
    {
      name: "Electro Wizard",
      id: 26000042,
      level: 15,
      maxLevel: 15,
      iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/electrowizard.png" }
    }
  ] as CRCard[],
  // All unlocked cards in player's inventory
  cards: [
    {
      name: "Knight",
      id: 26000000,
      level: 15,
      maxLevel: 15,
      evolutionLevel: 1, // Knight Evo unlocked
      iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/knight.png" }
    },
    {
      name: "Skeletons",
      id: 26000010,
      level: 15,
      maxLevel: 15,
      evolutionLevel: 1, // Skeletons Evo unlocked
      iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/skeletons.png" }
    },
    {
      name: "Little Prince",
      id: 26000093,
      level: 15,
      maxLevel: 15,
      iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/littleprince.png" }
    },
    {
      name: "Giant",
      id: 26000003,
      level: 15,
      maxLevel: 15,
      iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/giant.png" }
    },
    {
      name: "Goblins",
      id: 26000002,
      level: 15,
      maxLevel: 15,
      iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/goblins.png" }
    },
    {
      name: "Phoenix",
      id: 26000087,
      level: 15,
      maxLevel: 15,
      iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/phoenix.png" }
    },
    {
      name: "The Log",
      id: 28000011,
      level: 15,
      maxLevel: 15,
      iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/thelog.png" }
    },
    {
      name: "Void",
      id: 28000034,
      level: 15,
      maxLevel: 15,
      iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/void.png" }
    },
    {
      name: "Electro Wizard",
      id: 26000042,
      level: 15,
      maxLevel: 15,
      iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/electrowizard.png" }
    },
    {
      name: "Royal Giant",
      id: 26000024,
      level: 14,
      maxLevel: 15,
      evolutionLevel: 1, // RG Evo unlocked but card is Level 14
      iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/royalgiant.png" }
    },
    {
      name: "Archer Queen",
      id: 26000072,
      level: 13,
      maxLevel: 15,
      iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/archerqueen.png" }
    },
    {
      name: "Fireball",
      id: 28000000,
      level: 14,
      maxLevel: 15,
      iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/fireball.png" }
    },
    {
      name: "P.E.K.K.A",
      id: 26000004,
      level: 11,
      maxLevel: 15,
      iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/pekka.png" }
    },
    {
      name: "Hog Rider",
      id: 26000021,
      level: 12,
      maxLevel: 15,
      iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/hogrider.png" }
    },
    {
      name: "Zap",
      id: 28000008,
      level: 11,
      maxLevel: 15,
      evolutionLevel: 0, // Evo exists but player has not unlocked it
      iconUrls: { medium: "https://cdn.clashroyale.com/cards/300/zap.png" }
    }
  ] as CRCard[]
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tag: string }> }
) {
  try {
    const resolvedParams = await params;
    let tag = resolvedParams.tag;

    // Clean player tag (ensure upper case and format correctly)
    tag = tag.toUpperCase().replace(/[^A-Z0-9]/g, "");

    // Mock mode activation
    const apiKey = process.env.CLASH_ROYALE_API_KEY;
    if (!apiKey || apiKey.trim() === "" || tag === "MOCK") {
      console.log(`[API Proxy] Running in MOCK Mode for player tag #${tag}`);
      // Adjust tag in mock data to mirror queried tag
      const mockResponse = {
        ...MOCK_PLAYER_DATA,
        tag: `#${tag}`
      };
      
      // Artificial response delay (500ms) to simulate server loading state in UI
      await new Promise((resolve) => setTimeout(resolve, 500));
      return NextResponse.json(mockResponse);
    }

    // Build Clash Royale Official API url (Need to prefix with # URL encoded as %23)
    const formattedTag = `%23${tag}`;
    const url = `${APP_CONFIG.API.BASE_URL}/players/${formattedTag}`;

    console.log(`[API Proxy] Fetching from Clash Royale API: ${url}`);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      next: { revalidate: 300 } // Cache data for 5 minutes
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API Proxy] Clash Royale API error: ${response.status} - ${errorText}`);
      
      // If error is 404, player doesn't exist
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Oyuncu bulunamadı. Lütfen etiketinizin doğruluğunu kontrol edin." },
          { status: 404 }
        );
      }
      
      // Other errors, return internal server error
      return NextResponse.json(
        { error: `Clash Royale API hatası: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error(`[API Proxy] Error fetching player tag:`, error);
    return NextResponse.json(
      { error: "İstek işlenirken bir sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
