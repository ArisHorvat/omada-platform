import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import { useThemeColors } from '@/src/hooks';

interface StarRatingProps {
  rating: number; // 0 to 5
  onRatingChange?: (rating: number) => void;
  size?: number;
}

export const StarRating = ({ rating, onRatingChange, size = 24 }: StarRatingProps) => {
  const colors = useThemeColors();
  
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity 
           key={star} 
           disabled={!onRatingChange} 
           onPress={() => onRatingChange && onRatingChange(star)}
        >
          <Icon
            name={star <= rating ? 'star' : 'star-outline'} // or 'star-border' depending on icon set
            size={size}
            color={star <= rating ? '#FFD700' : colors.subtle} // Gold vs Gray
            style={{ marginRight: 2 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row' },
});