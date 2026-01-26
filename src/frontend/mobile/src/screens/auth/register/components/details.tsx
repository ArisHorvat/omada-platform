import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/src/hooks/use-theme-color';
import { useRegistrationLogic } from '@/src/screens/auth/register/hooks/useRegistrationLogic';
import { FormInput } from '@/src/components/FormInput';
import { WizardLayout } from '@/src/components/WizardLayout';
import { MaterialIcons } from '@expo/vector-icons';
import { createStyles } from '@/src/screens/auth/register/styles/details.styles';

export default function OrgDetailsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { orgData, setOrgData, setRoles } = useRegistrationLogic();

  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleTypeSelect = (type: string) => {
    setOrgData({ ...orgData, type });
    if (type === 'university') {
        setRoles(['Student', 'Professor', 'Teaching Assistant', 'Dean', 'Registrar', 'Operations', 'Admin']);
    } else {
        setRoles(['Employee', 'Team Lead', 'Project Manager', 'Director', 'HR Manager', 'Operations', 'Admin']);
    }
  };

  const handleNext = () => {
    if (!orgData.name.trim() || !orgData.shortName.trim()) {
      Alert.alert('Validation Error', 'Please fill all organization details.');
      return;
    }
    router.push('/register-flow/admin');
  };

  return (
    <WizardLayout step={1} totalSteps={6} title="Identity" onBack={() => router.back()} onNext={handleNext}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionHeader}>Organization Type</Text>
        <View style={styles.typeGrid}>
          <TouchableOpacity 
            style={[styles.typeCard, orgData.type === 'university' && styles.typeCardActive]} 
            onPress={() => handleTypeSelect('university')}
          >
            <MaterialIcons name="school" size={32} color={orgData.type === 'university' ? colors.primary : colors.subtle} style={styles.typeIcon} />
            <Text style={[styles.typeTitle, orgData.type === 'university' && { color: colors.primary }]}>University</Text>
            <Text style={styles.typeSubtitle}>Faculty, Students, Campus</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.typeCard, orgData.type === 'corporate' && styles.typeCardActive]} 
            onPress={() => handleTypeSelect('corporate')}
          >
            <MaterialIcons name="business" size={32} color={orgData.type === 'corporate' ? colors.primary : colors.subtle} style={styles.typeIcon} />
            <Text style={[styles.typeTitle, orgData.type === 'corporate' && { color: colors.primary }]}>Corporate</Text>
            <Text style={styles.typeSubtitle}>Teams, Employees, Offices</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeader}>Basic Details</Text>
        <View style={styles.formSection}>
          <FormInput 
              label="Organization Name" placeholder="e.g. Hogwarts University" 
              value={orgData.name} onChangeText={(t) => setOrgData({...orgData, name: t})} 
              styles={styles} placeholderTextColor={colors.subtle} 
          />
          <FormInput 
              label="Short Name (Abbreviation)" placeholder="e.g. HU" 
              value={orgData.shortName} onChangeText={(t) => setOrgData({...orgData, shortName: t})} 
              styles={styles} placeholderTextColor={colors.subtle} 
          />
        </View>
      </ScrollView>
    </WizardLayout>
  );
}
