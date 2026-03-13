import { Mic, Square } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface VoiceRecorderProps {
  onAudioRecorded: (audioBlob: Blob) => void | Promise<void>;
  onUploadStateChange?: (state: "idle" | "recording" | "uploading" | "error") => void;
}

const VoiceRecorder = ({ onAudioRecorded, onUploadStateChange }: VoiceRecorderProps) => {
  const [recording, setRecording] = useState(false);
  const [bars, setBars] = useState<number[]>(Array(12).fill(4));
  const [busy, setBusy] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

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

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      stream.getTracks().forEach((track) => track.stop());
      setBusy(true);
      onUploadStateChange?.("uploading");
      try {
        await onAudioRecorded(blob);
        onUploadStateChange?.("idle");
      } catch {
        onUploadStateChange?.("error");
      } finally {
        setBusy(false);
      }
    };

    recorder.start();
    setRecording(true);
    onUploadStateChange?.("recording");
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const toggle = async () => {
    if (recording) {
      stopRecording();
    } else {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        onUploadStateChange?.("error");
        return;
      }
      await startRecording();
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
        disabled={busy}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
          recording
            ? "bg-destructive text-destructive-foreground"
            : "bg-accent text-accent-foreground hover:bg-accent/80"
        } disabled:opacity-50`}
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
