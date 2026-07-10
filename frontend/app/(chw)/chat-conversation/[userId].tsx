import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import apiClient from "@/context/apiClient";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

interface Message {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  createdAt: string;
  sender: {
    id: number;
    name: string;
    role: string;
  };
}

export default function ChatConversationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId: otherUserIdParam, userName: otherUserNameParam } = useLocalSearchParams();
  const { userId: currentUserId, userName: currentUserName } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<{ id: number; name: string } | null>(() => {
    // Initialize with name from params if available
    const initialId = parseInt(otherUserIdParam as string);
    if (otherUserNameParam && !isNaN(initialId)) {
      return { id: initialId, name: otherUserNameParam as string };
    }
    return null;
  });
  const scrollViewRef = useRef<ScrollView>(null);

  const otherUserId = parseInt(otherUserIdParam as string);

  useEffect(() => {
    fetchConversation();
  }, []);

  const fetchConversation = async () => {
    try {
      const response = await apiClient.get(
        `/messages/conversation?userId=${currentUserId}&otherUserId=${otherUserId}`,
      );
      setMessages(response.data);
      if (response.data.length > 0 && !otherUser) {
        const other = response.data[0].sender.id === parseInt(currentUserId || "0")
          ? response.data[0].receiver
          : response.data[0].sender;
        setOtherUser({ id: other.id, name: other.name });
      }
    } catch (error) {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      await apiClient.post("/messages", {
        senderId: parseInt(currentUserId || "0"),
        receiverId: otherUserId,
        content: messageContent,
      });
      await fetchConversation();
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      Alert.alert("Ikosa", error.response?.data?.message || "Kohereza ubutumwa byanze.");
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("rw-RW", { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              {otherUser?.name || "Umubyeyi"}
            </Text>
          </View>
          <TouchableOpacity onPress={fetchConversation} style={styles.refreshButton}>
            <ActivityIndicator size="small" color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <View style={[styles.loadingContainer, { flex: 1 }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>

        <View style={[styles.inputContainer, { 
          backgroundColor: colors.card, 
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 12),
        }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
            placeholder="Andika ubutumwa..."
            placeholderTextColor={colors.mutedForeground}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!newMessage.trim() || sending}
            style={[
              styles.sendButton,
              {
                backgroundColor: newMessage.trim() && !sending ? "#16A34A" : colors.mutedForeground,
              },
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Feather name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {otherUser?.name || "Ibiganiro"}
          </Text>
        </View>
        <TouchableOpacity onPress={fetchConversation} style={styles.refreshButton}>
          <Feather name="refresh-cw" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={[styles.messagesContent, { paddingBottom: insets.bottom + 80 }]}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="message-circle" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Nta butumwa buhari
            </Text>
            <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
              Tangira ibiganiro ukohereza ubutumwa
            </Text>
          </View>
        ) : (
          messages.map((message) => {
            const isSentByMe = message.senderId === parseInt(currentUserId || "0");
            return (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  isSentByMe ? styles.sentBubble : styles.receivedBubble,
                ]}
              >
                <View
                  style={[
                    styles.bubbleContent,
                    {
                      backgroundColor: isSentByMe ? "#16A34A" : colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      { color: isSentByMe ? "#FFFFFF" : colors.foreground },
                    ]}
                  >
                    {message.content}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      { color: isSentByMe ? "rgba(255,255,255,0.7)" : colors.mutedForeground },
                    ]}
                  >
                    {formatTime(message.createdAt)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={[styles.inputContainer, { 
        backgroundColor: colors.card, 
        borderTopColor: colors.border,
        paddingBottom: Math.max(insets.bottom, 12),
      }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
          placeholder="Andika ubutumwa..."
          placeholderTextColor={colors.mutedForeground}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!newMessage.trim() || sending}
          style={[
            styles.sendButton,
            {
              backgroundColor: newMessage.trim() && !sending ? "#16A34A" : colors.mutedForeground,
            },
          ]}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Feather name="send" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
    width: '100%',
  },
  backButton: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  refreshButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: '100%',
  },
  messagesContainer: {
    flex: 1,
    width: '100%',
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  emptyHint: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  messageBubble: {
    marginBottom: 12,
    maxWidth: "80%",
  },
  sentBubble: {
    alignSelf: "flex-end",
  },
  receivedBubble: {
    alignSelf: "flex-start",
  },
  bubbleContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    gap: 12,
    width: '100%',
    position: 'relative',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    maxHeight: 100,
    minHeight: 44,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
