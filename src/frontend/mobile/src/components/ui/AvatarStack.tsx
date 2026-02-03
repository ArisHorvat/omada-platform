import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { useThemeColors } from '@/src/hooks';

interface AvatarStackProps {
  avatars: string[]; // URLs
  limit?: number;
}

export const AvatarStack = ({ avatars, limit = 3 }: AvatarStackProps) => {
  const colors = useThemeColors();
  const visibleAvatars = avatars.slice(0, limit);
  const remaining = avatars.length - limit;

  return (
    <View style={styles.container}>
      {visibleAvatars.map((url, index) => (
        <Image
          key={index}
          source={{ uri: url }}
          style={[
            styles.avatar,
            { 
              borderColor: colors.background, 
              marginLeft: index === 0 ? 0 : -15, // Negative margin for overlap
              zIndex: limit - index 
            }
          ]}
        />
      ))}
      
      {remaining > 0 && (
        <View style={[
          styles.avatar, 
          styles.counter, 
          { 
             backgroundColor: colors.card, 
             borderColor: colors.background,
             marginLeft: -15,
             zIndex: 0
          }
        ]}>
          <AppText variant="caption" weight="bold">+{remaining}</AppText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
  },
  counter: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});