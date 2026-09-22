import { ThemePalette } from '../types';

export interface PaletteDefinition {
  id: ThemePalette;
  name: string;
  nameSi: string;
  description: string;
  colors: {
    bg: string;
    cardBg: string;
    headerBg: string;
    textPrimary: string;
    textSecondary: string;
    accent: string; // Red or Green or Emerald
    secondaryAccent: string; // Yellow
    border: string;
    hash: string; // Charcoal / Hash
    badgeBg: string;
    buttonText: string;
  };
  sampleHex: {
    base: string;
    primary: string;
    accent: string;
    yellow: string;
    hash: string;
  };
}

export const THEME_PALETTES: Record<ThemePalette, PaletteDefinition> = {
  // Palette 1: Clean White, Rose Crimson, Yellow, Soft Slate
  PALETTE_1: {
    id: 'PALETTE_1',
    name: 'Crimson Rose Light (Palette 1)',
    nameSi: 'සුදු, රෝස රතු, කහ සහ මෘදු හැෂ්',
    description: 'White, Crimson Rose, Yellow, Soft Slate - Clean daylight dining vibe',
    colors: {
      bg: 'bg-transparent',
      cardBg: 'bg-white/95 backdrop-blur-sm',
      headerBg: 'bg-white/95',
      textPrimary: 'text-slate-900',
      textSecondary: 'text-slate-600',
      accent: 'bg-pink-600 hover:bg-pink-500 text-white',
      secondaryAccent: 'text-amber-600 border-amber-300 bg-amber-50',
      border: 'border-sky-100',
      hash: 'bg-slate-100 text-slate-700',
      badgeBg: 'bg-pink-50 text-pink-700 border-pink-200',
      buttonText: 'text-white',
    },
    sampleHex: {
      base: '#ffffff',
      primary: '#0f172a',
      accent: '#e11d48', // Rose
      yellow: '#f59e0b', // Yellow
      hash: '#64748b', // Slate
    },
  },

  // Palette 2: White, Green, Yellow, Black, Hash
  PALETTE_2: {
    id: 'PALETTE_2',
    name: 'Fresh Lime Orchard (Palette 2)',
    nameSi: 'සුදු, කොළ, කහ, කළු සහ හැෂ්',
    description: 'White, Green, Yellow, Black, Hash - Clean organic daylight bistro aesthetic',
    colors: {
      bg: 'bg-slate-50',
      cardBg: 'bg-white',
      headerBg: 'bg-white/95',
      textPrimary: 'text-slate-950',
      textSecondary: 'text-slate-600',
      accent: 'bg-green-600 hover:bg-green-500 text-white',
      secondaryAccent: 'text-amber-500 border-amber-400 bg-amber-50',
      border: 'border-slate-200',
      hash: 'bg-slate-800 text-white',
      badgeBg: 'bg-green-100 text-green-800 border-green-300',
      buttonText: 'text-white',
    },
    sampleHex: {
      base: '#ffffff',
      primary: '#0f172a',
      accent: '#16a34a', // Green
      yellow: '#eab308', // Yellow
      hash: '#334155', // Hash
    },
  },

  // Palette 3: White, Emerald Green, Yellow, Hash
  PALETTE_3: {
    id: 'PALETTE_3',
    name: 'Emerald Royale (Palette 3)',
    nameSi: 'සුදු, එමරල්ඩ් කොළ, කහ සහ හැෂ්',
    description: 'White, Emerald Green, Yellow, Hash - Vibrant luxury tropical hospitality aesthetic',
    colors: {
      bg: 'bg-[#fafafa]',
      cardBg: 'bg-white',
      headerBg: 'bg-white/95',
      textPrimary: 'text-neutral-900',
      textSecondary: 'text-neutral-600',
      accent: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      secondaryAccent: 'text-yellow-600 border-yellow-300 bg-yellow-50',
      border: 'border-emerald-100/80',
      hash: 'bg-neutral-800 text-neutral-100',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      buttonText: 'text-white',
    },
    sampleHex: {
      base: '#fafafa',
      primary: '#171717',
      accent: '#059669', // Emerald Green
      yellow: '#ca8a04', // Yellow
      hash: '#262626', // Hash
    },
  },
};
