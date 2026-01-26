import { StyleSheet } from 'react-native';

export const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardImage: {
    aspectRatio: 16 / 9,
    width: '100%',
    height: undefined,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 12,
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
  },
  attachmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  // Article Styles
  articleImage: {
    aspectRatio: 16 / 9,
    width: '100%',
    height: undefined,
  },
  articleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  articleContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  attachmentsSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  attachmentThumb: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
  },
  attachmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attachmentName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  editOverlay: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    padding: 6,
  },
  // Modal Styles
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  form: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20 },
  textArea: { height: 120, textAlignVertical: 'top' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  typeText: { fontSize: 14 },
  submitButton: { padding: 16, borderRadius: 8, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
