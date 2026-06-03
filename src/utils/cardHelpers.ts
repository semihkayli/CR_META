/**
 * Clash Royale Card Helper utilities.
 */

export const getCardRarity = (card: { id: number; name: string }): "champion" | "legendary" | "epic" | "rare" | "common" => {
  const champions = ["Little Prince", "Archer Queen", "Golden Knight", "Skeleton King", "Monk"];
  if (champions.includes(card.name) || (card.id >= 26000090 && card.id <= 26000099)) {
    return "champion";
  }
  
  const legendaries = [
    "The Log", "Phoenix", "Electro Wizard", "Miner", "Princess", "Ice Wizard", "Lava Hound",
    "Graveyard", "Sparky", "Mega Knight", "Night Witch", "Bandit", "Royal Ghost",
    "Ram Rider", "Fisherman", "Magic Archer", "Mother Witch", "Super Mini P.E.K.K.A"
  ];
  if (legendaries.includes(card.name) || (card.id >= 26000030 && card.id <= 26000050) || card.id === 28000011 || card.id === 26000087) {
    return "legendary";
  }

  const epics = [
    "Witch", "P.E.K.K.A", "Prince", "Baby Dragon", "Balloon", "Giant Skeleton", "Goblin Barrel",
    "Lightning", "Rage", "Mirror", "Freeze", "Poison", "Bowler", "Executioner", "Cannon Cart",
    "Electro Giant", "Dark Prince", "Tornado", "Guard", "Hunter", "Wall Breakers"
  ];
  if (epics.includes(card.name) || (card.id >= 26000004 && card.id <= 26000015) || card.id === 28000007 || card.id === 28000002) {
    return "epic";
  }

  const rares = [
    "Giant", "Hog Rider", "Valkyrie", "Musketeer", "Mini P.E.K.K.A", "Wizard", "Fireball",
    "Mega Minion", "Dart Goblin", "Elixir Collector", "Battle Ram", "Three Musketeers",
    "Flying Machine", "Zappies", "Goblin Cage", "Battle Healer", "Elixir Golem"
  ];
  if (rares.includes(card.name) || (card.id >= 26000016 && card.id <= 26000029) || card.id === 28000000 || card.id === 28000001) {
    return "rare";
  }

  return "common";
};

export const getCardElixir = (id: number): number => {
  const elixirMap: Record<number, number> = {
    26000000: 3, // Knight
    26000001: 2, // Archers
    26000002: 2, // Goblins
    26000003: 5, // Giant
    26000004: 7, // PEKKA
    26000005: 3, // Minions
    26000006: 5, // Balloon
    26000010: 1, // Skeletons
    26000011: 3, // Goblin Gang
    26000015: 2, // Ice Golem
    26000016: 4, // Valkyrie
    26000021: 4, // Hog Rider
    26000024: 6, // Royal Giant
    26000027: 4, // Battle Ram
    26000030: 3, // Bandit
    26000032: 4, // Musketeer
    26000042: 4, // Electro Wizard
    26000072: 5, // Archer Queen
    26000087: 4, // Phoenix
    26000093: 3, // Little Prince
    28000000: 4, // Fireball
    28000008: 2, // Zap
    28000011: 2, // The Log
    28000012: 4, // Poison
    28000015: 3, // Cannon
    28000016: 1, // Ice Spirit
    28000034: 3, // Void
  };
  return elixirMap[id] || 3; // Default to 3 for unmapped cards
};

export const getAverageElixir = (cards: { id: number }[]): string => {
  if (!cards || cards.length === 0) return "0.0";
  const total = cards.reduce((sum, card) => sum + getCardElixir(card.id), 0);
  return (total / cards.length).toFixed(1);
};
