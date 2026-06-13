import { useState, useMemo } from 'react';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { ToolsService } from '@/src/services/ToolsService';
import {
  BrandingPalette,
  DEFAULT_BASE_COLORS,
  generatePalettes,
  normalizeHexColor,
  sortExtractedColors,
} from '@/src/utils/brandingPalettes';
import { useRegistrationContext } from '../context/RegistrationContext';

export type { BrandingPalette };

export const useBrandingLogic = () => {
  const { branding, setBranding, orgData, logo, setLogo } = useRegistrationContext();

  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [selectedBaseColor, setSelectedBaseColor] = useState<string>(DEFAULT_BASE_COLORS[0]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [activeTab, setActiveTab] = useState<'colors' | 'palettes'>('colors');

  const sortedExtractedColors = useMemo(
    () => sortExtractedColors(extractedColors),
    [extractedColors],
  );
  const generatedPalettes = useMemo(() => generatePalettes(selectedBaseColor), [selectedBaseColor]);

  const pickLogo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        setLogo(asset);

        setIsExtracting(true);

        try {
          const colors = await ToolsService.extractColors(asset.uri, {
            mimeType: asset.mimeType ?? undefined,
            fileName: asset.name ?? undefined,
          });

          if (colors && colors.length > 0) {
            const sorted = sortExtractedColors(colors);
            const dominant = normalizeHexColor(colors[0]) ?? sorted[0];
            setExtractedColors(sorted);

            setSelectedBaseColor(dominant);

            const firstPalette = generatePalettes(dominant)[0];
            setBranding({
              primary: firstPalette.primary,
              secondary: firstPalette.secondary,
              tertiary: firstPalette.tertiary,
            });

            Alert.alert(
              'Colors Extracted',
              "We've found some colors from your logo. Palettes have been generated based on them."
            );
          }
        } catch (e) {
          console.log('Failed to extract colors via API', e);
          Alert.alert('Notice', 'Could not extract colors automatically. Please choose a base color manually.');
        } finally {
          setIsExtracting(false);
        }
      }
    } catch (err) {
      console.log('Picker Error', err);
    }
  };

  const handlePaletteSelect = (p: BrandingPalette) => {
    setBranding({ primary: p.primary, secondary: p.secondary, tertiary: p.tertiary });
  };

  return {
    branding,
    setBranding,
    orgData,
    logo,
    extractedColors,
    sortedExtractedColors,
    selectedBaseColor,
    setSelectedBaseColor,
    isExtracting,
    activeTab,
    setActiveTab,
    generatedPalettes,
    pickLogo,
    handlePaletteSelect,
  };
};
