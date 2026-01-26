import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/src/hooks/use-theme-color';
import { FormInput } from '@/src/components/FormInput';
import { createStyles } from '@/src/screens/widgets/profile/styles/edit-profile.styles';
import { useEditProfileLogic } from '@/src/screens/widgets/profile/hooks/useEditProfileLogic';

export default function EditProfileScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { phone, setPhone, address, setAddress, profilePic, newProfilePic, isLoading, isSaving, pickImage, handleSave } = useEditProfileLogic();

  if (isLoading) return <View style={[styles.container, { justifyContent: 'center' }]}><ActivityIndicator size="large" color={colors.primary} /></View>;

  const displayImage = newProfilePic ? { uri: newProfilePic.uri } : (profilePic ? { uri: profilePic } : null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>
      
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
            {displayImage ? (
              <Image source={displayImage} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialIcons name="person" size={48} color={colors.card} />
              </View>
            )}
            <View style={styles.editBadge}>
              <MaterialIcons name="camera-alt" size={16} color={colors.background} />
            </View>
          </TouchableOpacity>

          <FormInput 
            label="Phone Number" 
            placeholder="e.g. +1 234 567 890" 
            value={phone} 
            onChangeText={setPhone} 
            styles={styles} 
            placeholderTextColor={colors.subtle}
          />

          <FormInput 
            label="Address" 
            placeholder="e.g. 123 Main St" 
            value={address} 
            onChangeText={setAddress} 
            styles={styles} 
            placeholderTextColor={colors.subtle}
          />

          <TouchableOpacity style={[styles.button, isSaving && { opacity: 0.7 }]} onPress={handleSave} disabled={isSaving}>
            <Text style={styles.buttonText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
