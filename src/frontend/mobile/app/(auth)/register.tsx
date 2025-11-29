import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StyleSheet,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import ColorPicker, { ColorPickerProps } from 'react-native-wheel-color-picker';
import { useThemeColors } from '@/hooks/use-theme-color';

const THEME_COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#a855f7', '#eab308'];

interface FormInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  styles: any;
  description?: string | null;
}

// Redesigned FormInput with a persistent label
const FormInput = ({ label, placeholder, value, onChangeText, secureTextEntry = false, styles, description = null }: FormInputProps) => {
  const colors = useThemeColors();
  return (<View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      placeholderTextColor={colors.subtle}
      secureTextEntry={secureTextEntry}
    />
    {description && <Text style={styles.inputDescription}>{description}</Text>}
  </View>);
};

export default function RegisterScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  const [orgName, setOrgName] = useState('');
  const [shortName, setShortName] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [pickedDocument, setPickedDocument] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [pickedLogo, setPickedLogo] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  
  // New state for multiple color selections
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState('#64748b');
  const [accentColor, setAccentColor] = useState('#eab308');
  const [activeColorPicker, setActiveColorPicker] = useState<'primary' | 'secondary' | 'accent' | null>(null);
  const [isColorPickerVisible, setColorPickerVisible] = useState(false);

  const styles = useMemo(() => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
    headerStepText: { fontSize: 18, fontWeight: 'bold', color: colors.text },
    scrollView: { flex: 1, paddingHorizontal: 16 },
    formSection: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16 },
    inputGroup: { marginBottom: 12 },
    label: { fontSize: 16, fontWeight: '500', color: colors.text, marginBottom: 8 },
    input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, color: colors.text },
    inputDescription: { fontSize: 12, color: colors.subtle, marginTop: 4, paddingHorizontal: 4 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '500', color: colors.text, marginBottom: 8 },
    sectionTitleOptional: { fontSize: 14, fontWeight: 'normal', color: colors.notification },
    roleInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingRight: 8, marginBottom: 12 },
    filePreviewText: { fontSize: 14, color: colors.notification, marginTop: 8 },
    footer: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background },
    footerButton: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
    cancelButton: { backgroundColor: colors.border, marginRight: 8 },
    nextButton: { backgroundColor: colors.primary, marginLeft: 8 },
    footerButtonText: { fontSize: 16, fontWeight: 'bold', color: colors.text },
    logoContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    logoPreview: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.border },
    logoPlaceholder: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    uploadTextContainer: { marginLeft: 16, justifyContent: 'center' },
    uploadText: { fontSize: 16, fontWeight: '500', color: colors.primary },
    uploadSuccessText: { fontSize: 14, color: 'green', marginTop: 4 },
    colorSelectionContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
    colorSelector: { alignItems: 'center' },
    colorSwatch: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
    colorLabel: { marginTop: 8, fontSize: 14, color: colors.text },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    colorPickerWrapper: { width: '80%', height: '60%', backgroundColor: colors.card, borderRadius: 12, padding: 20 },
    colorPickerButton: { marginTop: 20, backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  }), [colors]);

  const addRole = () => setRoles([...roles, '']);
  const deleteRole = (indexToDelete: number) => setRoles(roles.filter((_, index) => index !== indexToDelete));
  const updateRole = (text: string, indexToUpdate: number) => setRoles(roles.map((role, index) => (index === indexToUpdate ? text : role)));

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] });
    if (!result.canceled) setPickedDocument(result.assets[0]);
  };

  const pickLogo = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'image/*' });
    if (!result.canceled) setPickedLogo(result.assets[0]);
  };

  const validateAndGetData = () => {
    if (!orgName || !emailDomain || !adminName || !adminEmail || !password) {
      Alert.alert("Validation Error", "Please fill in all required fields.");
      return null;
    }
    if (password.length < 8) {
      Alert.alert("Validation Error", "Password must be at least 8 characters long.");
      return null;
    }
    if (password !== confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match.");
      return null;
    }
    if (!adminEmail.endsWith(emailDomain)) {
      Alert.alert("Validation Error", "Admin email must match the organization's email domain.");
      return null;
    }
    return { orgName, shortName, emailDomain, adminName, adminEmail, password, primaryColor, secondaryColor, accentColor, roles, logoUri: pickedLogo?.uri };
  };

  const handleNext = () => {
    const data = validateAndGetData();
    if (!data) return;

    // Pass all registration data to the next step
    router.push({ pathname: '/widget-selection', params: { ...data, roles: JSON.stringify(data.roles) } });
  };

  const openColorPicker = (type: 'primary' | 'secondary' | 'accent') => {
    setActiveColorPicker(type);
    setColorPickerVisible(true);
  };

  const handleColorChange = (color: string) => {
    if (!activeColorPicker) return;
    switch (activeColorPicker) {
      case 'primary': setPrimaryColor(color); break;
      case 'secondary': setSecondaryColor(color); break;
      case 'accent': setAccentColor(color); break;
    }
  };

  const handleColorPickerDone = () => {
    setColorPickerVisible(false);
    setActiveColorPicker(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerStepText}>Organization Info</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.formSection}>
            <FormInput label="Organization Name" placeholder="e.g., Acme University" value={orgName} onChangeText={setOrgName} styles={styles} />
            <FormInput label="Short Name" placeholder="e.g., AU" value={shortName} onChangeText={setShortName} styles={styles} />
            <FormInput label="Email Domain" placeholder="e.g., acme.edu" value={emailDomain} onChangeText={setEmailDomain} styles={styles} description="For new user registration" />
            <FormInput label="Admin Full Name" placeholder="e.g., John Doe" value={adminName} onChangeText={setAdminName} styles={styles} />
            <FormInput label="Admin Email" placeholder="e.g., admin@acme.edu" value={adminEmail} onChangeText={setAdminEmail} styles={styles} description="Must match the email domain above" />
            <FormInput label="Password" placeholder="Enter a strong password" value={password} onChangeText={setPassword} secureTextEntry styles={styles} />
            <FormInput label="Confirm Password" placeholder="Re-enter password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry styles={styles} />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Organization Logo</Text>
            <View style={styles.logoContainer}>
              <TouchableOpacity onPress={pickLogo}>
                {pickedLogo ? <Image source={{ uri: pickedLogo.uri }} style={styles.logoPreview} /> : <View style={styles.logoPlaceholder}><MaterialIcons name="upload" size={24} color={colors.notification} /></View>}
              </TouchableOpacity>
              <View style={styles.uploadTextContainer}>
                <TouchableOpacity onPress={pickLogo}><Text style={styles.uploadText}>{pickedLogo ? 'Change Logo' : 'Upload Logo'}</Text></TouchableOpacity>
                {pickedLogo && <View style={{flexDirection: 'row', alignItems: 'center'}}><MaterialIcons name="check-circle" size={16} color="green" /><Text style={styles.uploadSuccessText}> Logo Uploaded!</Text></View>}
              </View>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Color Scheme</Text>
            <View style={styles.colorSelectionContainer}>
              <TouchableOpacity style={styles.colorSelector} onPress={() => openColorPicker('primary')}>
                <View style={[styles.colorSwatch, { backgroundColor: primaryColor }]} />
                <Text style={styles.colorLabel}>Primary</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.colorSelector} onPress={() => openColorPicker('secondary')}>
                <View style={[styles.colorSwatch, { backgroundColor: secondaryColor }]} />
                <Text style={styles.colorLabel}>Secondary</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.colorSelector} onPress={() => openColorPicker('accent')}>
                <View style={[styles.colorSwatch, { backgroundColor: accentColor }]} />
                <Text style={styles.colorLabel}>Accent</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Custom Roles</Text>
              <TouchableOpacity onPress={addRole}><MaterialIcons name="add" size={24} color={colors.primary} /></TouchableOpacity>
            </View>
            {roles.length === 0 && <Text style={styles.inputDescription}>Add roles like 'Teacher', 'Student', 'Manager', etc.</Text>}
            {roles.map((role, index) => (
              <View key={index} style={styles.roleInputContainer}>
                <TextInput style={[styles.input, { marginBottom: 0, flex: 1 }]} value={role} onChangeText={(text) => updateRole(text, index)} placeholder="e.g., Department Head" placeholderTextColor={colors.subtle} />
                <TouchableOpacity onPress={() => deleteRole(index)}><MaterialIcons name="delete" size={20} color={colors.notification} style={{ marginLeft: 8 }}/></TouchableOpacity>
              </View>
            ))}
          </View>

        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={[styles.footerButton, styles.cancelButton]} onPress={() => router.back()}><Text style={styles.footerButtonText}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.footerButton, styles.nextButton]} onPress={handleNext}><Text style={[styles.footerButtonText, { color: colors.card }]}>Next</Text></TouchableOpacity>
        </View>
      </View>
      <Modal
        visible={isColorPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setColorPickerVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.colorPickerWrapper}>
            <ColorPicker
              color={
                activeColorPicker === 'secondary' ? secondaryColor :
                activeColorPicker === 'primary' ? primaryColor :
                accentColor
              }
              onColorChange={handleColorChange}
              thumbSize={30}
            /> 
            <TouchableOpacity style={styles.colorPickerButton} onPress={handleColorPickerDone}>
              <Text style={{color: colors.card, fontWeight: 'bold'}}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
