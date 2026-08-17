// Standard Pokémon type colors, used for the move-card corner tab.
export const TYPE_COLORS: Record<string, string> = {
  normal: "#A8A878",
  fire: "#F08030",
  water: "#6890F0",
  electric: "#F8D030",
  grass: "#78C850",
  ice: "#98D8D8",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#B8A038",
  ghost: "#705898",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B8B8D0",
  fairy: "#EE99AC",
};

export function typeColor(type: string): string {
  return TYPE_COLORS[type.toLowerCase()] ?? "#6b7299";
}

// Green (120) at full HP, sliding down through yellow to red (0) as it drops.
export function hpColor(current: number, max: number): string {
  const pct = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
  const hue = Math.round(pct * 120);
  return `hsl(${hue}, 80%, 45%)`;
}
