import { useMemo } from 'react';
import { useThemeColors } from '@/src/hooks';
import { BASE_WIDGETS, WidgetCategory } from '@/src/constants/widgets';

export const useDashboardConfig = () => {
  const colors = useThemeColors();

  return useMemo(() => {
    const getThemeForCategory = (cat: WidgetCategory) => {
      // IDENTITY + VISIBILITY LOGIC:
      // Backgrounds: Tone 90-95 (Light) or Tone 20-30 (Dark) -> *Container
      // Text: Tone 10-20 (Dark) or Tone 90 (Light) -> on*Container
      // Icon: Tone 40 (Dark) or Tone 80 (Light) -> * (Primary/Secondary/etc)
      
      switch (cat) {
        case 'Social': 
          return { 
            bg: colors.primaryContainer, 
            text: colors.onPrimaryContainer, 
            iconColor: colors.primary 
          };
        case 'Academics':
          return { 
            bg: colors.secondaryContainer, 
            text: colors.onSecondaryContainer, 
            iconColor: colors.secondary 
          };
        case 'Facilities':
        case 'Productivity':
          return { 
            bg: colors.tertiaryContainer, 
            text: colors.onTertiaryContainer, 
            iconColor: colors.tertiary 
          };
        default:
          return { 
            bg: colors.card, 
            text: colors.text, 
            iconColor: colors.subtle 
          };
      }
    };

    return Object.fromEntries(
      Object.entries(BASE_WIDGETS).map(([key, def]) => {
        const theme = getThemeForCategory(def.category);
        return [key, { ...def, ...theme }];
      })
    );
  }, [colors]);
};