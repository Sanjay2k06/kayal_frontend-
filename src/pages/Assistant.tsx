import { useState, useRef, useEffect } from "react";
import { Send, History, Bookmark, ChevronLeft, ChevronRight } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import SchemeCard, { Scheme } from "@/components/SchemeCard";
import VoiceRecorder from "@/components/VoiceRecorder";
import Navbar from "@/components/Navbar";
import { chatQuery, getChatHistory, submitVoiceQuery } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  schemes?: Scheme[];
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Welcome to CiviX. I can help you discover government welfare schemes tailored to your profile. Tell me about yourself — your occupation, income range, location, and any specific needs — and I will find the most relevant schemes for you.",
  },
];

const Assistant = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarHistory, setSidebarHistory] = useState<string[]>([]);
  const [lastVoiceBlob, setLastVoiceBlob] = useState<Blob | null>(null);
  const [voiceState, setVoiceState] = useState<"idle" | "recording" | "uploading" | "error">("idle");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!isAuthenticated()) return;
      try {
        const history = await getChatHistory();
        setSidebarHistory(history.map((item) => item.query));
      } catch {
        setSidebarHistory([]);
      }
    };
    void loadHistory();
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const ai = await chatQuery(text.trim());
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: ai.response,
        schemes: ai.recommended_schemes,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I could not process your request right now. Please try again.",
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceMessage = async (audio: Blob) => {
    setLastVoiceBlob(audio);
    setIsTyping(true);
    try {
      const result = await submitVoiceQuery(audio);

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: result.query,
      };
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.response,
        schemes: result.recommended_schemes,
      };
      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setLastVoiceBlob(null);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Voice query failed. Please try again or type your question.",
        },
      ]);
      setVoiceState("error");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`flex-shrink-0 border-r bg-card transition-all duration-300 ${
            sidebarOpen ? "w-64" : "w-0 overflow-hidden"
          }`}
        >
          <div className="flex h-full w-64 flex-col p-4">
            <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
              <History size={14} /> Recent Queries
            </h3>
            <div className="mt-3 space-y-1">
              {sidebarHistory.map((h) => (
                <button
                  key={h}
                  onClick={() => setInput(h)}
                  className="w-full truncate rounded-md px-3 py-2 text-left text-sm text-foreground/70 transition-colors hover:bg-muted"
                >
                  {h}
                </button>
              ))}
            </div>
            <div className="mt-6">
              <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                <Bookmark size={14} /> Saved Schemes
              </h3>
              <p className="mt-2 px-3 text-xs text-muted-foreground">
                No saved schemes yet.
              </p>
            </div>
          </div>
        </aside>

        {/* Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex-shrink-0 border-r bg-card px-1 text-muted-foreground hover:text-foreground"
        >
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Chat area */}
        <main className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-2xl space-y-4">
              {messages.map((msg) => (
                <div key={msg.id}>
                  <ChatMessage role={msg.role} content={msg.content} />
                  {msg.schemes && (
                    <div className="mt-3 space-y-3 pl-0 md:pl-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cited schemes</p>
                      {msg.schemes.map((s, i) => (
                        <SchemeCard key={s.id} scheme={s} index={i} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isTyping && <ChatMessage role="assistant" content="" isTyping />}
              <div ref={endRef} />
            </div>
          </div>

          {/* Input */}
          <div className="border-t bg-card p-4">
            <div className="mx-auto flex max-w-2xl items-center gap-3">
              <VoiceRecorder onAudioRecorded={handleVoiceMessage} onUploadStateChange={setVoiceState} />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder="Ask about government schemes..."
                className="flex-1 rounded-lg border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </div>
            <div className="mx-auto mt-2 flex max-w-2xl items-center justify-between text-xs text-muted-foreground">
              <span>
                {voiceState === "recording" && "Recording voice..."}
                {voiceState === "uploading" && "Uploading voice query..."}
                {voiceState === "error" && "Voice upload failed."}
                {voiceState === "idle" && ""}
              </span>
              {voiceState === "error" && lastVoiceBlob && (
                <button
                  type="button"
                  onClick={() => void handleVoiceMessage(lastVoiceBlob)}
                  className="rounded border px-2 py-1 hover:bg-muted"
                >
                  Retry Voice Upload
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Assistant;
