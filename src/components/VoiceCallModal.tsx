import React, { useEffect, useRef, useState } from 'react';
import {
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ShieldCheck,
  Pause,
  Play,
  Sparkles,
  Send,
} from 'lucide-react';
import { CallSession } from '../types/chat';
import {
  playRingingTone,
  playCallConnectedChime,
  playCallEndedTone,
  stopCallAudio,
  playBase64Audio,
} from '../utils/audioCallManager';
import { Haptics } from '../utils/haptics';

interface VoiceCallModalProps {
  session: CallSession;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onToggleHold: () => void;
  onOpenSafetyCode: () => void;
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({
  session,
  onEndCall,
  onToggleMute,
  onToggleSpeaker,
  onToggleHold,
  onOpenSafetyCode,
}) => {
  const [callDuration, setCallDuration] = useState(0);
  const [userSpeechInput, setUserSpeechInput] = useState('');
  const [isAiReplying, setIsAiReplying] = useState(false);
  const [transcriptHistory, setTranscriptHistory] = useState<
    Array<{ speaker: string; text: string }>
  >([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Play ringing or chime based on status
  useEffect(() => {
    if (session.status === 'ringing' || session.status === 'calling') {
      playRingingTone();
    } else if (session.status === 'connected') {
      stopCallAudio();
      playCallConnectedChime();
    }

    return () => {
      stopCallAudio();
    };
  }, [session.status]);

  // Call duration counter
  useEffect(() => {
    let interval: any;
    if (session.status === 'connected' && !session.isHold) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [session.status, session.isHold]);

  // Audio Waveform Visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isMuted = session.isMuted || session.isHold;
      const waveCount = 28;
      const barWidth = canvas.width / waveCount;

      for (let i = 0; i < waveCount; i++) {
        const amplitude = isMuted
          ? 4
          : Math.sin(phase + i * 0.4) * 22 + (isAiReplying ? 28 : 12);
        const barHeight = Math.max(4, Math.abs(amplitude));
        const x = i * barWidth;
        const y = (canvas.height - barHeight) / 2;

        ctx.fillStyle = isMuted
          ? '#8696a0'
          : isAiReplying
          ? '#25d366'
          : '#00a884';
        ctx.beginPath();
        ctx.roundRect(x + 2, y, barWidth - 4, barHeight, 4);
        ctx.fill();
      }

      phase += 0.12;
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [session.isMuted, session.isHold, isAiReplying]);

  // Format call duration
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const handleSendVoiceTurn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userSpeechInput.trim() || isAiReplying) return;

    const userText = userSpeechInput.trim();
    setUserSpeechInput('');
    setTranscriptHistory((prev) => [
      ...prev,
      { speaker: 'You', text: userText },
    ]);
    setIsAiReplying(true);
    Haptics.tap();

    try {
      const res = await fetch('/api/voice-call-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userTranscript: userText,
          callerName: session.contactName,
          chatContext: transcriptHistory.map((t) => ({
            role: t.speaker === 'You' ? 'user' : 'model',
            content: t.text,
          })),
        }),
      });

