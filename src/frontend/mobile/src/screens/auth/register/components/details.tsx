import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { WizardLayout } from '@/src/components/layout';
import { IconInput, SegmentedControl, AppText, ClayView } from '@/src/components/ui';
import { useRegistrationContext } from '../context/RegistrationContext';
import { useThemeColors } from '@/src/hooks';

// 1. Zod Schema
const detailsSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  shortName: z.string().min(2, "Short name is required").max(10, "Max 10 characters"),
});

type DetailsFormValues = z.infer<typeof detailsSchema>;

export default function OrganizationDetailsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { orgData, setOrgData, setOrganizationType } = useRegistrationContext();

  // 2. Setup React Hook Form
  const { control, handleSubmit, formState: { errors } } = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsSchema),
    // Populate default values from context in case they click "Back" from the next step!
    defaultValues: {
      name: orgData.name,
      shortName: orgData.shortName,
    }
  });

  const handleTypeChange = (index: number) => {
    setOrganizationType(index === 0 ? 'corporate' : 'university');
  };

  // 3. Submit Handler (Only runs if valid)
  const onSubmit = (data: DetailsFormValues) => {
    // Save to global context
    setOrgData({ ...orgData, name: data.name, shortName: data.shortName });
    // Navigate to next step
    router.push('/(auth)/register-flow/admin');
  };

  return (
    <WizardLayout 
        step={0} totalSteps={6} title="Organization Details" 
        subtitle="Tell us about your organization to get started."
        onBack={() => router.back()} 
        // Pass handleSubmit directly to the Wizard's onNext button!
        onNext={handleSubmit(onSubmit)} 
    >
        <View style={{ gap: 24 }}>
             <ClayView style={{ padding: 20, borderRadius: 24, backgroundColor: colors.card }}>
                <AppText variant="caption" style={{ marginBottom: 12, color: colors.subtle }}>ORGANIZATION TYPE</AppText>
                <SegmentedControl 
                    options={['Corporate', 'University']} 
                    selectedIndex={orgData.type === 'university' ? 1 : 0}
                    onChange={handleTypeChange}
                />
             </ClayView>

            <View style={{ gap: 16 }}>
                {/* Organization Name */}
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View>
                      <IconInput 
                          icon="business" 
                          placeholder="Organization Name"
                          value={value} 
                          onBlur={onBlur}
                          onChangeText={onChange}
                          style={errors.name ? { borderColor: colors.error, borderWidth: 1 } : {}}
                      />
                      {errors.name && <Text style={{ color: colors.error, fontSize: 12, marginTop: 4, marginLeft: 12 }}>{errors.name.message}</Text>}
                    </View>
                  )}
                />

                {/* Short Name */}
                <Controller
                  control={control}
                  name="shortName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View>
                      <IconInput 
                          icon="short-text" 
                          placeholder="Short Name (e.g. UBB)"
                          value={value} 
                          onBlur={onBlur}
                          onChangeText={onChange}
                          maxLength={10} 
                          autoCapitalize="characters"
                          style={errors.shortName ? { borderColor: colors.error, borderWidth: 1 } : {}}
                      />
                      {errors.shortName && <Text style={{ color: colors.error, fontSize: 12, marginTop: 4, marginLeft: 12 }}>{errors.shortName.message}</Text>}
                    </View>
                  )}
                />
            </View>
        </View>
    </WizardLayout>
  );
}