import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { WizardLayout } from '@/src/components/layout';
import { IconInput, AppText, ClayView, Icon } from '@/src/components/ui';
import {
  AdminAccountMode,
  useRegistrationContext,
} from '../context/RegistrationContext';
import { useThemeColors } from '@/src/hooks';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const newAdminSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Please enter a valid email address'),
    password: passwordSchema,
    repeatPassword: z.string(),
  })
  .refine((data) => data.password === data.repeatPassword, {
    message: 'Passwords do not match',
    path: ['repeatPassword'],
  });

const existingAdminSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Enter your current Omada password'),
  repeatPassword: z.string().optional(),
});

type AdminFormValues = z.infer<typeof newAdminSchema>;

function AccountModeOption({
  label,
  description,
  icon,
  selected,
  onPress,
}: {
  label: string;
  description: string;
  icon: 'person-add' | 'link';
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity style={{ flex: 1 }} onPress={onPress} activeOpacity={0.75}>
      <View
        style={[
          styles.modeOuter,
          selected && { borderColor: colors.primary, backgroundColor: colors.primaryContainer },
        ]}
      >
        <ClayView
          depth={selected ? 8 : 4}
          color={selected ? colors.primaryContainer : colors.card}
          style={styles.modeOption}
        >
          <Icon name={icon} size={24} color={selected ? colors.primary : colors.subtle} />
          <AppText
            variant="label"
            weight={selected ? 'bold' : 'medium'}
            style={{ color: selected ? colors.primary : colors.text, textAlign: 'center' }}
          >
            {label}
          </AppText>
          <AppText variant="caption" style={{ color: colors.subtle, textAlign: 'center' }}>
            {description}
          </AppText>
        </ClayView>
      </View>
    </TouchableOpacity>
  );
}

export default function AdminDetailsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { adminData, setAdminData, adminAccountMode, setAdminAccountMode } = useRegistrationContext();
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  const schema = useMemo(
    () => (adminAccountMode === 'existing' ? existingAdminSchema : newAdminSchema),
    [adminAccountMode],
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AdminFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: adminData.firstName,
      lastName: adminData.lastName,
      email: adminData.email,
      password: adminData.password,
      repeatPassword: adminData.repeatPassword,
    },
  });

  const switchMode = (mode: AdminAccountMode) => {
    setAdminAccountMode(mode);
    reset({
      firstName: adminData.firstName,
      lastName: adminData.lastName,
      email: adminData.email,
      password: '',
      repeatPassword: '',
    });
  };

  const onSubmit = (data: AdminFormValues) => {
    setAdminData({
      firstName: data.firstName ?? '',
      lastName: data.lastName ?? '',
      email: data.email,
      password: data.password,
      repeatPassword: data.repeatPassword ?? '',
    });
    router.push('/(auth)/register-flow/branding');
  };

  const isExisting = adminAccountMode === 'existing';

  return (
    <WizardLayout
      step={1}
      totalSteps={3}
      title="Admin Account"
      subtitle={
        isExisting
          ? 'Link your existing Omada account as this organization’s admin'
          : 'Create the first admin account for this organization'
      }
      onBack={() => router.back()}
      onNext={handleSubmit(onSubmit)}
    >
      <View style={{ gap: 16 }}>
        <View style={styles.modeRow}>
          <AccountModeOption
            label="New account"
            description="Create credentials for a new admin"
            icon="person-add"
            selected={!isExisting}
            onPress={() => switchMode('new')}
          />
          <AccountModeOption
            label="Existing account"
            description="Use an Omada login you already have"
            icon="link"
            selected={isExisting}
            onPress={() => switchMode('existing')}
          />
        </View>

        {!isExisting ? (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="firstName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View>
                    <IconInput
                      icon="person"
                      placeholder="First Name"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      error={!!errors.firstName}
                    />
                    {errors.firstName && (
                      <Text style={{ color: colors.error, fontSize: 10, marginTop: 4, marginLeft: 12 }}>
                        {errors.firstName.message}
                      </Text>
                    )}
                  </View>
                )}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="lastName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View>
                    <IconInput
                      placeholder="Last Name"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      error={!!errors.lastName}
                    />
                    {errors.lastName && (
                      <Text style={{ color: colors.error, fontSize: 10, marginTop: 4, marginLeft: 12 }}>
                        {errors.lastName.message}
                      </Text>
                    )}
                  </View>
                )}
              />
            </View>
          </View>
        ) : (
          <ClayView style={{ padding: 16, borderRadius: 16, backgroundColor: colors.background }}>
            <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 18 }}>
              We’ll verify your password and add you as admin of this new organization. Your profile
              and other memberships stay unchanged.
            </AppText>
          </ClayView>
        )}

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <IconInput
                icon="mail"
                placeholder="Email"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!errors.email}
              />
              {errors.email && (
                <Text style={{ color: colors.error, fontSize: 12, marginTop: 4, marginLeft: 12 }}>
                  {errors.email.message}
                </Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <View>
              <IconInput
                icon="lock"
                rightIcon={showPassword ? 'visibility' : 'visibility-off'}
                onRightIconPress={() => setShowPassword((prev) => !prev)}
                placeholder={isExisting ? 'Current password' : 'Password'}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                secureTextEntry={!showPassword}
                error={!!errors.password}
              />
              {errors.password && (
                <Text style={{ color: colors.error, fontSize: 12, marginTop: 4, marginLeft: 12 }}>
                  {errors.password.message}
                </Text>
              )}
            </View>
          )}
        />

        {!isExisting ? (
          <Controller
            control={control}
            name="repeatPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <View>
                <IconInput
                  icon="lock-clock"
                  rightIcon={showRepeatPassword ? 'visibility' : 'visibility-off'}
                  onRightIconPress={() => setShowRepeatPassword((prev) => !prev)}
                  placeholder="Confirm Password"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  secureTextEntry={!showRepeatPassword}
                  error={!!errors.repeatPassword}
                />
                {errors.repeatPassword && (
                  <Text style={{ color: colors.error, fontSize: 12, marginTop: 4, marginLeft: 12 }}>
                    {errors.repeatPassword.message}
                  </Text>
                )}
              </View>
            )}
          />
        ) : null}
      </View>
    </WizardLayout>
  );
}

const styles = StyleSheet.create({
  modeRow: { flexDirection: 'row', gap: 12 },
  modeOuter: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 2,
  },
  modeOption: {
    borderRadius: 16,
    alignItems: 'center',
    gap: 6,
    padding: 14,
    overflow: 'hidden',
    minHeight: 118,
    justifyContent: 'center',
  },
});
