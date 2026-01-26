import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/src/hooks/use-theme-color';
import { ThemeMode } from '@/src/context/UserPreferencesContext';
import { createStyles } from '@/src/screens/widgets/settings/styles/settings.styles';
import { useSettingsLogic } from '@/src/screens/widgets/settings/hooks/useSettingsLogic';

export default function SettingsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { themeMode, organization, handleThemeChange } = useSettingsLogic();
  const getThemeLabel = (mode: ThemeMode) => 
    mode === 'system' ? 'System Default' : mode.charAt(0).toUpperCase() + mode.slice(1);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
            <View style={styles.section}>
            <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/security')}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="security" size={24} color={colors.text} />
                <Text style={styles.settingText}>Security</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.subtle} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Notifications', 'Settings coming soon.')}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="notifications" size={24} color={colors.text} />
                <Text style={styles.settingText}>Notifications</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.subtle} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={handleThemeChange}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="brightness-6" size={24} color={colors.text} />
                <Text style={styles.settingText}>Theme</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.valueText}>{getThemeLabel(themeMode)}</Text>
                <MaterialIcons name="chevron-right" size={24} color={colors.subtle} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('My Activity', 'Login history, recent actions.')}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="history" size={24} color={colors.text} />
                <Text style={styles.settingText}>My Activity</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.subtle} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Organization Info', organization ? `Connected to ${organization.name}` : 'Loading...')}>
              <View style={styles.settingLeft}>
                <MaterialIcons name="business" size={24} color={colors.text} />
                <Text style={styles.settingText}>My Organization</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={colors.subtle} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}