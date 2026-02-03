import React, { useState } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { 
  AppText, AppButton, GlassView, Divider, Icon, 
  IconInput, OtpInput, SegmentedControl, ToggleSwitch, RadioButton, StarRating, ChipGroup,
  StatusBadge, AvatarStack, CircularProgress, LinearProgressBar, StepIndicator, CodeBlock, Accordion,
  Skeleton, EmptyState, PulseIndicator, Toast, Tooltip,
  BentoGrid, SwipeableRow
} from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';

// --- HELPER COMPONENTS ---

// 1. A clean header for major sections
const SectionHeader = ({ title, description }: { title: string, description?: string }) => {
  const colors = useThemeColors();
  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 4, height: 24, backgroundColor: colors.primary, borderRadius: 2, marginRight: 12 }} />
        <AppText variant="h2" style={{ color: colors.text }}>{title}</AppText>
      </View>
      {description && (
        <AppText variant="body" style={{ color: colors.subtle, marginTop: 8, marginLeft: 16 }}>
          {description}
        </AppText>
      )}
      <Divider style={{ marginTop: 16 }} />
    </View>
  );
};

// 2. A wrapper to label specific components (e.g. "Primary Button")
const ComponentLabel = ({ label }: { label: string }) => {
  const colors = useThemeColors();
  return (
    <AppText variant="caption" weight="bold" style={{ color: colors.subtle, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
      {label}
    </AppText>
  );
};

// 3. The card that holds the content
const DemoCard = ({ children }: { children: React.ReactNode }) => {
  return (
    <View style={{ marginBottom: 48 }}>
      {children}
    </View>
  );
};

// --- MAIN COMPONENT ---
export const UiToolkit = () => {
  const colors = useThemeColors();
  
  // State
  const [toggleVal, setToggleVal] = useState(true);
  const [radioVal, setRadioVal] = useState('opt1');
  const [emailText, setEmailText] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordText, setPasswordText] = useState('');
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [chipVal, setChipVal] = useState('React');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [rating, setRating] = useState(4);
  

  const triggerToast = (type: 'success' | 'error') => {
    if(toastType === type) {
      // If same type is already showing, reset it
      setShowToast(!showToast);
    }
    else if(!showToast) {
      setToastType(type);
      setTimeout(() => setShowToast(true), 100);
    }
    else{
      setShowToast(false);
      setToastType(type);
      setTimeout(() => setShowToast(true), 100);
    }
  };

  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: 100 }}>
      
      {/* ================================================================================== */}
      {/* 1. INTERACTIVE ELEMENTS */}
      {/* ================================================================================== */}
      <DemoCard>
        <SectionHeader 
          title="Interactive Elements" 
          description="Core components for user actions and triggering events."
        />
        
        {/* BUTTONS */}
        <GlassView intensity={10} style={styles.card}>
          <ComponentLabel label="Button Variants" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
            <AppButton title="Primary" onPress={() => {}} size="sm" />
            <AppButton title="Secondary" variant="secondary" onPress={() => {}} size="sm" />
            <AppButton title="Outline" variant="outline" onPress={() => {}} size="sm" />
          </View>

          <ComponentLabel label="Button States" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <AppButton title="Loading..." loading onPress={() => {}} size="sm" />
            <AppButton title="Disabled" disabled onPress={() => {}} size="sm" />
            <AppButton title="Destructive" style={{ backgroundColor: colors.error }} onPress={() => {}} size="sm" />
          </View>
        </GlassView>

        {/* CONTROLS */}
        <GlassView intensity={10} style={[styles.card, { marginTop: 16 }]}>
          <ComponentLabel label="Toggles & Switches" />
          <View style={styles.rowBetween}>
             <View>
                <AppText variant="body" weight="bold">Push Notifications</AppText>
                <AppText variant="caption" style={{ color: colors.subtle }}>Receive daily updates</AppText>
             </View>
             <ToggleSwitch value={toggleVal} onValueChange={setToggleVal} />
          </View>
          
          <Divider style={{ marginVertical: 16 }} />

          <ComponentLabel label="Radio Selection" />
          <View style={{ flexDirection: 'row', gap: 24, marginTop: 8 }}>
             <RadioButton selected={radioVal === 'opt1'} onPress={() => setRadioVal('opt1')} label="Standard" />
             <RadioButton selected={radioVal === 'opt2'} onPress={() => setRadioVal('opt2')} label="Pro" />
          </View>
        </GlassView>
      </DemoCard>


      {/* ================================================================================== */}
      {/* 2. DATA ENTRY */}
      {/* ================================================================================== */}
      <DemoCard>
        <SectionHeader 
          title="Data Entry" 
          description="Inputs, filters, and selection controls."
        />
        
        <GlassView intensity={10} style={styles.card}>
            {/* TEXT INPUTS */}
            <ComponentLabel label="Text Fields" />
            <IconInput 
              icon="mail" 
              placeholder="Enter email address..." 
              value={emailText} 
              onChangeText={setEmailText} 
              style={{ marginBottom: 12 }}
            />
            <IconInput 
              icon="lock" 
              rightIcon={showPassword ? 'visibility' : 'visibility-off'}
              onRightIconPress={() => setShowPassword(!showPassword)}
              placeholder="Enter password..." 
              value={passwordText} 
              secureTextEntry={!showPassword}
              onChangeText={setPasswordText} 
              style={{ marginBottom: 24 }}
            />

            {/* SEGMENTED CONTROL */}
            <ComponentLabel label="Segmented Control" />
            <View style={{ marginBottom: 24 }}>
              <SegmentedControl 
                options={['Map View', 'List View', 'Grid']} 
                selectedIndex={segmentIndex} 
                onChange={setSegmentIndex} 
              />
            </View>

            {/* CHIPS */}
            <ComponentLabel label="Filter Chips" />
            <View style={{ marginBottom: 24 }}>
              <ChipGroup 
                options={['React', 'React Native', 'Expo', 'TypeScript', 'Node.js']} 
                selected={chipVal} 
                onSelect={setChipVal} 
              />
            </View>

            {/* RATING */}
            <View style={{ marginBottom: 24 }}>
               <ComponentLabel label="Star Rating" />
               <View style={{ alignSelf: 'center' }}>
                  <StarRating rating={rating} onRatingChange={setRating} />
               </View>
            </View>

            {/* OTP CODE */}
            <View>
               <ComponentLabel label="OTP Code" />
               {/* Center the OTP input for better presentation */}
               <View style={{ alignItems: 'center', marginTop: 8 }}>
                  <OtpInput length={4} onCodeFilled={(c) => console.log(c)} />
               </View>
            </View>
        </GlassView>
      </DemoCard>


      {/* ================================================================================== */}
      {/* 3. FEEDBACK SYSTEMS */}
      {/* ================================================================================== */}
      <DemoCard>
        <SectionHeader 
          title="Feedback Systems" 
          description="Communicating success, errors, and loading states."
        />

        <View style={{ gap: 16 }}>
          {/* TOASTS */}
          <GlassView intensity={15} style={{ minHeight: 250, ...styles.card }}>
             <ComponentLabel label="Toast Notifications" />
             
             {/* Buttons Row */}
             <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <AppButton 
                  title="Trigger Success" 
                  size="sm" 
                  variant="outline" 
                  onPress={() => triggerToast('success')} 
                />
                <AppButton 
                  title="Trigger Error" 
                  size="sm" 
                  variant="outline" 
                  style={{ borderColor: colors.error }} 
                  onPress={() => triggerToast('error')} 
                />
             </View>

             <AppText variant="caption" style={{ color: colors.subtle }}>
               Result: The notification appearing inline below.
             </AppText>
             
             <View style={{ justifyContent: 'center' }}>
               {showToast && (
                 <Toast 
                   type={toastType} 
                   message={toastType === 'success' ? "Operation successful!" : "Something went wrong."} 
                   visible={showToast}
                 />
               )}
             </View>
          </GlassView>

          {/* LOADING STATES */}
          <GlassView intensity={10} style={styles.card}>
             <ComponentLabel label="Loading Skeletons" />
             <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                <Skeleton width={48} height={48} style={{ borderRadius: 24 }} />
                <View style={{ flex: 1, gap: 8 }}>
                   <Skeleton width="100%" height={16} />
                   <Skeleton width="60%" height={16} />
                </View>
             </View>
          </GlassView>

          {/* EMPTY STATE */}
          <GlassView intensity={5} style={[styles.card, { borderWidth: 1, borderColor: colors.border }]}>
             <ComponentLabel label="Empty State" />
             <EmptyState 
               icon="cloud-off" 
               title="No Connections" 
               description="You are currently offline. Check your internet." 
             />
          </GlassView>
        </View>
      </DemoCard>


      {/* ================================================================================== */}
      {/* 4. VISUALIZATION */}
      {/* ================================================================================== */}
      <DemoCard>
        <SectionHeader 
          title="Visualization" 
          description="Badges, charts, and progress indicators."
        />
        
        <GlassView intensity={10} style={styles.card}>
           {/* BADGES */}
           <ComponentLabel label="Status Badges" />
           <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              <StatusBadge status="success" label="Completed" />
              <StatusBadge status="warning" label="In Progress" />
              <StatusBadge status="error" label="Overdue" />
           </View>

           {/* PROGRESS */}
           <ComponentLabel label="Progress Metrics" />
           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 24 }}>
              <CircularProgress progress={75} size={70} />
              <View style={{ flex: 1, gap: 12 }}>
                 <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                       <AppText variant="caption">System Load</AppText>
                       <AppText variant="caption" weight="bold">60%</AppText>
                    </View>
                    <LinearProgressBar progress={0.6} />
                 </View>
                 <AvatarStack avatars={['https://i.pravatar.cc/100?img=33', 'https://i.pravatar.cc/100?img=47', 'https://i.pravatar.cc/100?img=12']} />
              </View>
           </View>

           {/* STEPPER */}
           <ComponentLabel label="Step Indicator" />
           <View style={{ backgroundColor: colors.background, padding: 16, borderRadius: 12 }}>
              <StepIndicator currentStep={1} steps={['Register', 'Verify', 'Complete']} />
           </View>
        </GlassView>
      </DemoCard>


      {/* ================================================================================== */}
      {/* 5. COMPLEX COMPOSITIONS */}
      {/* ================================================================================== */}
      <DemoCard>
        <SectionHeader 
          title="Complex Layouts" 
          description="Advanced composed components used in the dashboard."
        />

        {/* SWIPEABLE */}
        <ComponentLabel label="Swipeable Row" />
        <SwipeableRow style={{ marginBottom: 24 }} actions={[{ icon: 'delete', onPress: () => alert('Deleted'), color: colors.error }]}>
           <GlassView intensity={15} style={[styles.card, { borderWidth: 1, borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                 <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="person" size={20} color="#fff" />
                 </View>
                 <View>
                    <AppText weight="bold">Dr. Sarah Connor</AppText>
                    <AppText variant="caption" style={{ color: colors.subtle }}>Swipe left for actions</AppText>
                 </View>
              </View>
           </GlassView>
        </SwipeableRow>

        {/* BENTO */}
        <ComponentLabel label="Bento Grid" />
        <View style={{ height: 220 }}>
           <BentoGrid>
              {/* Large */}
              <GlassView style={{ flex: 1, backgroundColor: colors.primary + '15', padding: 16, justifyContent: 'space-between' }}>
                 <Icon name="school" size={28} color={colors.primary} />
                 <View>
                    <AppText variant="h2">1,240</AppText>
                    <AppText variant="caption">Total Students</AppText>
                 </View>
              </GlassView>

              {/* Small 1 */}
              <GlassView style={{ flex: 1, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
                 <Icon name="event" size={24} color={colors.text} />
                 <AppText variant="caption" style={{ marginTop: 6 }}>Events</AppText>
              </GlassView>

              {/* Small 2 */}
              <GlassView style={{ flex: 1, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
                 <Icon name="chat" size={24} color={colors.text} />
                 <AppText variant="caption" style={{ marginTop: 6 }}>Chat</AppText>
              </GlassView>
           </BentoGrid>
        </View>
      </DemoCard>

      <View style={styles.toastContainer} pointerEvents="box-none">
        <Toast 
            type={toastType} 
            message={toastType === 'success' ? "Operation successful!" : "Something went wrong."} 
            visible={showToast} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 20,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start', // Puts toast at the top
    alignItems: 'center',         // Centers it horizontally
    paddingTop: 60,               // Spacing from the top edge
    zIndex: 9999,                 // floats on top of everything
    elevation: 5,                 // Android shadow/layer priority
  },
});