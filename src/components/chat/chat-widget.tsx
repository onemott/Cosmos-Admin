"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@/contexts/chat-context";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send, Paperclip, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export function ChatWidget() {
  const { 
    isOpen, 
    toggleChat, 
    closeChat,
    sessions, 
    currentSessionId, 
    selectSession, 
    messages, 
    sendMessage,
    isConnected
  } = useChat();
  
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const currentMessages = currentSessionId ? messages[currentSessionId] || [] : [];
  
  // Total unread count
  const totalUnread = sessions.reduce((sum, s) => sum + s.unread_count, 0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentMessages, isOpen, currentSessionId]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Only show widget if we have sessions or are connected (or always show it so admin can see empty state)
  // if (!isConnected && sessions.length === 0) return null; 

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {isOpen && (
        <Card className="w-[380px] h-[600px] shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 border-primary/20">
          <CardHeader className="p-4 border-b bg-primary/5 flex flex-row items-center justify-between shrink-0 h-16 space-y-0">
            <div className="flex items-center gap-2 overflow-hidden">
              {currentSessionId ? (
                <>
                  <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2 shrink-0" onClick={() => selectSession("")}>
                     <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex flex-col overflow-hidden">
                    <CardTitle className="text-sm truncate leading-none mb-1">
                      {currentSession?.client_name || "Unknown Client"}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 leading-none">
                       {isConnected ? <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> : <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                       {isConnected ? "Online" : "Offline"}
                    </span>
                  </div>
                </>
              ) : (
                <CardTitle className="text-base">Messages {totalUnread > 0 && `(${totalUnread})`}</CardTitle>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closeChat}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
            {currentSessionId ? (
              // Chat Window
              <>
                <ScrollArea className="flex-1 p-4 bg-muted/10">
                  <div className="flex flex-col gap-3">
                    {currentMessages.length === 0 ? (
                       <div className="text-center text-muted-foreground text-sm py-8">No messages yet.</div>
                    ) : (
                        currentMessages.map((msg, index) => (
                          <div
                            key={msg.id || msg.client_side_id || index}
                            className={cn(
                              "flex flex-col max-w-[80%]",
                              msg.sender_type === "user" ? "self-end items-end" : "self-start items-start"
                            )}
                          >
                            <div
                              className={cn(
                                "rounded-2xl px-3 py-2 text-sm shadow-sm",
                                msg.sender_type === "user"
                                  ? "bg-primary text-primary-foreground rounded-br-none"
                                  : "bg-background border rounded-bl-none"
                              )}
                            >
                              {msg.content}
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-1 px-1">
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        ))
                    )}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>
                <div className="p-3 border-t bg-background flex gap-2">
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input 
                    placeholder="Type a message..." 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                    autoFocus
                  />
                  <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSend} disabled={!input.trim() || !isConnected}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              // Session List
              <ScrollArea className="flex-1">
                {sessions.length === 0 ? (
                   <div className="text-center text-muted-foreground text-sm py-8 flex flex-col items-center gap-2">
                      <MessageCircle className="h-8 w-8 opacity-20" />
                      <span>No active sessions.</span>
                   </div>
                ) : (
                    <div className="flex flex-col divide-y">
                      {sessions.map((session) => (
                        <button
                          key={session.id}
                          className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors text-left w-full group"
                          onClick={() => selectSession(session.id)}
                        >
                          <Avatar className="h-10 w-10 border group-hover:border-primary/50 transition-colors">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${session.client_name}`} />
                            <AvatarFallback>{session.client_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 overflow-hidden min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium truncate text-sm">{session.client_name}</span>
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                {formatDistanceToNow(new Date(session.last_message_at), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate pr-2">
                              {session.last_message}
                            </p>
                          </div>
                          {session.unread_count > 0 && (
                            <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center shrink-0 text-[10px]">
                              {session.unread_count}
                            </Badge>
                          )}
                        </button>
                      ))}
                    </div>
                )}
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

      <Button
        size="lg"
        className={cn(
          "h-14 w-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110",
          isOpen ? "hidden" : "flex"
        )}
        onClick={toggleChat}
      >
        <MessageCircle className="h-6 w-6" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-white animate-pulse">
            {totalUnread}
          </span>
        )}
      </Button>
    </div>
  );
}
