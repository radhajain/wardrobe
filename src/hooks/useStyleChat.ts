import { useState, useEffect, useCallback } from "react";
import { ChatMessage, ClothesWithId, SuggestedTopic } from "../types";
import { chatStorage, sendStyleChat } from "../services/styleAssistant";
import { v4 as uuidv4 } from "uuid";

/**
 * Pre-defined suggested topics for the style assistant
 */
export const SUGGESTED_TOPICS: SuggestedTopic[] = [
  {
    id: "style-aesthetic",
    title: "Analyze my style",
    prompt:
      "Analyze my wardrobe and describe my current style aesthetic. What patterns do you see in my choices? What would you call my personal style?",
  },
  {
    id: "style-evolution",
    title: "Evolve my style",
    prompt:
      "Based on my current wardrobe, how could I intentionally evolve my style? What direction would complement what I already own while pushing my aesthetic forward?",
  },
  {
    id: "wardrobe-gaps",
    title: "What am I missing?",
    prompt:
      "Looking at my wardrobe, what key pieces am I missing that would maximize outfit possibilities? What gaps should I prioritize filling?",
  },
];

interface UseStyleChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  regenerateMessage: (messageId: string) => Promise<void>;
  clearChat: () => void;
}

/**
 * Hook for managing style assistant chat state
 */
export function useStyleChat(wardrobe: ClothesWithId[]): UseStyleChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load conversation from storage on mount
  useEffect(() => {
    const conversation = chatStorage.getConversation();
    setMessages(conversation.messages);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      setError(null);
      setIsLoading(true);

      // Create user message
      const userMessage: ChatMessage = {
        id: uuidv4(),
        role: "user",
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };

      // Add user message to state and storage
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      chatStorage.addMessage(userMessage);

      try {
        // Get AI response
        const assistantMessage = await sendStyleChat(
          content,
          wardrobe,
          updatedMessages,
        );

        // Add assistant message to state and storage
        setMessages((prev) => [...prev, assistantMessage]);
        chatStorage.addMessage(assistantMessage);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get response";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, wardrobe, isLoading],
  );

  const regenerateMessage = useCallback(
    async (messageId: string) => {
      if (isLoading) return;

      // Find the message index
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) return;

      // Find the preceding user message
      let userMessageIndex = messageIndex - 1;
      while (
        userMessageIndex >= 0 &&
        messages[userMessageIndex].role !== "user"
      ) {
        userMessageIndex--;
      }

      if (userMessageIndex < 0) return;

      const userMessage = messages[userMessageIndex];

      setError(null);
      setIsLoading(true);

      // Remove the assistant message being regenerated (and any after it)
      const messagesBeforeRegen = messages.slice(0, messageIndex);
      setMessages(messagesBeforeRegen);

      // Update storage to match
      chatStorage.clearConversation();
      messagesBeforeRegen.forEach((m) => chatStorage.addMessage(m));

      try {
        // Get new AI response
        const assistantMessage = await sendStyleChat(
          userMessage.content,
          wardrobe,
          messagesBeforeRegen,
        );

        // Add new assistant message
        setMessages((prev) => [...prev, assistantMessage]);
        chatStorage.addMessage(assistantMessage);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get response";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, wardrobe, isLoading],
  );

  const clearChat = useCallback(() => {
    chatStorage.clearConversation();
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    regenerateMessage,
    clearChat,
  };
}
