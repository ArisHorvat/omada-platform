import { useState, useMemo } from 'react';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRegistration } from '@/src/screens/auth/register/context/RegistrationContext';
import { API_BASE_URL } from '@/src/config/config';
import { ToolsService } from '@/src/services/ToolsService';

// Color Utils
const hexToHsl = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; case b: h = (r - g) / d + 4; break; }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
};

const hslToHex = (h: number, s: number, l: number) => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const getLuminance = (hex: string) => {
  const c = hex.replace('#', '');
  const rgb = parseInt(c.length === 3 ? c.split('').map(x => x + x).join('') : c, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >>  8) & 0xff;
  const b = (rgb >>  0) & 0xff;
  const [lr, lg, lb] = [r, g, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
};

export const getContrastColor = (hex: string) => getLuminance(hex) > 0.5 ? '#000000' : '#ffffff';

const sortColors = (colors: string[]) => {
  if (colors.length <= 1) return colors;
  const [first, ...rest] = colors;
  return [first, ...rest.sort((a, b) => {
    const hslA = hexToHsl(a);
    const hslB = hexToHsl(b);
    if (Math.abs(hslA.h - hslB.h) > 5) return hslA.h - hslB.h;
    return hslA.l - hslB.l;
  })];
};

export interface Palette { name: string; primary: string; secondary: string; tertiary: string; }

const generatePalettes = (baseColor: string): Palette[] => {
  const { h, s, l } = hexToHsl(baseColor);
  return [
    { name: 'Generic Gradient', primary: baseColor, secondary: hslToHex(h, s, Math.max(10, l - 20)), tertiary: hslToHex(h, s, Math.min(90, l + 30)) },
    { name: 'Matching Gradient', primary: baseColor, secondary: hslToHex((h + 20) % 360, s, l), tertiary: hslToHex((h - 20 + 360) % 360, s, l) },
    { name: 'Spot Palette', primary: baseColor, secondary: hslToHex(h, Math.max(0, s - 30), 90), tertiary: hslToHex((h + 180) % 360, s, l) },
    { name: 'Twisted Spot', primary: baseColor, secondary: hslToHex((h + 150) % 360, s, l), tertiary: hslToHex((h + 210) % 360, s, l) },
    { name: 'Classy Palette', primary: baseColor, secondary: '#1e293b', tertiary: '#cbd5e1' },
    { name: 'Cube Palette', primary: baseColor, secondary: hslToHex((h + 90) % 360, s, l), tertiary: hslToHex((h + 180) % 360, s, l) },
    { name: 'Switch Palette', primary: baseColor, secondary: '#ffffff', tertiary: '#000000' },
    { name: 'Natural Palette', primary: baseColor, secondary: hslToHex(h, 20, 90), tertiary: hslToHex((h + 30) % 360, 40, 40) }
  ];
};

export const DEFAULT_BASE_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#eab308', '#8b5cf6', '#ec4899'];

export const useBrandingLogic = () => {
  const { branding, setBranding, orgData, logo, setLogo } = useRegistration();
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [selectedBaseColor, setSelectedBaseColor] = useState<string>(DEFAULT_BASE_COLORS[0]);
  const sortedExtractedColors = useMemo(() => sortColors(extractedColors), [extractedColors]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [activeTab, setActiveTab] = useState<'colors' | 'palettes'>('colors');

  const generatedPalettes = useMemo(() => generatePalettes(selectedBaseColor), [selectedBaseColor]);

  const pickLogo = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'image/*' });
    if (!result.canceled) {
      const asset = result.assets[0];
      setLogo(asset);
      setIsExtracting(true);
      try {

        const extracted = await ToolsService.extractColors(asset.uri);
        setExtractedColors(extracted);
        if (extracted.length > 0) {
          setSelectedBaseColor(extracted[0]);
          const firstPalette = generatePalettes(extracted[0])[0];
          setBranding({ primary: firstPalette.primary, secondary: firstPalette.secondary, tertiary: firstPalette.tertiary } );
        }
        Alert.alert("Colors Extracted", "We've found some colors from your logo. Choose one to generate palettes.");
      }
      catch (e) { console.log("Failed to extract colors via API", e); } finally { setIsExtracting(false); }
    }
  };

  const handlePaletteSelect = (p: Palette) => {
    setBranding({ primary: p.primary, secondary: p.secondary, tertiary: p.tertiary });
  };

  return {
    branding, setBranding, orgData, logo, pickLogo, extractedColors, sortedExtractedColors, selectedBaseColor, setSelectedBaseColor, isExtracting, activeTab, setActiveTab, generatedPalettes, handlePaletteSelect
  };
};