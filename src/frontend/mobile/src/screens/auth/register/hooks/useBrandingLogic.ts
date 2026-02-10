import { useState, useMemo } from 'react';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { ToolsService } from '@/src/services/ToolsService';
import { useRegistrationContext } from '../context/RegistrationContext';

// --- MATH HELPERS (Preserved) ---

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

// 1. RESTORED: Sorting Helper
const sortColors = (colors: string[]) => {
  if (colors.length <= 1) return colors;
  const [first, ...rest] = colors;
  // Keep the first (dominant) color first, sort the rest by Hue then Lightness
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

// --- THE HOOK ---

export const useBrandingLogic = () => {
  const { branding, setBranding, orgData, logo, setLogo } = useRegistrationContext();
  
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [selectedBaseColor, setSelectedBaseColor] = useState<string>(DEFAULT_BASE_COLORS[0]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [activeTab, setActiveTab] = useState<'colors' | 'palettes'>('colors');

  // 2. RESTORED: Memoized Sorted Colors
  const sortedExtractedColors = useMemo(() => sortColors(extractedColors), [extractedColors]);

  const generatedPalettes = useMemo(() => generatePalettes(selectedBaseColor), [selectedBaseColor]);

  const pickLogo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ 
        type: 'image/*',
        copyToCacheDirectory: true 
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        setLogo(asset); 
        
        setIsExtracting(true);
        
        try {
          // Call API
          const colors = await ToolsService.extractColors(asset.uri);
          
          if (colors && colors.length > 0) {
            setExtractedColors(colors);
            
            // Default to first color
            const newBase = colors[0];
            setSelectedBaseColor(newBase);
            
            // Auto-generate palette
            const firstPalette = generatePalettes(newBase)[0];
            setBranding({
               primary: firstPalette.primary, 
               secondary: firstPalette.secondary, 
               tertiary: firstPalette.tertiary 
            });
            
            Alert.alert("Colors Extracted", "We've found some colors from your logo. Palettes have been generated based on them.");
          }
        } catch (e) {
          console.log("Failed to extract colors via API", e);
          Alert.alert("Notice", "Could not extract colors automatically. Please choose a base color manually.");
        } finally {
          setIsExtracting(false);
        }
      }
    } catch (err) {
      console.log("Picker Error", err);
    }
  };

  const handlePaletteSelect = (p: Palette) => {
    setBranding({ primary: p.primary, secondary: p.secondary, tertiary: p.tertiary });
  };

  return {
    branding, 
    setBranding, 
    orgData, 
    logo, 
    
    extractedColors, 
    sortedExtractedColors, // 3. RESTORED: Returned here
    selectedBaseColor, 
    setSelectedBaseColor, 
    isExtracting, 
    activeTab, 
    setActiveTab, 
    
    generatedPalettes, 
    pickLogo, 
    handlePaletteSelect
  };
};