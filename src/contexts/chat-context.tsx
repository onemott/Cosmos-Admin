"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { ChatMessage, ChatSession, ChatSessionListResponse } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface ChatContextType {
  isConnected: boolean;
  sessions: ChatSession[];
  currentSessionId: string | null;
  messages: Record<string, ChatMessage[]>;
  sendMessage: (content: string, type?: "text" | "image" | "file") => void;
  selectSession: (sessionId: string) => void;
  markAsRead: (sessionId: string) => void;
  refreshSessions: () => void;
  isLoading: boolean;
  toggleChat: () => void;
  isOpen: boolean;
  closeChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const sessionsRef = useRef(sessions);

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const response = await api.chat.sessions() as unknown as ChatSessionListResponse;
      if (response && response.sessions) {
        setSessions(response.sessions);
      }
    } catch (error) {
      console.error("Failed to fetch chat sessions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const handleWebSocketMessage = useCallback((data: any) => {
    if (data.type === "message") {
      // Handle flat structure (new) or nested structure (old)
      const message = (data.data || data) as ChatMessage;
      
      // Check if session exists in current list
      const sessionExists = sessionsRef.current.some(s => s.id === message.session_id);

      if (!sessionExists) {
        console.log("Received message for new/unknown session, refreshing list...");
        fetchSessions();
        // Don't return here, continue to add message to state so it's available when user clicks
      }
      
      setMessages((prev) => {
        const sessionMessages = prev[message.session_id] || [];
        
        // Check for duplicate by id or client_side_id
        const existingIndex = sessionMessages.findIndex(m => 
          m.id === message.id || (message.client_side_id && m.client_side_id === message.client_side_id)
        );
        
        if (existingIndex !== -1) {
          // Replace existing message (e.g. optimistic one) with real one
          const newMessages = [...sessionMessages];
          newMessages[existingIndex] = message;
          return {
            ...prev,
            [message.session_id]: newMessages,
          };
        }

        return {
          ...prev,
          [message.session_id]: [...sessionMessages, message],
        };
      });

      setSessions((prev) => {
        return prev.map(session => {
          if (session.id === message.session_id) {
            const isCurrentSession = currentSessionId === message.session_id;
            return {
              ...session,
              last_message: message.content_type === 'text' ? message.content : `[${message.content_type}]`,
              last_message_at: message.created_at,
              unread_count: (isCurrentSession && isOpen) ? 0 : session.unread_count + 1,
            };
          }
          return session;
        }).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
      });
    }
  }, [currentSessionId, isOpen]);

  const connectWebSocket = useCallback(() => {
    if (!user) return;
    
    const token = getAccessToken();
    if (!token) return;

    if (wsRef.current) {
      wsRef.current.close();
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
    const wsUrl = apiUrl.replace(/^http/, "ws") + `/ws?token=${token}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("Chat WebSocket connected");
      setIsConnected(true);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = undefined;
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log("Chat WebSocket disconnected");
      setIsConnected(false);
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error("Chat WebSocket error:", error);
      ws.close();
    };

    wsRef.current = ws;
  }, [user, handleWebSocketMessage]);

  useEffect(() => {
    if (user) {
      fetchSessions();
      connectWebSocket();
    } else {
      if (wsRef.current) {
        wsRef.current.close();
      }
      setIsConnected(false);
      setSessions([]);
      setMessages({});
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user, fetchSessions, connectWebSocket]);

  const sendMessage = useCallback((content: string, type: "text" | "image" | "file" = "text") => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !currentSessionId) {
      toast({
        title: "Connection Error",
        description: "Chat is disconnected. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    const clientSideId = crypto.randomUUID();

    // Optimistic update
    const optimisticMessage: ChatMessage = {
      id: clientSideId, // Temporary ID
      session_id: currentSessionId,
      sender_type: "user",
      sender_id: "self",
      content: content,
      content_type: type,
      created_at: new Date().toISOString(),
      client_side_id: clientSideId,
    };

    setMessages((prev) => {
      const sessionMessages = prev[currentSessionId] || [];
      return {
        ...prev,
        [currentSessionId]: [...sessionMessages, optimisticMessage],
      };
    });

    const payload = {
      type: "message",
      data: {
        session_id: currentSessionId,
        content: content,
        content_type: type,
        client_side_id: clientSideId,
      },
    };

    wsRef.current.send(JSON.stringify(payload));
  }, [currentSessionId, toast]);

  const selectSession = useCallback(async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    
    // Fetch history if not loaded or just to be safe (pagination not implemented yet fully)
    try {
      const response: any = await api.chat.history(sessionId);
      // API returns history from newest to oldest usually.
      // We need to check the API implementation.
      // Assuming API returns List[ChatMessage] ordered by created_at DESC (default) or ASC.
      // Let's assume Backend returns standard list.
      // If backend returns DESC (newest first), we should reverse for UI (oldest at top).
      
      let historyMessages = response;
      // If it's wrapped in an object like { items: [] }
      if (response.items) historyMessages = response.items;
      
      // Check order. If created_at[0] > created_at[1], it's DESC.
      // We want ASC for chat window (oldest first).
      if (historyMessages.length > 1) {
          const first = new Date(historyMessages[0].created_at).getTime();
          const last = new Date(historyMessages[historyMessages.length - 1].created_at).getTime();
          if (first > last) {
              historyMessages.reverse();
          }
      }

      setMessages((prev) => ({
        ...prev,
        [sessionId]: historyMessages,
      }));
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }

    // Mark as read
    try {
      await api.chat.markRead(sessionId);
      // Update local state
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, unread_count: 0 } : s));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  }, []);

  const markAsRead = useCallback(async (sessionId: string) => {
      try {
        await api.chat.markRead(sessionId);
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, unread_count: 0 } : s));
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);
  
  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = {
    isConnected,
    sessions,
    currentSessionId,
    messages,
    sendMessage,
    selectSession,
    markAsRead,
    refreshSessions: fetchSessions,
    isLoading,
    toggleChat,
    isOpen,
    closeChat
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
