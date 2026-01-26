import React, { useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/src/hooks/use-theme-color';
import { FormInput } from '@/src/components/FormInput';
import { WizardLayout } from '@/src/components/WizardLayout';
import { createStyles } from '@/src/screens/auth/register/styles/admin.styles';
import { useAdminDetailsLogic } from '../hooks/useAdminDetailsLogic';

export default function AdminDetailsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { adminData, setAdminData, handleNext } = useAdminDetailsLogic();

  return (
    <WizardLayout step={2} totalSteps={6} title="Admin Account" onBack={() => router.back()} onNext={handleNext}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.formSection}>
          <FormInput 
              label="First Name" placeholder="John" 
              value={adminData.firstName} onChangeText={(t) => setAdminData({...adminData, firstName: t})} 
              styles={styles} placeholderTextColor={colors.subtle} 
          />
          <FormInput 
              label="Last Name" placeholder="Doe" 
              value={adminData.lastName} onChangeText={(t) => setAdminData({...adminData, lastName: t})} 
              styles={styles} placeholderTextColor={colors.subtle} 
          />
          <FormInput 
              label="Admin Email" placeholder="admin@hogwarts.edu" 
              value={adminData.email} onChangeText={(t) => setAdminData({...adminData, email: t})} 
              styles={styles} placeholderTextColor={colors.subtle} autoCapitalize="none"
          />
          <FormInput 
              label="Password" placeholder="******" 
              value={adminData.password} onChangeText={(t) => setAdminData({...adminData, password: t})} 
              secureTextEntry styles={styles} placeholderTextColor={colors.subtle} 
          />
          <FormInput 
              label="Repeat Password" placeholder="******" 
              value={adminData.repeatPassword} onChangeText={(t) => setAdminData({...adminData, repeatPassword: t})} 
              secureTextEntry styles={styles} placeholderTextColor={colors.subtle} 
          />
        </View>
      </ScrollView>
    </WizardLayout>
  );
}
