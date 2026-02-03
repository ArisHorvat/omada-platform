import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Switch, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/hooks';
import { createStyles } from '@/src/screens/widgets/security/styles/security.styles';
import { useSecurityLogic } from '@/src/screens/widgets/security/hooks/useSecurityLogic';

export default function SecurityScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { currentPassword, setCurrentPassword, newPassword, setNewPassword, confirmPassword, setConfirmPassword, is2FAEnabled, isLoading, isBiometricEnabled, toggleBiometric, handleChangePassword, handleToggle2FA } = useSecurityLogic();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security</Text>
      </View>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Change Password</Text>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Current Password</Text>
                    <TextInput 
                        style={styles.input} 
                        secureTextEntry 
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        placeholderTextColor={colors.subtle}
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>New Password</Text>
                    <TextInput 
                        style={styles.input} 
                        secureTextEntry 
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholderTextColor={colors.subtle}
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Confirm New Password</Text>
                    <TextInput 
                        style={styles.input} 
                        secureTextEntry 
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholderTextColor={colors.subtle}
                    />
                </View>
                <TouchableOpacity style={[styles.button, isLoading && { opacity: 0.7 }]} onPress={handleChangePassword} disabled={isLoading}>
                    <Text style={styles.buttonText}>{isLoading ? 'Updating...' : 'Update Password'}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Authentication</Text>
                <View style={styles.row}>
                    <Text style={styles.rowText}>Biometric Login (FaceID/TouchID)</Text>
                    <Switch 
                        value={isBiometricEnabled} 
                        onValueChange={toggleBiometric}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor={colors.card}
                    />
                </View>
                <View style={[styles.row, { borderBottomWidth: 0 }]}>
                    <Text style={styles.rowText}>Two-Factor Authentication</Text>
                    <Switch 
                        value={is2FAEnabled} 
                        onValueChange={handleToggle2FA}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor={colors.card}
                    />
                </View>
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
