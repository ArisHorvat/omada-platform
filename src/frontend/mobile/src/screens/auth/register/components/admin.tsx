import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { WizardLayout } from '@/src/components/layout';
import { IconInput } from '@/src/components/ui';
import { useRegistrationContext } from '../context/RegistrationContext';
import { useThemeColors } from '@/src/hooks';

// 1. Zod Schema with Password Match verification
const adminSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  repeatPassword: z.string()
}).refine((data) => data.password === data.repeatPassword, {
  message: "Passwords do not match",
  path: ["repeatPassword"], // Points the error to the repeat field
});

type AdminFormValues = z.infer<typeof adminSchema>;

export default function AdminDetailsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { adminData, setAdminData } = useRegistrationContext();
  const [showPass, setShowPass] = useState(false);

  // 2. Setup React Hook Form
  const { control, handleSubmit, formState: { errors } } = useForm<AdminFormValues>({
    resolver: zodResolver(adminSchema),
    // Pre-fill if they came from a future step using the Back button
    defaultValues: {
      firstName: adminData.firstName,
      lastName: adminData.lastName,
      email: adminData.email,
      password: adminData.password,
      repeatPassword: adminData.repeatPassword,
    }
  });

  // 3. Submit Handler
  const onSubmit = (data: AdminFormValues) => {
    // Save cleanly to context
    setAdminData(data);
    router.push('/(auth)/register-flow/branding');
  };

  return (
    <WizardLayout 
        step={1} 
        totalSteps={6} 
        title="Admin Account"
        subtitle="Create your superuser credentials"
        onBack={() => router.back()} 
        onNext={handleSubmit(onSubmit)}
    >
        <View style={{ gap: 16 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
                {/* First Name */}
                <View style={{ flex: 1 }}>
                  <Controller
                    control={control}
                    name="firstName"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View>
                        <IconInput 
                            icon="person" placeholder="First Name"
                            value={value} onBlur={onBlur} onChangeText={onChange}
                            style={errors.firstName ? { borderColor: colors.error, borderWidth: 1 } : {}}
                        />
                        {errors.firstName && <Text style={{ color: colors.error, fontSize: 10, marginTop: 4, marginLeft: 12 }}>{errors.firstName.message}</Text>}
                      </View>
                    )}
                  />
                </View>

                {/* Last Name */}
                <View style={{ flex: 1 }}>
                  <Controller
                    control={control}
                    name="lastName"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View>
                        <IconInput 
                            placeholder="Last Name"
                            value={value} onBlur={onBlur} onChangeText={onChange}
                            style={errors.lastName ? { borderColor: colors.error, borderWidth: 1 } : {}}
                        />
                        {errors.lastName && <Text style={{ color: colors.error, fontSize: 10, marginTop: 4, marginLeft: 12 }}>{errors.lastName.message}</Text>}
                      </View>
                    )}
                  />
                </View>
            </View>

            {/* Email */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <IconInput 
                      icon="mail" placeholder="Admin Email"
                      value={value} onBlur={onBlur} onChangeText={onChange}
                      keyboardType="email-address" autoCapitalize="none"
                      style={errors.email ? { borderColor: colors.error, borderWidth: 1 } : {}}
                  />
                  {errors.email && <Text style={{ color: colors.error, fontSize: 12, marginTop: 4, marginLeft: 12 }}>{errors.email.message}</Text>}
                </View>
              )}
            />

            {/* Password */}
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <IconInput 
                      icon="lock"
                      rightIcon={showPass ? 'visibility' : 'visibility-off'}
                      onRightIconPress={() => setShowPass(!showPass)}
                      placeholder="Password"
                      value={value} onBlur={onBlur} onChangeText={onChange}
                      secureTextEntry={!showPass}
                      style={errors.password ? { borderColor: colors.error, borderWidth: 1 } : {}}
                  />
                  {errors.password && <Text style={{ color: colors.error, fontSize: 12, marginTop: 4, marginLeft: 12 }}>{errors.password.message}</Text>}
                </View>
              )}
            />

            {/* Repeat Password */}
            <Controller
              control={control}
              name="repeatPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <IconInput 
                      icon="lock-clock" placeholder="Confirm Password"
                      value={value} onBlur={onBlur} onChangeText={onChange}
                      secureTextEntry={!showPass}
                      style={errors.repeatPassword ? { borderColor: colors.error, borderWidth: 1 } : {}}
                  />
                  {errors.repeatPassword && <Text style={{ color: colors.error, fontSize: 12, marginTop: 4, marginLeft: 12 }}>{errors.repeatPassword.message}</Text>}
                </View>
              )}
            />
        </View>
    </WizardLayout>
  );
}