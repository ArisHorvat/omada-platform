export interface BrandingPalette {
  name: string;
  primary: string;
  secondary: string;
  tertiary: string;
}

export const DEFAULT_BASE_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#eab308', '#8b5cf6', '#ec4899'];

export const getContrastTextColor = (hex: string) => {
  if (!hex) return '#000';
  const r = parseInt(hex.substr(1, 2), 16);
  const g = parseInt(hex.substr(3, 2), 16);
  const b = parseInt(hex.substr(5, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 >= 128 ? '#000000' : '#FFFFFF';
};

const hexToHsl = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s;
  const l = (max + min) / 2;
  if (max === min) {
    h = 0;
    s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
};

const hslToHex = (h: number, s: number, l: number) => {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

export function normalizeHexColor(hex: string): string | null {
  const trimmed = hex.trim();
  const short = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(trimmed);
  if (short) {
    return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toLowerCase();
  }
  const full = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(trimmed);
  if (!full) return null;
  return `#${full[1]}${full[2]}${full[3]}`.toLowerCase();
}

/** Rainbow order (hue → saturation → lightness) for logo-extracted swatches. */
export function sortExtractedColors(colors: string[]): string[] {
  const unique = [
    ...new Set(colors.map(normalizeHexColor).filter((c): c is string => c != null)),
  ];
  if (unique.length <= 1) return unique;

  return unique.sort((a, b) => {
    const hslA = hexToHsl(a);
    const hslB = hexToHsl(b);
    if (Math.abs(hslA.h - hslB.h) > 5) return hslA.h - hslB.h;
    if (Math.abs(hslA.s - hslB.s) > 4) return hslB.s - hslA.s;
    return hslA.l - hslB.l;
  });
}

/** @deprecated Prefer sortExtractedColors */
export const sortColors = sortExtractedColors;

export const generatePalettes = (baseColor: string): BrandingPalette[] => {
  const { h, s, l } = hexToHsl(baseColor);
  return [
    {
      name: 'Generic Gradient',
      primary: baseColor,
      secondary: hslToHex(h, s, Math.max(10, l - 20)),
      tertiary: hslToHex(h, s, Math.min(90, l + 30)),
    },
    {
      name: 'Matching Gradient',
      primary: baseColor,
      secondary: hslToHex((h + 20) % 360, s, l),
      tertiary: hslToHex((h - 20 + 360) % 360, s, l),
    },
    {
      name: 'Spot Palette',
      primary: baseColor,
      secondary: hslToHex(h, Math.max(0, s - 30), 90),
      tertiary: hslToHex((h + 180) % 360, s, l),
    },
    {
      name: 'Twisted Spot',
      primary: baseColor,
      secondary: hslToHex((h + 150) % 360, s, l),
      tertiary: hslToHex((h + 210) % 360, s, l),
    },
    { name: 'Classy Palette', primary: baseColor, secondary: '#1e293b', tertiary: '#cbd5e1' },
    {
      name: 'Cube Palette',
      primary: baseColor,
      secondary: hslToHex((h + 90) % 360, s, l),
      tertiary: hslToHex((h + 180) % 360, s, l),
    },
    { name: 'Switch Palette', primary: baseColor, secondary: '#ffffff', tertiary: '#000000' },
    {
      name: 'Natural Palette',
      primary: baseColor,
      secondary: hslToHex(h, 20, 90),
      tertiary: hslToHex((h + 30) % 360, 40, 40),
    },
  ];
};
