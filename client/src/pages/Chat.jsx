import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useSearchParams, Link } from "react-router-dom";
import API from "../api";
import socket from "../socket";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ChatSidebarSkeleton, ChatMessagesSkeleton } from "../components/SkeletonLoaders";
import { Button, Card } from "../components/ui";
import { 
  MessageSquare, 
  Send, 
  User, 
  Clock, 
  ShieldAlert,
  MessageCircle
} from "lucide-react";

const Chat = () => {
  const { user } = useSelector((state) => state.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const directFreelancerId = searchParams.get("freelancerId");
  const directClientId = searchParams.get("clientId");

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [targetUserStatus, setTargetUserStatus] = useState("offline");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    socket.auth = {
      token: localStorage.getItem("token")
    };
    socket.connect();
    socket.emit("join");

    const handleReceiveMessage = (data) => {
      if (activeConversation && data.conversationId === activeConversation._id) {
        // Deduplicate: the sender already appended via the REST response;
        // only append if this _id hasn't been seen yet.
        setMessages((prev) => {
          if (data._id && prev.some((m) => m._id === data._id)) return prev;
          return [...prev, data];
        });
      } else {
        setConversations((prev) =>
          prev.map((c) =>
            c._id === data.conversationId
              ? { ...c, lastMessage: data.message, lastMessageAt: new Date(), unreadCount: (c.unreadCount || 0) + 1 }
              : c
          )
        );
        toast(`New message from ${data.sender.name}: ${data.message.substring(0, 30)}...`, {
          icon: "✉️",
        });
      }
    };

    const handleUserStatus = (data) => {
      if (activeConversation) {
        const recipient = user.role === "client" ? activeConversation.freelancer : activeConversation.client;
        if (recipient?.user?._id === data.userId) {
          setTargetUserStatus(data.status);
        }
      }
    };

    const handleTyping = (data) => {
      if (activeConversation && data.conversationId === activeConversation._id) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = (data) => {
      if (activeConversation && data.conversationId === activeConversation._id) {
        setIsTyping(false);
      }
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("user_status", handleUserStatus);
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("user_status", handleUserStatus);
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
      socket.disconnect();
    };
  }, [user, activeConversation]);

  useEffect(() => {
    if (activeConversation && user) {
      const recipient = user.role === "client" ? activeConversation.freelancer : activeConversation.client;
      const receiverUserId = recipient?.user?._id;
      if (receiverUserId) {
        socket.emit("check_online", receiverUserId);
      }
      setIsTyping(false);
      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeConversation._id ? { ...c, unreadCount: 0 } : c
        )
      );
    }
  }, [activeConversation, user]);

  const handleInputChange = (e) => {
    setMessageText(e.target.value);

    if (!activeConversation || !user) return;
    const recipient = user.role === "client" ? activeConversation.freelancer : activeConversation.client;
    const receiverUserId = recipient?.user?._id;
    if (!receiverUserId) return;

    socket.emit("typing", {
      conversationId: activeConversation._id,
      receiverUserId
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", {
        conversationId: activeConversation._id,
        receiverUserId
      });
    }, 2000);
  };

  const loadConversations = async (selectId = null) => {
    try {
      setLoading(true);
      const res = await API.get("/chat/conversations");
      setConversations(res.data.conversations);

      if (selectId) {
        const found = res.data.conversations.find((c) => c._id === selectId);
        if (found) setActiveConversation(found);
      } else if (res.data.conversations.length > 0 && !activeConversation) {
        setActiveConversation(res.data.conversations[0]);
      }
    } catch (err) {
      toast.error("Failed to load chat conversations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    const handleDirectMessageCreation = async () => {
      if (directFreelancerId || directClientId) {
        const receiverId = directFreelancerId || directClientId;
        try {
          // Find or create a conversation without injecting a fake message.
          // Pass an empty message string — the backend now handles this gracefully
          // by returning the conversation without creating a Message document.
          const res = await API.post("/chat/messages", { receiverId, message: "" });
          if (res.data.success) {
            const convId = res.data.conversationId || res.data.message?.conversation;
            await loadConversations(convId);
            setSearchParams({});
          }
        } catch (err) {
          toast.error("Failed to initialize conversation");
        }
      } else {
        loadConversations();
      }
    };

    handleDirectMessageCreation();
  }, [user, directFreelancerId, directClientId]);

  useEffect(() => {
    if (activeConversation) {
      const loadMessages = async () => {
        try {
          const res = await API.get(`/chat/messages/${activeConversation._id}`);
          setMessages(res.data.messages);
        } catch (err) {
          toast.error("Failed to load messages history");
        }
      };
      loadMessages();
    }
  }, [activeConversation]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConversation) return;

    const recipient = user.role === "client" ? activeConversation.freelancer : activeConversation.client;
    const receiverUserId = recipient?.user?._id;

    try {
      const res = await API.post("/chat/messages", {
        conversationId: activeConversation._id,
        receiverId: recipient._id,
        message: messageText,
      });

      if (res.data.success) {
        const sentMessage = res.data.message;
        setMessages((prev) => [...prev, sentMessage]);
        setMessageText("");

        socket.emit("send_message", {
          conversationId: activeConversation._id,
          sender: {
            _id: user._id,
            name: user.name,
          },
          receiverUserId,
          message: sentMessage.message,
          createdAt: sentMessage.createdAt,
        });

        setConversations((prev) =>
          prev.map((c) =>
            c._id === activeConversation._id
              ? { ...c, lastMessage: sentMessage.message, lastMessageAt: sentMessage.createdAt }
              : c
          )
        );
      }
    } catch (err) {
      toast.error("Failed to send message");
    }
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="chat-workspace-container" style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
        <div className="chat-page-wrapper" style={{ height: "calc(100vh - 150px)" }}>
          <Card className="chat-sidebar-card" style={{ display: "flex", flexDirection: "column", padding: 0 }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px" }}>
              <MessageSquare size={18} style={{ color: "var(--accent)" }} />
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Recent Chats</h3>
            </div>
            <ChatSidebarSkeleton />
          </Card>
          <Card className="chat-window-card" style={{ display: "flex", flexDirection: "column", padding: "24px" }}>
            <ChatMessagesSkeleton />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-workspace-container" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div className="chat-page-wrapper" style={{ height: "calc(100vh - 150px)" }}>
        {/* Left Side Conversations List */}
        <Card className="chat-sidebar-card" style={{ display: "flex", flexDirection: "column", padding: 0 }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px" }}>
            <MessageSquare size={18} style={{ color: "var(--accent)" }} />
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Recent Chats</h3>
          </div>
          
          <div style={{ flexGrow: 1, overflowY: "auto" }}>
            {conversations.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-secondary)", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                <MessageSquare size={32} style={{ opacity: 0.3 }} />
                <p style={{ margin: 0, fontSize: "13.5px" }}>No active chats.</p>
                <Link to="/marketplace" className="btn btn-secondary btn-small" style={{ fontSize: "12px", padding: "6px 12px" }}>
                  Find Opportunities
                </Link>
              </div>
            ) : (
              conversations.map((conv) => {
                const partner = user.role === "client" ? conv.freelancer : conv.client;
                const isActive = activeConversation && activeConversation._id === conv._id;

                return (
                  <div
                    key={conv._id}
                    className={`conv-item ${isActive ? "active" : ""}`}
                    onClick={() => setActiveConversation(conv)}
                    style={{ transition: "background 0.2s" }}
                  >
                    <div className="chat-avatar-placeholder" style={{ flexShrink: 0 }}>
                      {partner?.user?.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div style={{ minWidth: 0, flexGrow: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                        <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {partner?.user?.name || "User"}
                        </span>
                        {conv.unreadCount > 0 && (
                          <span style={{ background: "var(--accent)", color: "#fff", fontSize: "10px", fontWeight: "bold", padding: "2px 6px", borderRadius: "10px", display: "inline-block", lineHeight: 1 }}>
                            {conv.unreadCount}
                          </span>
                        )}
                        <span style={{ fontSize: "10.5px", color: "var(--text-secondary)", textTransform: "capitalize" }}>
                          {user.role === "client" ? "Freelancer" : "Client"}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: "12.5px", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {conv.lastMessage || "No messages yet"}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Right Side Chat Window */}
        <main className="chat-window" style={{ flexGrow: 1, display: "flex", minWidth: 0 }}>
          <Card style={{ display: "flex", flexDirection: "column", padding: 0, width: "100%", height: "100%" }}>
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <header style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div className="chat-avatar-placeholder" style={{ width: "38px", height: "38px", fontSize: "15px" }}>
                      {(user.role === "client" ? activeConversation.freelancer : activeConversation.client)?.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>
                        {(user.role === "client" ? activeConversation.freelancer : activeConversation.client)?.user?.name}
                      </h4>
                      <span style={{ fontSize: "11px", color: isTyping ? "var(--accent)" : targetUserStatus === "online" ? "var(--success)" : "var(--text-secondary)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ 
                          width: "6px", 
                          height: "6px", 
                          background: isTyping ? "var(--accent)" : targetUserStatus === "online" ? "var(--success)" : "var(--text-secondary)", 
                          borderRadius: "50%" 
                        }}></span>
                        <span>{isTyping ? "Typing..." : targetUserStatus === "online" ? "Online" : "Offline"}</span>
                      </span>
                    </div>
                  </div>
                </header>

                {/* Messages Body */}
                <div style={{ flexGrow: 1, padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
                  {messages.length === 0 ? (
                    <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-secondary)" }}>
                      <MessageCircle size={32} style={{ opacity: 0.3, marginBottom: "8px" }} />
                      <p style={{ margin: 0, fontSize: "13.5px" }}>Start of the thread. Send a message to get in touch!</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isOwnMessage = msg.sender?._id === user._id || msg.sender === user._id;
                      return (
                        <div 
                          key={index} 
                          style={{ 
                            display: "flex", 
                            justifyContent: isOwnMessage ? "flex-end" : "flex-start",
                            alignItems: "flex-end",
                            gap: "8px" 
                          }}
                        >
                          {!isOwnMessage && (
                            <div className="chat-avatar-placeholder" style={{ width: "28px", height: "28px", fontSize: "11px", flexShrink: 0 }}>
                              {msg.sender?.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div
                            style={{
                              maxWidth: "70%",
                              background: isOwnMessage ? "var(--accent)" : "var(--secondary-bg)",
                              border: isOwnMessage ? "none" : "1px solid var(--border)",
                              color: isOwnMessage ? "#ffffff" : "var(--text-primary)",
                              padding: "10px 14px",
                              borderRadius: isOwnMessage ? "12px 12px 0 12px" : "12px 12px 12px 0",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                              textAlign: "left"
                            }}
                          >
                            <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.5", wordBreak: "break-word", color: isOwnMessage ? "#ffffff" : "var(--text-primary)" }}>{msg.message}</p>
                            <span style={{ display: "block", textAlign: "right", fontSize: "10px", opacity: isOwnMessage ? 0.85 : 0.7, marginTop: "4px", color: isOwnMessage ? "rgba(255,255,255,0.9)" : "var(--text-secondary)" }}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Typing Box */}
                <form onSubmit={handleSendMessage} style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: "12px" }}>
                  <input
                    type="text"
                    placeholder="Type your message here..."
                    value={messageText}
                    onChange={handleInputChange}
                    className="input-field"
                    style={{ flexGrow: 1 }}
                    required
                  />
                  <Button type="submit" icon={<Send size={14} />}>
                    Send
                  </Button>
                </form>
              </>
            ) : (
              <div className="premium-empty-state" style={{ minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
                <MessageSquare size={48} style={{ opacity: 0.3, color: "var(--text-secondary)", margin: "0 auto 16px auto" }} />
                <h4 style={{ margin: "0 0 8px 0", color: "var(--text-primary)" }}>No discussion active</h4>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>Choose an active chat thread from the left list to communicate in real time.</p>
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Chat;
