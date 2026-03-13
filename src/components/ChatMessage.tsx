import { motion } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isTyping?: boolean;
}

const ChatMessage = ({ role, content, isTyping }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const isUser = role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`group relative max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "border bg-card text-card-foreground"
        }`}
      >
        {isTyping ? (
          <div className="flex items-center gap-1.5 py-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:0ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:150ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:300ms]" />
          </div>
        ) : (
          <>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
            {!isUser && (
              <button
                onClick={handleCopy}
                className="absolute -bottom-3 right-2 rounded-md bg-muted p-1 opacity-0 transition-opacity group-hover:opacity-100"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
              </button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default ChatMessage;
