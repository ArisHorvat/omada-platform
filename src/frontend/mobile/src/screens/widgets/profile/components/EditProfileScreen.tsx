import React, { useMemo, useRef } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  findNodeHandle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeColors, useTabContentBottomPadding } from '@/src/hooks';
import { createStyles } from '@/src/screens/widgets/profile/styles/edit-profile.styles';
import { useEditProfileLogic } from '@/src/screens/widgets/profile/hooks/useEditProfileLogic';
import { AppFormField, ProgressiveImage, AppText } from '@/src/components/ui';
import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { PressClay } from '@/src/components/animations/PressClay';

export default function EditProfileScreen() {
  const colors = useThemeColors();
  const bottomPad = useTabContentBottomPadding(32);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    user,
    phone,
    setPhone,
    address,
    setAddress,
    bio,
    setBio,
    displayAvatarUri,
    isLoading,
    isSaving,
    pickImage,
    handleSave,
  } = useEditProfileLogic();

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const displayImage = displayAvatarUri ? { uri: displayAvatarUri } : null;
  const initialFallback = user
    ? String(user.firstName?.trim().charAt(0) || user.lastName?.trim().charAt(0) || '?').toUpperCase()
    : '?';

  const scrollRef = useRef<ScrollView>(null);
  const bioRef = useRef<View | null>(null);
  const phoneRef = useRef<View | null>(null);
  const addressRef = useRef<View | null>(null);

  const scrollToField = (target: React.RefObject<View | null>) => {
    const scrollNode = scrollRef.current ? findNodeHandle(scrollRef.current) : null;
    const targetNode = target.current ? findNodeHandle(target.current) : null;
    if (!scrollNode || !targetNode || !target.current) return;

    // Keep focused field visible above the keyboard.
    (target.current as any).measureLayout(
      scrollNode,
      (_x: number, y: number) => {
        const nextY = Math.max(0, y - 140);
        scrollRef.current?.scrollTo({ y: nextY, animated: true });
      },
      () => undefined,
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <ClayBackButton />
        <AppText variant="h3" weight="bold" style={styles.headerTitle}>
          Edit profile
        </AppText>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingBottom: bottomPad, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.content}>
            <PressClay onPress={() => void pickImage()}>
              <View style={styles.avatarContainer}>
                {displayImage ? (
                  <ProgressiveImage
                    source={displayImage}
                    style={styles.avatar}
                    borderWidth={2}
                    borderColor={colors.primary}
                    fallback={
                      <View style={[styles.avatarPlaceholder, { position: 'absolute' }]}>
                        <AppText variant="display" weight="extra" style={{ color: colors.card }}>
                          {initialFallback}
                        </AppText>
                      </View>
                    }
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <AppText variant="display" weight="extra" style={{ color: colors.card }}>
                      +
                    </AppText>
                  </View>
                )}
                <View style={styles.editBadge}>
                  <AppText variant="caption" weight="bold" style={{ color: colors.background }}>
                    Photo
                  </AppText>
                </View>
              </View>
            </PressClay>

            <View ref={bioRef}>
              <AppFormField
                label="Bio"
                placeholder="Tell others a bit about you"
                value={bio}
                onChangeText={setBio}
                placeholderTextColor={colors.subtle}
                multiline
                numberOfLines={4}
                onFocus={() => scrollToField(bioRef)}
              />
            </View>

            <View ref={phoneRef}>
              <AppFormField
                label="Phone number"
                placeholder="e.g. +1 234 567 890"
                value={phone}
                onChangeText={setPhone}
                placeholderTextColor={colors.subtle}
                keyboardType="phone-pad"
                onFocus={() => scrollToField(phoneRef)}
              />
            </View>

            <View ref={addressRef}>
              <AppFormField
                label="Address"
                placeholder="e.g. 123 Main St"
                value={address}
                onChangeText={setAddress}
                placeholderTextColor={colors.subtle}
                onFocus={() => scrollToField(addressRef)}
              />
            </View>

            <PressClay onPress={() => !isSaving && void handleSave()}>
              <View style={[styles.button, isSaving && { opacity: 0.7 }]}>
                <AppText variant="body" weight="bold" style={{ color: colors.card }}>
                  {isSaving ? 'Saving…' : 'Save changes'}
                </AppText>
              </View>
            </PressClay>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
