import { StyleSheet } from 'react-native';

export const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    padding: 24,
  },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 60,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: colors.subtle,
    textAlign: 'center',
    marginBottom: 48,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonTextPrimary: {
    color: colors.onPrimary,
  },
  secondaryActionContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  secondaryActionText: {
    fontSize: 16,
    color: colors.subtle,
  },
  secondaryActionLink: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: 4,
  },
  tutorialButton: {
    marginTop: 'auto',
    marginBottom: 20,
    padding: 10,
  }
});