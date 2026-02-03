import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { WizardLayout } from '@/src/components/layout';
import { IconInput } from '@/src/components/ui';
import { useAdminDetailsLogic } from '../hooks/useAdminDetailsLogic';

export default function AdminDetailsScreen() {
  const router = useRouter();
  const { adminData, setAdminData, handleNext } = useAdminDetailsLogic();
  const [showPass, setShowPass] = useState(false);

  return (
    <WizardLayout 
        step={1} 
        totalSteps={6} 
        title="Admin Account"
        subtitle="Create your superuser credentials"
        onBack={() => router.back()} 
        onNext={handleNext}
    >
        <View style={{ gap: 16 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                    <IconInput 
                        icon="person"
                        placeholder="First Name"
                        value={adminData.firstName}
                        onChangeText={(t) => setAdminData({...adminData, firstName: t})}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <IconInput 
                        placeholder="Last Name"
                        value={adminData.lastName}
                        onChangeText={(t) => setAdminData({...adminData, lastName: t})}
                    />
                </View>
            </View>

            <IconInput 
                icon="mail"
                placeholder="Admin Email"
                value={adminData.email}
                onChangeText={(t) => setAdminData({...adminData, email: t})}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <IconInput 
                icon="lock"
                rightIcon={showPass ? 'visibility' : 'visibility-off'}
                onRightIconPress={() => setShowPass(!showPass)}
                placeholder="Password"
                value={adminData.password}
                onChangeText={(t) => setAdminData({...adminData, password: t})}
                secureTextEntry={!showPass}
            />

            <IconInput 
                icon="lock-clock"
                placeholder="Confirm Password"
                value={adminData.repeatPassword}
                onChangeText={(t) => setAdminData({...adminData, repeatPassword: t})}
                secureTextEntry={!showPass}
            />
        </View>
    </WizardLayout>
  );
}