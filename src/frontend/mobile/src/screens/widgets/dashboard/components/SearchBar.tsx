import React, { useMemo, useRef } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { ClayView } from '@/src/components/ui/ClayView';
import { Icon } from '@/src/components/ui/Icon';
import { PressClay } from '@/src/components/animations/PressClay';
import { useThemeColors } from '@/src/hooks';

interface SearchBarProps {
  onPress?: () => void;       // If provided, acts as a button (Dashboard)
  onChangeText?: (text: string) => void; // If provided, acts as input (List)
  value?: string;
  placeholder?: string;
  compact?: boolean;
  autoFocus?: boolean;
}

export const SearchBar = ({ 
  onPress, 
  onChangeText,
  value = '',
  placeholder,
  compact = false,
  autoFocus = false
}: SearchBarProps) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const inputRef = useRef<TextInput>(null);

  // Determine mode: "Read Only" (Button) vs "Editable" (Input)
  const isReadOnly = !!onPress; 
  const defaultPlaceholder = compact ? "Search..." : "Search apps, grades, people...";

  // Wrapper Logic: If read-only, wrap in animation. If editable, just a View.
  const Wrapper = isReadOnly ? PressClay : View;

  return (
    <View style={[styles.wrapper, compact && styles.wrapperCompact]}>
      <Wrapper onPress={onPress} style={{ width: '100%' }}>
        <ClayView 
            // Input mode gets less depth so it feels flatter/easier to type
            depth={compact || !isReadOnly ? 5 : 10} 
            puffy={compact ? 10 : 15} 
            color={compact ? colors.background : colors.card}
            style={[
                styles.container, 
                compact && styles.containerCompact
            ]}
        >
          <View style={styles.innerRow}>
            
            {/* SEARCH ICON */}
            <Icon 
                name="search" 
                size={compact ? 18 : 22} 
                color={colors.primary} 
                style={styles.icon} 
            />
            
            {/* TEXT INPUT */}
            <View style={styles.inputWrapper}>
              <TextInput 
                ref={inputRef}
                placeholder={placeholder || defaultPlaceholder} 
                placeholderTextColor={colors.subtle}
                style={[
                    styles.input, 
                    compact && styles.inputCompact,
                    { color: colors.text },
                    { pointerEvents: isReadOnly ? 'none' : 'auto' },
                ]}
                // Logic Switching
                editable={!isReadOnly} 
                autoFocus={autoFocus}
                value={value}
                onChangeText={onChangeText}
                returnKeyType="search"
              />
            </View>
            
            {/* RIGHT SIDE ACTIONS */}
            
            {/* 1. Clear Button (Only in Input Mode when text exists) */}
            {!isReadOnly && value.length > 0 && (
                <TouchableOpacity onPress={() => onChangeText?.('')} style={styles.clearBtn}>
                    <Icon name="close" size={16} color={colors.subtle} />
                </TouchableOpacity>
            )}

            {/* 2. Keyboard Hint (Only in ReadOnly/Dashboard Mode) */}
            {isReadOnly && !compact && (
                <View style={[styles.kbd, { borderColor: colors.border, backgroundColor: colors.background }]}>
                   <Icon name="keyboard-command-key" size={14} color={colors.subtle} />
                </View>
            )}

          </View>
        </ClayView>
      </Wrapper>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  // WRAPPER
  wrapper: {
    marginTop: 10,
    width: '100%',
  },
  wrapperCompact: {
    marginTop: 0,
  },

  // CONTAINER (The Clay View)
  container: {
    height: 52,
    borderRadius: 26, 
    justifyContent: 'center',
  },
  containerCompact: {
    height: 40, 
    borderRadius: 20,
  },

  // INNER LAYOUT
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: '100%',
  },
  
  // ICON
  icon: { 
    marginRight: 10,
    opacity: 0.9,
  },

  // INPUT
  inputWrapper: { 
    flex: 1,
    justifyContent: 'center',
    height: '100%',
  },
  input: { 
    fontSize: 16, 
    fontFamily: Platform.select({ ios: 'System', default: 'Roboto' }), // Replace with your 'Body' font if loaded
    fontWeight: '500',
    height: '100%',
    paddingVertical: 0, // Fixes Android text vertical alignment
  },
  inputCompact: {
    fontSize: 14,
  },

  // ACTIONS
  clearBtn: {
    padding: 4,
    marginLeft: 4,
  },
  kbd: {
    width: 28, 
    height: 28, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderRadius: 8, 
    borderWidth: 1, 
    opacity: 0.6,
  }
});