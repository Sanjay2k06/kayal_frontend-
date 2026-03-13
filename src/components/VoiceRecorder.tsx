import { Mic, Square } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
}

const VoiceRecorder = ({ onTranscript }: VoiceRecorderProps) => {
  const [recording, setRecording] = useState(false);
  const [bars, setBars] = useState<number[]>(Array(12).fill(4));
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (recording) {
      intervalRef.current = setInterval(() => {
        setBars(Array.from({ length: 12 }, () => Math.random() * 24 + 4));
      }, 120);
    } else {
      clearInterval(intervalRef.current);
      setBars(Array(12).fill(4));
    }
    return () => clearInterval(intervalRef.current);
  }, [recording]);

  const toggle = () => {
    if (recording) {
      setRecording(false);
      // Simulate transcript
      onTranscript("What government schemes am I eligible for as a farmer in Maharashtra?");
    } else {
      setRecording(true);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {recording && (
        <div className="flex items-end gap-0.5">
          {bars.map((h, i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-accent transition-all duration-100"
              style={{ height: h }}
            />
          ))}
        </div>
      )}
      <button
        onClick={toggle}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
          recording
            ? "bg-destructive text-destructive-foreground"
            : "bg-accent text-accent-foreground hover:bg-accent/80"
        }`}
      >
        {recording && (
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-destructive/40" />
        )}
        {recording ? <Square size={16} /> : <Mic size={16} />}
      </button>
    </div>
  );
};

export default VoiceRecorder;
