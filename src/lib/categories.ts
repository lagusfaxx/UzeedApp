/**
 * Maps backend category names to store-safe display names.
 * The backend may use terms that would cause App Store / Play Store rejection.
 * This mapping sanitizes them for display without changing backend data.
 */
const CATEGORY_MAP: Record<string, string> = {
  'Escorts': 'Acompañamiento',
  'escorts': 'Acompañamiento',
  'Escort': 'Acompañamiento',
  'escort': 'Acompañamiento',
  'Masajes eróticos': 'Masajes',
  'masajes eróticos': 'Masajes',
  'Masajes eroticos': 'Masajes',
  'Contenido adulto': 'Contenido premium',
  'contenido adulto': 'Contenido premium',
  'Adult content': 'Contenido premium',
  'Webcam': 'Videollamadas',
  'webcam': 'Videollamadas',
  'Striptease': 'Shows en vivo',
  'striptease': 'Shows en vivo',
};

export function safeCategory(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return CATEGORY_MAP[raw] ?? raw;
}
