/**
 * Unlocking London — design tokens.
 * Warm editorial luxury: photography is the hero, UI gets out of the way.
 * Mr & Mrs Smith confidence + Onezone structure + Flighty craft.
 *
 * Single source of truth for colour, type, spacing, radii, motion.
 * Screens/components must consume these, never hardcode values.
 */

// --- Primitive palette (warm, mostly monochrome, one accent) ---
const palette = {
  // Warm bone / off-white paper + espresso darks
  bone: '#F6F1E9',
  boneDim: '#EDE6DA',
  paperCard: '#FFFFFF',
  ink: '#1B1714', // warm near-black text
  inkSoft: '#4A423B',
  inkMuted: '#8A7F73', // secondary text
  divider: '#E2D9CC',

  // Espresso dark-mode surfaces (never pure black)
  espresso: '#171310',
  espressoRaised: '#221D18',
  espressoCard: '#2A241E',
  boneOnDark: '#F2EBDF',
  boneMutedOnDark: '#A9A093',
  dividerDark: '#3A332B',

  // Accent — vivid rose-red (primary), deep brick, warm gold companion
  rose: '#CC454F', // primary accent
  roseHi: '#DB5A63', // lighter press/hover (light-mode accentHi), derived from rose
  roseDeep: '#8A2218', // deep brick — pressed / dark-mode accentHi
  gold: '#F3C779', // warm complementary highlight (available; wire when a slot needs it)
  // Alternative accent kept for editorial variety (forest green)
  forest: '#2F4A38',

  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ColorScheme = 'light' | 'dark';

export interface ThemeColors {
  paper: string; // base background
  paperRaised: string; // slightly raised surface
  card: string; // solid "paper" content surfaces
  ink: string; // primary text
  inkSoft: string;
  inkMuted: string; // secondary text / captions
  divider: string;
  accent: string;
  accentHi: string;
  onAccent: string;
  scrim: string; // gradient scrim over photos
  glassTint: string; // tint under Liquid Glass fallback
}

export const colors: Record<ColorScheme, ThemeColors> = {
  light: {
    paper: palette.bone,
    paperRaised: palette.boneDim,
    card: palette.paperCard,
    ink: palette.ink,
    inkSoft: palette.inkSoft,
    inkMuted: palette.inkMuted,
    divider: palette.divider,
    accent: palette.rose,
    accentHi: palette.roseHi,
    onAccent: palette.white,
    scrim: 'rgba(27,23,20,0.55)',
    glassTint: 'rgba(246,241,233,0.72)',
  },
  dark: {
    paper: palette.espresso,
    paperRaised: palette.espressoRaised,
    card: palette.espressoCard,
    ink: palette.boneOnDark,
    inkSoft: '#D8CFC1',
    inkMuted: palette.boneMutedOnDark,
    divider: palette.dividerDark,
    accent: palette.rose,
    accentHi: palette.roseDeep,
    onAccent: palette.white,
    scrim: 'rgba(0,0,0,0.55)',
    glassTint: 'rgba(23,19,16,0.72)',
  },
};

// --- Typography ---
// Display/editorial: high-contrast serif (Canela / Reckless / GT Sectra vibe).
// We ship a free stand-in (Playfair Display) loaded via expo-font; swap the
// files for the licensed face without touching call sites. UI/body: SF Pro (system).
export const fonts = {
  serif: 'EditorialSerif', // maps to loaded font family (see theme/fonts.ts)
  serifMedium: 'EditorialSerif-Medium',
  sans: 'System', // SF Pro on iOS
} as const;

// Type scale — large expressive serif vs small quiet sans.
export const type = {
  display: { fontFamily: fonts.serif, fontSize: 40, lineHeight: 44, letterSpacing: -0.5 },
  title: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 32, letterSpacing: -0.3 },
  headline: { fontFamily: fonts.serifMedium, fontSize: 22, lineHeight: 26 },
  pullQuote: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 32, letterSpacing: -0.2 },
  bodyLg: { fontFamily: fonts.sans, fontSize: 17, lineHeight: 26 },
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 16, fontWeight: '600' as const },
  caption: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 15, letterSpacing: 0.2 },
  overline: {
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
  },
} as const;

// --- Spacing (4pt base, generous margins) ---
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const screenMargin = space.xl; // 24pt editorial margin

// --- Radii (soft rounded corners ~16-20px) ---
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 } as const;

// --- Motion (physical, tactile — never jumpy) ---
export const motion = {
  fast: 180,
  base: 280,
  slow: 420,
  // spring for glass card rise / press feedback
  spring: { damping: 18, stiffness: 180, mass: 0.9 },
} as const;
