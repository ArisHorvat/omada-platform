import React, { useState } from 'react';
import { View, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { AppText, ClayView, Icon } from '@/src/components/ui';
import { ClayDatePicker } from '@/src/components/ui/ClayDatePicker';
import { DateStrip } from '@/src/components/ui/DateStrip';
import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { AnimatedItem } from '@/src/components/animations';
import { ClayAnimations } from '@/src/constants/animations';
import { useThemeColors } from '@/src/hooks';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
}

export const ScheduleHeader: React.FC<Props> = ({ selectedDate, onDateSelect }) => {
    const colors = useThemeColors();
    const [showCalendar, setShowCalendar] = useState(false);

    const toggleCalendar = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowCalendar(!showCalendar);
    };

    return (
        <View style={{ backgroundColor: colors.background, zIndex: 10 }}>
            {/* TOP BAR */}
            <View style={{ paddingHorizontal: 20, paddingBottom: 8, paddingTop: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <ClayBackButton />
                        <AppText variant="h2" weight="bold" style={{ marginLeft: 16 }}>Schedule</AppText>
                    </View>
                    
                    {/* 🚀 TODAY BUTTON (Icon Style) */}
                    <TouchableOpacity 
                        onPress={() => onDateSelect(new Date())} 
                        style={{ 
                            width: 40, height: 40, borderRadius: 20, 
                            backgroundColor: colors.card, 
                            alignItems: 'center', justifyContent: 'center',
                            borderWidth: 1, borderColor: colors.border + '20'
                        }}
                    >
                        <Icon name="calendar-today" size={20} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* MONTH TOGGLE */}
                <TouchableOpacity 
                    onPress={toggleCalendar} 
                    style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 8 }}
                >
                    <AppText variant="h3" weight="bold" style={{ color: colors.primary, marginRight: 6 }}>
                        {selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </AppText>
                    <Icon name={showCalendar ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* 🚀 IN-FLOW CALENDAR (Pushes content down, no floating) */}
            {showCalendar && (
                <View style={{ overflow: 'hidden', paddingBottom: 16 }}>
                    <ClayView depth={5} color={colors.card} style={{ marginHorizontal: 20, padding: 12, borderRadius: 24 }}>
                        <ClayDatePicker 
                            value={selectedDate} 
                            onChange={(date) => { 
                                onDateSelect(date); 
                                toggleCalendar(); 
                            }} 
                        />
                    </ClayView>
                </View>
            )}

            {/* DATE STRIP */}
            <DateStrip selectedDate={selectedDate} onSelectDate={onDateSelect} />
        </View>
    );
};