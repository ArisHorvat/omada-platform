import { StyleSheet } from 'react-native';

export const createStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.subtle },
  button: { width: '100%', paddingVertical: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, marginTop: 8 },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: colors.card },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  footerText: { fontSize: 16, color: colors.subtle },
  linkText: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginLeft: 4 }
});