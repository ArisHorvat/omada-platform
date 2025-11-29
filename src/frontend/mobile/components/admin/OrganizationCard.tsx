import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Organization } from '../../types';

type OrganizationCardProps = {
  organization: Organization;
  onDelete: () => void;
};

const OrganizationCard = ({ organization, onDelete }: OrganizationCardProps) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Link href={`/organization/${organization.id}`} asChild>
        <TouchableOpacity style={styles.pressableArea}>
          <Text style={[styles.title, { color: colors.primary }]}>{organization.name}</Text>
          <Text style={[styles.detail, { color: colors.text }]}>{organization.domain}</Text>
          <Text style={[styles.detail, { color: colors.text }]}>{organization.admin_email}</Text>
        </TouchableOpacity>
      </Link>
      <View style={styles.actions}>
        <Link href={`/organization/edit/${organization.id}`} asChild>
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]}>
            <MaterialIcons name="edit" size={20} color={colors.card} />
            <Text style={[styles.buttonText, { color: colors.card }]}>Edit</Text>
          </TouchableOpacity>
        </Link>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.notification }]}
          onPress={onDelete}
        >
          <MaterialIcons name="delete" size={20} color={colors.card} />
          <Text style={[styles.buttonText, { color: colors.card }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pressableArea: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detail: {
    fontSize: 14,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default OrganizationCard;
