import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Volume2, Sparkles, X, RefreshCw, AlertCircle, Radio, Heart } from "lucide-react";

interface VoiceConversationProps {
  onClose?: () => void;
}

export default function VoiceConversation({ onClose }: VoiceConversationProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [statusText, setStatusText] = useState("Click to start voice chat with Islamic Companion");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  const startSession = async () => {
    try {
      setIsConnecting(true);
      setErrorMessage(null);
      setStatusText("Connecting to Islamic Voice Companion...");

      // 1. Initialize Web Audio Context
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx({ sampleRate: 24000 });
      audioCtxRef.current = audioCtx;
      nextStartTimeRef.current = audioCtx.currentTime;

      // 2. Request Microphone Access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      // 3. Connect WebSocket to /live endpoint
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setStatusText("Connected! Say Assalamu Alaikum or ask any question...");

        // Setup microphone capture pipeline
        const micSource = audioCtx.createMediaStreamSource(stream);
        // Using ScriptProcessorNode for wide browser compatibility
        const processor = audioCtx.createScriptProcessor(2048, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
          if (isMuted) return;

          const inputData = e.inputBuffer.getChannelData(0);
          // Downsample / convert Float32 [-1.0, 1.0] to 16-bit PCM Int16
          const pcm16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }

          // Convert to Base64 string
          const bytes = new Uint8Array(pcm16.buffer);
          let binary = "";
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);

          wsRef.current.send(JSON.stringify({ audio: base64 }));
        };

        micSource.connect(processor);
        processor.connect(audioCtx.destination);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.error) {
            setErrorMessage(data.error);
            setStatusText("Error in voice session.");
            return;
          }

          if (data.interrupted) {
            setIsSpeaking(false);
            setStatusText("Listening...");
            return;
          }

          if (data.audio) {
            playAudioChunk(data.audio);
          }

          if (data.text) {
            setTranscript((prev) => [...prev, `AI: ${data.text}`]);
          }
        } catch (err) {
          console.error("Error processing server message:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        setErrorMessage("Connection error. Please try again.");
        setIsConnecting(false);
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        setStatusText("Session closed.");
      };
    } catch (err: any) {
      console.error("Error starting live session:", err);
      setErrorMessage(err.message || "Failed to access microphone or connect.");
      setIsConnecting(false);
      setIsConnected(false);
    }
  };

  const playAudioChunk = (base64Audio: string) => {
    if (!audioCtxRef.current) return;
    try {
      setIsSpeaking(true);
      setStatusText("Islamic Companion is speaking...");

      // Convert base64 to ArrayBuffer
      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      // 16-bit PCM Int16 to Float32
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioCtx = audioCtxRef.current;
      const audioBuffer = audioCtx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);

      const currentTime = audioCtx.currentTime;
      const startTime = Math.max(currentTime, nextStartTimeRef.current);
      source.start(startTime);
      nextStartTimeRef.current = startTime + audioBuffer.duration;

      source.onended = () => {
        if (audioCtx.currentTime >= nextStartTimeRef.current) {
          setIsSpeaking(false);
          setStatusText("Listening to you...");
        }
      };
    } catch (err) {
      console.error("Error playing audio chunk:", err);
    }
  };

  const stopSession = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setIsSpeaking(false);
    setStatusText("Voice conversation ended.");
  };

  return (
    <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-500/30 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-emerald-500/20 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl text-emerald-300">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight">Live Voice Companion</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-900 uppercase">
                Gemini 3.1 Live
              </span>
            </div>
            <p className="text-xs text-emerald-200/80">Real-time bilingual voice chat for children & families</p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Interactive Stage */}
      <div className="py-10 flex flex-col items-center justify-center space-y-6 relative z-10">
        {/* Animated Avatar / Visualizer Pulse */}
        <div className="relative flex items-center justify-center">
          {isConnected && (
            <>
              <motion.div
                animate={{
                  scale: isSpeaking ? [1, 1.25, 1] : [1, 1.1, 1],
                  opacity: isSpeaking ? [0.6, 0.2, 0.6] : [0.3, 0.1, 0.3],
                }}
                transition={{ repeat: Infinity, duration: isSpeaking ? 1.2 : 2.5 }}
                className="absolute w-44 h-44 rounded-full bg-emerald-400/30 blur-md"
              />
              <motion.div
                animate={{
                  scale: isSpeaking ? [1, 1.4, 1] : [1, 1.15, 1],
                  opacity: [0.4, 0.1, 0.4],
                }}
                transition={{ repeat: Infinity, duration: isSpeaking ? 1.5 : 3 }}
                className="absolute w-56 h-56 rounded-full bg-teal-400/20 blur-lg"
              />
            </>
          )}

          <div
            className={`w-32 h-32 rounded-full flex items-center justify-center border-4 transition-all duration-500 shadow-2xl relative z-10 ${
              isConnected
                ? isSpeaking
                  ? "bg-gradient-to-br from-amber-400 to-amber-500 border-amber-300 text-slate-900 scale-105"
                  : "bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-300 text-white"
                : "bg-slate-800 border-slate-700 text-slate-400"
            }`}
          >
            {isConnecting ? (
              <RefreshCw className="w-12 h-12 animate-spin text-amber-300" />
            ) : isConnected ? (
              isSpeaking ? (
                <Radio className="w-12 h-12 animate-pulse" />
              ) : (
                <Mic className="w-12 h-12" />
              )
            ) : (
              <MicOff className="w-12 h-12" />
            )}
          </div>
        </div>

        {/* Status Indicator Pill */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-emerald-100 backdrop-blur-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected
                  ? isSpeaking
                    ? "bg-amber-400 animate-ping"
                    : "bg-emerald-400 animate-pulse"
                  : "bg-slate-500"
              }`}
            />
            {statusText}
          </div>

          {errorMessage && (
            <div className="flex items-center gap-1.5 text-xs text-rose-300 bg-rose-500/20 border border-rose-500/30 px-3 py-1 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMessage}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center justify-center pt-2">
          {!isConnected ? (
            <button
              onClick={startSession}
              disabled={isConnecting}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold text-sm shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 cursor-pointer transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              <Mic className="w-5 h-5" /> Start Live Voice Conversation
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                  isMuted
                    ? "bg-rose-500/30 border-rose-400 text-rose-200"
                    : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                }`}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isMuted ? "Unmute Mic" : "Mute Mic"}
              </button>

              <button
                onClick={stopSession}
                className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                End Voice Chat
              </button>
            </>
          )}
        </div>
      </div>

      {/* Suggested prompts for kids */}
      <div className="mt-6 pt-6 border-t border-emerald-500/20 text-xs">
        <span className="font-bold text-emerald-300 block mb-2">Try saying to your Companion:</span>
        <div className="flex flex-wrap gap-2">
          {[
            '"Assalamu Alaikum! Tell me a story about Prophet Nuh (AS)."',
            '"Why do Muslims pray 5 times a day?"',
            '"Teach me a short Dua for waking up in Urdu & English."',
            '"What is the moral lesson of Prophet Ibrahim (AS)?"',
          ].map((promptText, idx) => (
            <span
              key={idx}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-emerald-100/90 hover:bg-white/10 transition-colors"
            >
              {promptText}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
