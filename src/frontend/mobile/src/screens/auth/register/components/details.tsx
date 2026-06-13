import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { WizardLayout } from '@/src/components/layout';
import { IconInput } from '@/src/components/ui';
import { OrganizationTypePicker } from '@/src/components/organization/OrganizationTypePicker';
import { useRegistrationContext } from '../context/RegistrationContext';
import { useThemeColors } from '@/src/hooks';

const detailsSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  shortName: z.string().min(2, 'Short name is required').max(10, 'Max 10 characters'),
});

type DetailsFormValues = z.infer<typeof detailsSchema>;

export default function OrganizationDetailsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { orgData, setOrgData, setOrganizationType } = useRegistrationContext();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      name: orgData.name,
      shortName: orgData.shortName,
    },
  });

  const onSubmit = (data: DetailsFormValues) => {
    setOrgData({ ...orgData, name: data.name, shortName: data.shortName });
    router.push('/(auth)/register-flow/admin');
  };

  return (
    <WizardLayout
      step={0}
      totalSteps={3}
      title="Your organization"
      subtitle="Choose your organization type and enter its name."
      onBack={() => router.back()}
      onNext={handleSubmit(onSubmit)}
    >
      <View style={{ gap: 24 }}>
        <OrganizationTypePicker
          value={orgData.type === 'university' ? 'university' : 'corporate'}
          onChange={setOrganizationType}
        />

        <View style={{ gap: 16 }}>
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
                  error={!!errors.name}
                />
                {errors.name && (
                  <Text style={{ color: colors.error, fontSize: 12, marginTop: 4, marginLeft: 12 }}>
                    {errors.name.message}
                  </Text>
                )}
              </View>
            )}
          />

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
                  error={!!errors.shortName}
                />
                {errors.shortName && (
                  <Text style={{ color: colors.error, fontSize: 12, marginTop: 4, marginLeft: 12 }}>
                    {errors.shortName.message}
                  </Text>
                )}
              </View>
            )}
          />
        </View>
      </View>
    </WizardLayout>
  );
}
