import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';

export const useDocumentPicker = () => {
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'], // Allow PDFs and Images
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const selectedFile = result.assets[0];
      
      // Simple validation: Check if file is too big (e.g., > 5MB)
      if (selectedFile.size && selectedFile.size > 5 * 1024 * 1024) {
        Alert.alert("File too large", "Please select a file under 5MB.");
        return;
      }

      setFile(selectedFile);
    } catch (err) {
      console.log('Unknown Error: ', err);
    }
  };

  return { file, pickDocument };
};