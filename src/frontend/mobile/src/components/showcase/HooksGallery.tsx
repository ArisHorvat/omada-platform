import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText, GlassView, CodeBlock, Icon, IconName, Divider } from '@/src/components/ui';
import { useThemeColors, useTranslation } from '@/src/hooks';

// 1. Data Structure: Grouping hooks by what they DO
const HOOK_CATEGORIES = [
  {
    title: 'Core Essentials',
    icon: 'layers' as IconName,
    description: 'Fundamental hooks used in almost every component.',
    hooks: [
      { name: 'useThemeColors', desc: 'Returns the active color palette (Light/Dark/Org).' },
      { name: 'useTranslation', desc: 'Provides t() function for multi-language support.' },
      { name: 'useNetworkStatus', desc: 'Tracks online/offline state & connection type.' },
      { name: 'useAppState', desc: 'Detects if app is in foreground or background.' },
    ]
  },
  {
    title: 'Device Hardware',
    icon: 'smartphone' as IconName,
    description: 'Bridges the gap between React Native and Native APIs.',
    hooks: [
      { name: 'useBiometrics', desc: 'Handles FaceID/TouchID authentication flows.' },
      { name: 'useHaptics', desc: 'Triggers vibration patterns (Success, Error, Impact).' },
      { name: 'useSensors', desc: 'Access to Gyroscope, Accelerometer, and Magnetometer.' },
      { name: 'useLocation', desc: 'One-shot or continuous GPS location tracking.' },
      { name: 'useScreenshotWarning', desc: 'Detects user screenshots for security events.' },
    ]
  },
  {
    title: 'UI Interaction',
    icon: 'touch-app' as IconName,
    description: 'Enhances user inputs and visual feedback.',
    hooks: [
      { name: 'useKeyboard', desc: 'Tracks keyboard height and dismissal events.' },
      { name: 'useSoundDesign', desc: 'Plays UI sound effects (clicks, success chimes).' },
      { name: 'useAppIcon', desc: 'Programmatically changes the app launcher icon.' },
      { name: 'useClipboard', desc: 'Reads/Writes text to the system clipboard.' },
    ]
  },
  {
    title: 'Logic & Utilities',
    icon: 'code' as IconName,
    description: 'Helpers for data management and timing.',
    hooks: [
      { name: 'useDebounce', desc: 'Delays function execution (perfect for Search inputs).' },
      { name: 'useSecureStorage', desc: 'Encrypted storage for Tokens and Secrets.' },
      { name: 'useInterval', desc: 'React-safe implementation of setInterval.' },
      { name: 'useTimeOfDay', desc: 'Returns greeting based on current hour (Morning/Eve).' },
    ]
  }
];

export const HooksGallery = () => {
  const colors = useThemeColors();
  const { t, locale } = useTranslation();

  return (
    <View style={{ paddingHorizontal: 20 }}>
      
      {/* 1. Live i18n Demo (Preserved & Styled) */}
      <View style={styles.section}>
        <AppText variant="h3" style={{ marginBottom: 12 }}>Active Locale</AppText>
        <GlassView intensity={20} style={styles.demoCard}>
          <View style={[styles.iconBox, { backgroundColor: colors.primary + '20' }]}>
            <Icon name="translate" size={24} color={colors.primary} />
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <AppText variant="caption" style={{ color: colors.subtle }}>Current Language</AppText>
            <AppText variant="h3">{locale.toUpperCase()}</AppText>
            <AppText variant="body" style={{ marginTop: 4 }}>
              Output: "<AppText weight="bold" style={{ color: colors.primary }}>{t('welcome') || 'Welcome'}</AppText>"
            </AppText>
          </View>
        </GlassView>
      </View>

      <Divider style={{ marginBottom: 24 }} />

      {/* 2. Categorized Registry */}
      {HOOK_CATEGORIES.map((category, index) => (
        <View key={index} style={styles.section}>
          
          {/* Category Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Icon name={category.icon} size={20} color={colors.primary} />
            <AppText variant="h3" style={{ marginLeft: 8 }}>{category.title}</AppText>
          </View>
          <AppText variant="body" style={{ color: colors.subtle, marginBottom: 16 }}>
            {category.description}
          </AppText>

          {/* Hooks List */}
          <View style={styles.cardContainer}>
            {category.hooks.map((hook, hIndex) => (
              <GlassView 
                key={hIndex} 
                intensity={10} 
                style={[styles.hookCard, { borderColor: colors.border }]}
              >
                <AppText variant="caption" weight="bold" style={{ fontFamily: 'monospace', color: colors.primary }}>
                  {hook.name}
                </AppText>
                <AppText variant="caption" style={{ color: colors.text, marginTop: 4 }}>
                  {hook.desc}
                </AppText>
              </GlassView>
            ))}
          </View>
        </View>
      ))}

      {/* 3. Usage Pattern */}
      <View style={styles.section}>
        <AppText variant="h3" style={{ marginBottom: 12 }}>Implementation Pattern</AppText>
        <AppText variant="body" style={{ color: colors.subtle, marginBottom: 12 }}>
          All hooks follow a consistent consumption pattern to ensure type safety and cleaner components.
        </AppText>
        <CodeBlock 
          language="typescript"
          code={`// 1. Import the hook from the central barrel file
          import { useBiometrics, useHaptics } from '@/src/hooks';

          export const SecurityGate = () => {
            // 2. Destructure the functionality you need
            const { authenticate } = useBiometrics();
            const { trigger } = useHaptics();

            const handlePress = async () => {
              const success = await authenticate();
              if (success) {
                trigger('success'); // Tactile feedback
              }
            };
          };`}
        />
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  section: { 
    marginBottom: 32 
  },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    gap: 8,
  },
  hookCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4, // Stylish accent on the left
  },
});