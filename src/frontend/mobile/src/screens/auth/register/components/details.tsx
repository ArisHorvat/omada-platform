import React from 'react';
import { View, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/src/hooks';
import { useRegistrationLogic } from '@/src/screens/auth/register/hooks/useRegistrationLogic';
import { AppText, IconInput, GlassView, Icon } from '@/src/components/ui';
import { WizardLayout } from '@/src/components/layout';

export default function OrgDetailsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { orgData, setOrgData, setRoles } = useRegistrationLogic();

  const handleTypeSelect = (type: string) => {
    setOrgData({ ...orgData, type });
    // Pre-fill default roles
    if (type === 'university') {
        setRoles(['Student', 'Professor', 'Teaching Assistant', 'Dean', 'Registrar', 'Operations', 'Admin']);
    } else {
        setRoles(['Employee', 'Team Lead', 'Project Manager', 'Director', 'HR Manager', 'Operations', 'Admin']);
    }
  };

  const handleNext = () => {
    if (!orgData.name.trim() || !orgData.shortName.trim()) {
      Alert.alert('Missing Info', 'Please fill in all details.');
      return;
    }
    router.push('/register-flow/admin');
  };

  return (
    <WizardLayout 
        step={0} 
        totalSteps={6} 
        title="Organization" 
        subtitle="Tell us about your workspace"
        onBack={() => router.back()} 
        onNext={handleNext}
    >
        {/* Type Selection Grid */}
        <AppText variant="caption" style={{ marginBottom: 12, color: colors.subtle }}>INSTITUTION TYPE</AppText>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 32 }}>
            {['university', 'corporate'].map((type) => {
                const isActive = orgData.type === type;
                return (
                    <TouchableOpacity key={type} style={{ flex: 1 }} onPress={() => handleTypeSelect(type)}>
                        <GlassView 
                            intensity={isActive ? 40 : 10}
                            style={{ 
                                padding: 16, 
                                borderRadius: 16, 
                                alignItems: 'center',
                                borderWidth: 2,
                                borderColor: isActive ? colors.primary : 'transparent',
                                backgroundColor: isActive ? colors.primary + '15' : undefined
                            }}
                        >
                            <Icon 
                                name={type === 'university' ? 'school' : 'business'} 
                                size={32} 
                                color={isActive ? colors.primary : colors.subtle} 
                            />
                            <AppText weight="bold" style={{ marginTop: 8, textTransform: 'capitalize' }}>
                                {type}
                            </AppText>
                        </GlassView>
                    </TouchableOpacity>
                );
            })}
        </View>

        {/* Form */}
        <AppText variant="caption" style={{ marginBottom: 12, color: colors.subtle }}>BASIC INFO</AppText>
        
        <IconInput 
            icon="business"
            placeholder="Organization Name"
            value={orgData.name}
            onChangeText={(t) => setOrgData({...orgData, name: t})}
            style={{ marginBottom: 16 }}
        />
        
        <IconInput 
            icon="short-text"
            placeholder="Short Name (e.g. 'MIT')"
            value={orgData.shortName}
            onChangeText={(t) => setOrgData({...orgData, shortName: t})}
            maxLength={10}
        />

    </WizardLayout>
  );
}