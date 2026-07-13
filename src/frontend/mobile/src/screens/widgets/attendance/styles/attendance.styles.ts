import { StyleSheet } from 'react-native';



export const createStyles = (colors: {

  text: string;

  card: string;

  primary: string;

  subtle: string;

}) =>

  StyleSheet.create({

    container: {

      flex: 1,

      paddingHorizontal: 20,

    },

    toggle: {

      paddingHorizontal: 12,

      paddingVertical: 8,

      borderRadius: 12,

    },

    inlineStats: {

      borderRadius: 14,

      marginBottom: 12,

      paddingHorizontal: 14,

      paddingVertical: 10,

    },

    sectionTitle: {

      marginBottom: 12,

      marginTop: 8,

    },

    listCard: {

      marginBottom: 12,

    },

    historyCard: {

      marginBottom: 12,

      padding: 14,

      borderRadius: 16,

      gap: 8,

      overflow: 'visible',

    },

    historyHeader: {

      flexDirection: 'row',

      alignItems: 'flex-start',

      justifyContent: 'space-between',

      gap: 12,

    },

    historyBody: {

      flex: 1,

      flexShrink: 1,

      minWidth: 0,

    },

    historyMeta: {

      marginTop: 4,

      lineHeight: 18,

    },

    statusBadge: {

      paddingHorizontal: 10,

      paddingVertical: 6,

      borderRadius: 10,

      flexShrink: 0,

      alignSelf: 'flex-start',

    },

    actions: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 8,
    },
    actionsStack: {
      gap: 8,
    },
    actionBtnFull: {
      alignSelf: 'stretch',
    },
    actionBtnHalf: {
      flex: 1,
      minWidth: 0,
    },

  });

