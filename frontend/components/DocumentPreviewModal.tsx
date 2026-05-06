import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useColors } from '@/hooks/useColors';

// Optional imports to avoid bundling issues on some environments
let mammoth: any = null;
try {
  mammoth = require('mammoth');
} catch (e) {
  console.log('Mammoth not available');
}

interface DocumentPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  fileUrl: string;
  title: string;
  textContent?: string;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  visible,
  onClose,
  fileUrl,
  title,
  textContent: initialTextContent,
}) => {
  const colors = useColors();
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const ADMIN_COLOR = "#2980B9";

  const isLocalUrl = fileUrl.includes('localhost') || 
                     fileUrl.includes('127.0.0.1') || 
                     fileUrl.includes('10.') || 
                     fileUrl.includes('192.168.');

  const isWordDoc = fileUrl.toLowerCase().endsWith('.doc') || 
                    fileUrl.toLowerCase().endsWith('.docx');

  const isPdfDoc = fileUrl.toLowerCase().endsWith('.pdf');

  useEffect(() => {
    if (visible && (isWordDoc || isPdfDoc) && !initialTextContent) {
      handleExtractText();
    } else {
      setExtractedText(initialTextContent || null);
    }
  }, [visible, fileUrl, initialTextContent]);

  const handleExtractText = async () => {
     if (isWordDoc && !mammoth) {
       setExtractedText("Ntibyashobotse gusoma inyandiko ya Word (Library not available).");
       return;
     }

     if (isPdfDoc) {
       setExtractedText(null);
       return;
     }

     try {
      setExtracting(true);
      // For local development files (file://) or if we need to download it first
      let localUri = fileUrl;
      
      if (fileUrl.startsWith('http')) {
        const filename = fileUrl.split('/').pop() || 'temp.docx';
        const downloadRes = await FileSystem.downloadAsync(
          fileUrl,
          FileSystem.cacheDirectory + filename
        );
        localUri = downloadRes.uri;
      }

      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const arrayBuffer = base64ToArrayBuffer(base64);
      const result = await mammoth.extractRawText({ arrayBuffer });
      setExtractedText(result.value);
    } catch (error) {
      console.error('Extraction error:', error);
      setExtractedText(null);
    } finally {
      setExtracting(false);
    }
  };

  const base64ToArrayBuffer = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const handleOpenExternal = async () => {
    await WebBrowser.openBrowserAsync(fileUrl);
  };

  const handleDownloadAndOpen = async () => {
    try {
      setExtracting(true);
      const filename = fileUrl.split('/').pop() || 'document.pdf';
      const fileUri = FileSystem.cacheDirectory + filename;
      
      const downloadRes = await FileSystem.downloadAsync(fileUrl, fileUri);
      
      if (downloadRes.status === 200) {
        await Sharing.shareAsync(downloadRes.uri, {
          mimeType: 'application/pdf',
          dialogTitle: title,
          UTI: 'com.adobe.pdf'
        });
      } else {
        await handleOpenExternal();
      }
    } catch (error) {
      console.error('Download/Share error:', error);
      await handleOpenExternal();
    } finally {
      setExtracting(false);
    }
  };

  const renderContent = () => {
    if (extracting) {
      return (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={ADMIN_COLOR} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Birimo gusoma inyandiko...
          </Text>
        </View>
      );
    }
  
    // 1. PDF Embedding (WebView)
    if (isPdfDoc) {
      const googleViewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileUrl)}`;
      
      return (
        <WebView
          source={{ uri: googleViewerUrl }}
          style={styles.pdf}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={ADMIN_COLOR} />
              <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                Birimo gufungura PDF...
              </Text>
            </View>
          )}
          onError={(syntheticEvent) => {
            console.error('WebView error:', syntheticEvent.nativeEvent);
          }}
        />
      );
    }

    // 2. If textContent is available, show it directly (Works for Word)
    if (extractedText && extractedText.trim().length > 0) {
      return (
        <ScrollView style={styles.textContainer} contentContainerStyle={styles.textContent}>
          <Text style={[styles.extractedText, { color: colors.foreground }]}>
            {extractedText}
          </Text>
        </ScrollView>
      );
    }

    // 3. For non-local Word documents without extracted text
    if (!isLocalUrl && isWordDoc) {
      return (
        <WebView
          source={{ uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileUrl)}` }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={ADMIN_COLOR} />
              <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                Birimo gupakira inyandiko...
              </Text>
            </View>
          )}
        />
      );
    }

    // 4. Web PDF fallback
    if (Platform.OS === 'web' && isPdfDoc) {
      return (
        <WebView
          source={{ uri: fileUrl }}
          style={styles.webview}
        />
      );
    }

    // 5. Fallback for Local files (especially Word on Android where we can't embed)
    if (isLocalUrl) {
      return (
        <View style={styles.fallback}>
          <Feather name={isPdfDoc ? "file-text" : "file"} size={80} color={ADMIN_COLOR} />
          <Text style={[styles.fallbackText, { color: colors.foreground }]}>
            Inyandiko ya {isPdfDoc ? 'PDF' : 'Word'} (Local)
          </Text>
          <Text style={[styles.fallbackSub, { color: colors.mutedForeground, marginHorizontal: 20 }]}>
            Iyi nyandiko iri kuri network yawe. Kanda hano kugira ngo uyifungure:
          </Text>
          <TouchableOpacity 
            style={[styles.openBtn, { backgroundColor: ADMIN_COLOR }]} 
            onPress={handleOpenExternal}
          >
            <Feather name="external-link" size={20} color="#fff" />
            <Text style={styles.openBtnText}>Fungura Inyandiko</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="arrow-left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {title}
          </Text>
          <TouchableOpacity onPress={handleOpenExternal} style={styles.actionBtn}>
            <Feather name="share" size={20} color={ADMIN_COLOR} />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginHorizontal: 12,
  },
  actionBtn: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  textContainer: {
    flex: 1,
    padding: 20,
  },
  textContent: {
    paddingBottom: 40,
  },
  extractedText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter_400Regular',
  },
  webview: {
    flex: 1,
  },
  pdf: {
    flex: 1,
    width: '100%',
    backgroundColor: '#f5f5f5',
  },
  pdfIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  previewContainer: {
    marginTop: 30,
    width: '100%',
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 20,
  },
  previewTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 10,
  },
  miniPreview: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
  },
  miniPreviewText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 20,
  },
  fallbackText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  fallbackSub: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  openBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});
