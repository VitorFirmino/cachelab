export const CATEGORY_ICONS: Record<string, string> = {
  "Eletrônicos": "⚡",
  "Computadores": "💻",
  "Periféricos": "🖱️",
  "Áudio": "🎧",
  "Gaming": "🎮",
  "Casa Inteligente": "🏠",
};

export const CATEGORY_ICON_FALLBACK = "📦";

export function getCategoryIcon(name: string | undefined | null): string {
  return CATEGORY_ICONS[name ?? ""] ?? CATEGORY_ICON_FALLBACK;
}
