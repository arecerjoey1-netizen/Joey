/**
 * WhatsApp-style Custom Chat Wallpaper Presets
 * Includes rich colors, gradients, and subtle dark tones
 */

export interface WallpaperPreset {
  id: string;
  name: string;
  category: 'gradients' | 'dark' | 'light';
  backgroundCss: string;
  isLight?: boolean;
}

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  {
    id: 'default-doodle',
    name: 'WhatsApp Charcoal Doodle',
    category: 'dark',
    backgroundCss: '#0b141a',
  },
  {
    id: 'emerald-gradient',
    name: 'Emerald Forest',
    category: 'gradients',
    backgroundCss: 'radial-gradient(circle at top, #004d40 0%, #08211b 50%, #061410 100%)',
  },
  {
    id: 'midnight-navy',
    name: 'Midnight Navy',
    category: 'gradients',
    backgroundCss: 'linear-gradient(180deg, #0d1b2a 0%, #1b263b 60%, #0a1118 100%)',
  },
  {
    id: 'cyber-sunset',
    name: 'Cyber Violet',
    category: 'gradients',
    backgroundCss: 'linear-gradient(160deg, #2e0854 0%, #190933 60%, #0b141a 100%)',
  },
  {
    id: 'oceanic-teal',
    name: 'Oceanic Teal',
    category: 'gradients',
    backgroundCss: 'radial-gradient(ellipse at center, #00363a 0%, #001f22 65%, #081216 100%)',
  },
  {
    id: 'warm-ember',
    name: 'Warm Ember',
    category: 'gradients',
    backgroundCss: 'linear-gradient(160deg, #3d1414 0%, #200b0b 60%, #0b141a 100%)',
  },
  {
    id: 'obsidian-amoled',
    name: 'AMOLED Pure Black',
    category: 'dark',
    backgroundCss: '#000000',
  },
  {
    id: 'nordic-sage',
    name: 'Nordic Dark Sage',
    category: 'dark',
    backgroundCss: 'linear-gradient(180deg, #18281f 0%, #0e1712 100%)',
  },
  {
    id: 'espresso-mocha',
    name: 'Espresso Velvet',
    category: 'dark',
    backgroundCss: 'linear-gradient(180deg, #2c1b14 0%, #120b08 100%)',
  },
  {
    id: 'carbon-slate',
    name: 'Carbon Slate',
    category: 'dark',
    backgroundCss: 'linear-gradient(180deg, #1e252b 0%, #101518 100%)',
  },
  {
    id: 'light-parchment',
    name: 'Classic Light Parchment',
    category: 'light',
    backgroundCss: '#efeae2',
    isLight: true,
  },
  {
    id: 'pastel-azure',
    name: 'Pastel Azure Breeze',
    category: 'light',
    backgroundCss: 'linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 100%)',
    isLight: true,
  },
  {
    id: 'soft-lavender',
    name: 'Soft Lavender Mist',
    category: 'light',
    backgroundCss: 'linear-gradient(135deg, #ede9fe 0%, #fae8ff 100%)',
    isLight: true,
  },
];