      const data = await res.json();
      if (data.replyText) {
        setTranscriptHistory((prev) => [
          ...prev,
          { speaker: session.contactName, text: data.replyText },
        ]);
      }
      if (data.audio) {
        playBase64Audio(data.audio, () => {
          setIsAiReplying(false);
        });
      } else {
        setIsAiReplying(false);
      }
    } catch (err) {
      console.error('Failed to get voice turn:', err);
      setIsAiReplying(false);
    }
  };

  const handleEnd = () => {
    stopCallAudio();
    playCallEndedTone();
    Haptics.disappearingBurn();
    onEndCall();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-md h-[90vh] max-h-[760px] rounded-3xl bg-[#111b21] border border-[#202c33] flex flex-col justify-between overflow-hidden shadow-2xl text-[#e9edef]">
        {/* Top Header */}
        <div className="pt-8 px-6 text-center z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#202c33] border border-[#2a3942] text-xs text-[#00a884] mb-4">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>End-to-End Encrypted Call</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">
            {session.contactName}
          </h2>
          <p className="text-sm text-[#8696a0]">
            {session.status === 'connected'
              ? session.isHold
                ? 'Call On Hold'
                : formatTime(callDuration)
              : session.status === 'ringing'
              ? 'Ringing...'
              : 'Connecting encrypted line...'}
          </p>
        </div>

        {/* Center Waveform & Avatar */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-4">
          <div className="relative mb-6">
            <div
              className={`h-32 w-32 rounded-full overflow-hidden border-4 ${
                isAiReplying
                  ? 'border-[#00a884] shadow-lg shadow-[#00a884]/30 scale-105'
                  : 'border-[#202c33]'
              } transition-all duration-300`}
            >
              <img
                src={session.contactAvatar}
                alt={session.contactName}
                className="h-full w-full object-cover"
              />
            </div>
            {isAiReplying && (
              <span className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-[#00a884] text-[#111b21]">
                <Sparkles className="h-4 w-4 animate-spin" />
              </span>
            )}
          </div>

          {/* Dynamic Audio Waveform */}
          <div className="w-full max-w-[280px] h-14 mb-4">
            <canvas
              ref={canvasRef}
              width={280}
              height={56}
              className="w-full h-full"
            />
          </div>

          {/* Live Call Conversation & AI Voice Simulation */}
          <div className="w-full bg-[#202c33]/60 rounded-xl p-3 border border-[#2a3942]/60 max-h-36 overflow-y-auto mb-2 text-xs">
            {transcriptHistory.length === 0 ? (
              <p className="text-[#8696a0] text-center italic py-2">
                Speak or type below to chat in this encrypted call. AI synthesizes responses using Gemini 3.8 Flash TTS.
              </p>
            ) : (
              transcriptHistory.slice(-3).map((item, idx) => (
                <div key={idx} className="mb-1.5 last:mb-0">
                  <span
                    className={
                      item.speaker === 'You'
                        ? 'text-[#00a884] font-medium'
                        : 'text-emerald-400 font-medium'
                    }
                  >
                    {item.speaker}:
                  </span>{' '}
                  <span className="text-[#d1d7db]">{item.text}</span>
                </div>
              ))
            )}
            {isAiReplying && (
              <p className="text-[#00a884] italic animate-pulse">
                {session.contactName} is speaking...
              </p>
            )}
          </div>

          {/* Voice Input Box */}
          <form
            onSubmit={handleSendVoiceTurn}
            className="w-full flex items-center gap-2"
          >
            <input
              type="text"
              value={userSpeechInput}
              onChange={(e) => setUserSpeechInput(e.target.value)}
              placeholder="Say something into the call..."
              className="flex-1 px-3 py-2 text-xs rounded-full bg-[#202c33] border border-[#2a3942] text-white focus:outline-none focus:border-[#00a884]"
            />
            <button
              type="submit"
              disabled={!userSpeechInput.trim() || isAiReplying}
              className="p-2 rounded-full bg-[#00a884] text-[#111b21] disabled:opacity-40 hover:bg-[#02906f] transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>

        {/* Action Controls */}
        <div className="pb-8 px-6 bg-gradient-to-t from-[#0b141a] to-transparent pt-6">
          <div className="grid grid-cols-4 gap-4 mb-6">
            {/* Mute */}
            <button
              onClick={() => {
                Haptics.tap();
                onToggleMute();
              }}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-colors ${
                session.isMuted
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-[#202c33] text-[#e9edef] hover:bg-[#2a3942]'
              }`}
            >
              {session.isMuted ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
              <span className="text-[11px]">
                {session.isMuted ? 'Muted' : 'Mute'}
              </span>
            </button>

            {/* Speaker */}
            <button
              onClick={() => {
                Haptics.tap();
                onToggleSpeaker();
              }}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-colors ${
                session.isSpeakerOn
                  ? 'bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/30'
                  : 'bg-[#202c33] text-[#e9edef] hover:bg-[#2a3942]'
              }`}
            >
              {session.isSpeakerOn ? (
                <Volume2 className="h-5 w-5" />
              ) : (
                <VolumeX className="h-5 w-5" />
              )}
              <span className="text-[11px]">Speaker</span>
            </button>

            {/* Hold */}
            <button
              onClick={() => {
                Haptics.tap();
                onToggleHold();
              }}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-colors ${
                session.isHold
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-[#202c33] text-[#e9edef] hover:bg-[#2a3942]'
              }`}
            >
              {session.isHold ? (
                <Play className="h-5 w-5" />
              ) : (
                <Pause className="h-5 w-5" />
              )}
              <span className="text-[11px]">
                {session.isHold ? 'Resume' : 'Hold'}
              </span>
            </button>

            {/* Safety Code */}
            <button
              onClick={() => {
                Haptics.tap();
                onOpenSafetyCode();
              }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[#202c33] text-[#e9edef] hover:bg-[#2a3942] transition-colors"
            >
              <ShieldCheck className="h-5 w-5 text-[#00a884]" />
              <span className="text-[11px]">Verify</span>
            </button>
          </div>

          {/* End Call Button */}
          <div className="flex justify-center">
            <button
              onClick={handleEnd}
              className="h-16 w-16 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-transform"
            >
              <PhoneOff className="h-7 w-7" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
