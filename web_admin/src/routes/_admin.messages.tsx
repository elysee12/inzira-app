import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Search, MessageSquare, Users, Send,
  AlertCircle, RefreshCw, Clock, CheckCheck,
} from "lucide-react";
import { toast } from "sonner";
import { messageApi, userApi, type Conversation, type Message } from "@/lib/api";
import { Card, CardHeader, Button, Badge } from "@/components/admin/ui";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_admin/messages")({ component: MessagesPage });

// ── Page ──────────────────────────────────────────────────────────────────────

function MessagesPage() {
  const { user: adminUser } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedOtherId, setSelectedOtherId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  // Load all CHWs and Parents to browse conversations
  const chws = useQuery({ queryKey: ["chws-msg"], queryFn: () => userApi.listByRole("CHW") });
  const parents = useQuery({ queryKey: ["parents-msg"], queryFn: () => userApi.listByRole("PARENT") });

  // Load conversations for the selected user
  const conversations = useQuery({
    queryKey: ["conversations", selectedUserId],
    queryFn: () => messageApi.conversations(selectedUserId!),
    enabled: !!selectedUserId,
  });

  // Load the specific thread
  const thread = useQuery({
    queryKey: ["thread", selectedUserId, selectedOtherId],
    queryFn: () => messageApi.conversation(selectedUserId!, selectedOtherId!),
    enabled: !!selectedUserId && !!selectedOtherId,
    refetchInterval: 5000, // poll every 5s
  });

  const allUsers = [...(chws.data ?? []), ...(parents.data ?? [])];
  const filteredUsers = allUsers.filter(
    (u) =>
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      (u.village ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const selectedUser = allUsers.find((u) => u.id === selectedUserId);
  const otherUser = allUsers.find((u) => u.id === selectedOtherId);

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-5">
      {/* Left: user selector */}
      <Card className="w-72 shrink-0 flex flex-col overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 px-3 h-9 rounded-lg border bg-background">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find user…"
              className="bg-transparent outline-none text-sm flex-1"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y">
          {chws.isPending || parents.isPending ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-3">
                <div className="size-9 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
                  <div className="h-2.5 bg-muted animate-pulse rounded w-1/3" />
                </div>
              </div>
            ))
          ) : (
            filteredUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  setSelectedUserId(u.id);
                  setSelectedOtherId(null);
                }}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors ${
                  selectedUserId === u.id ? "bg-primary/5 border-l-2 border-primary" : ""
                }`}
              >
                <div
                  className={`size-9 rounded-full grid place-items-center font-semibold text-sm shrink-0 ${
                    u.role === "CHW"
                      ? "bg-success/15 text-success"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{u.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {u.role === "CHW" ? "Health Worker" : "Parent"}
                    {u.village && ` · ${u.village}`}
                  </div>
                </div>
              </button>
            ))
          )}
          {!chws.isPending && !parents.isPending && filteredUsers.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">No users found</div>
          )}
        </div>
      </Card>

      {/* Middle: conversations list */}
      <Card className="w-64 shrink-0 flex flex-col overflow-hidden">
        <CardHeader
          title="Conversations"
          subtitle={selectedUser ? `${selectedUser.name}'s chats` : "Select a user"}
        />
        <div className="flex-1 overflow-y-auto divide-y">
          {!selectedUserId ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <MessageSquare className="size-8 mx-auto mb-2 opacity-30" />
              Select a user to see their conversations
            </div>
          ) : conversations.isPending ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-4 py-3">
                <div className="h-3.5 bg-muted animate-pulse rounded mb-1.5" />
                <div className="h-2.5 bg-muted animate-pulse rounded w-2/3" />
              </div>
            ))
          ) : conversations.isError ? (
            <div className="p-6 text-center text-sm text-destructive">
              <AlertCircle className="size-6 mx-auto mb-2" />
              Could not load conversations
            </div>
          ) : (conversations.data ?? []).length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No conversations yet
            </div>
          ) : (
            (conversations.data ?? []).map((conv) => (
              <button
                key={conv.partner.id}
                onClick={() => setSelectedOtherId(conv.partner.id)}
                className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
                  selectedOtherId === conv.partner.id ? "bg-primary/5 border-l-2 border-primary" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-sm truncate">{conv.partner.name}</div>
                  {conv.unreadCount > 0 && (
                    <span className="shrink-0 size-5 rounded-full bg-primary text-primary-foreground text-xs grid place-items-center font-semibold">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">
                  {conv.lastMessage.content}
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Clock className="size-2.5" />
                  {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </button>
            ))
          )}
        </div>
      </Card>

      {/* Right: message thread */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedOtherId ? (
          <Card className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="size-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Select a conversation to read</p>
              <p className="text-sm mt-1">
                Browse CHWs and Parents on the left, then pick a conversation
              </p>
            </div>
          </Card>
        ) : (
          <Card className="flex-1 flex flex-col overflow-hidden">
            {/* Thread header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-primary/10 text-primary grid place-items-center font-semibold text-sm">
                  {selectedUser?.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-sm">{selectedUser?.name}</div>
                  <div className="text-xs text-muted-foreground">
                    ↔ {otherUser?.name ?? `User #${selectedOtherId}`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => thread.refetch()}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                title="Refresh"
              >
                <RefreshCw className={`size-4 ${thread.isFetching ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {thread.isPending ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                    <div className="h-9 w-48 bg-muted animate-pulse rounded-2xl" />
                  </div>
                ))
              ) : (thread.data ?? []).length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground py-10">
                  No messages in this conversation
                </div>
              ) : (
                (thread.data ?? []).map((msg) => {
                  const isFromSelected = msg.senderId === selectedUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isFromSelected ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-sm rounded-2xl px-4 py-2.5 ${
                          isFromSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <div className="text-sm leading-relaxed">{msg.content}</div>
                        <div
                          className={`flex items-center justify-end gap-1 mt-1 ${
                            isFromSelected
                              ? "text-primary-foreground/60"
                              : "text-muted-foreground"
                          } text-xs`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {isFromSelected && (
                            <CheckCheck className={`size-3 ${msg.isRead ? "text-blue-300" : ""}`} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Info footer */}
            <div className="px-5 py-3 border-t bg-muted/30 text-xs text-muted-foreground flex items-center gap-2">
              <AlertCircle className="size-3.5 shrink-0" />
              Admin view is read-only. Messages are polled every 5 seconds.
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
