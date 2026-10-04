import React, { useEffect, useState } from 'react';
import { X, Flame, EyeOff, ShieldAlert, Timer } from 'lucide-react';
import { Haptics } from '../utils/haptics';

interface DisappearingMediaModalProps {
  isOpen: boolean;
  mediaUrl: string;
  senderName: string;
  durationSeconds?: number;
  isViewOnce?: boolean;
  onCloseAndBurn: () => void;
}

export const DisappearingMediaModal: React.FC<DisappearingMediaModalProps> = ({
  isOpen,
  mediaUrl,
  senderName,
  durationSeconds = 10,
  isViewOnce = true,
  onCloseAndBurn,
}) => {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [isBurning, setIsBurning] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTimeLeft(durationSeconds);
    setIsBurning(false);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, durationSeconds]);

  const handleDismiss = () => {
    Haptics.tap();
    onCloseAndBurn();
  };

  if (!isOpen) return null;

  const progressPercent = (timeLeft / durationSeconds) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 animate-in fade-in select-none">
      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-20">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
            {isViewOnce ? <EyeOff className="h-4 w-4" /> : <Timer className="h-4 w-4" />}
          </div>
          <div>
            <h3 className="text-sm font-semibold">
              {isViewOnce ? 'View-Once Encrypted Media' : 'Disappearing Media'}
            </h3>
            <p className="text-[11px] text-[#8696a0]">From {senderName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Circular Countdown Timer */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#202c33] border border-[#2a3942] text-xs font-mono text-amber-400">
            <Flame className="h-3.5 w-3.5 animate-pulse text-amber-400" />
            <span>{timeLeft}s</span>
          </div>

          <button
            onClick={handleDismiss}
            className="p-2 rounded-full bg-[#202c33] hover:bg-[#2a3942] text-[#8696a0] hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#202c33] z-30">
        <div
          className="h-full bg-amber-400 transition-all duration-1000 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Media Content with Burn Dissolve Animation */}
      <div
        className={`relative max-w-2xl max-h-[75vh] rounded-2xl overflow-hidden shadow-2xl transition-all duration-700 ${
          isBurning
            ? 'scale-90 opacity-0 blur-xl filter brightness-200'
            : 'scale-100 opacity-100'
        }`}
      >
        <img
          src={mediaUrl}
          alt="Confidential View-Once"
          className="w-full h-full object-contain pointer-events-none"
          onContextMenu={(e) => e.preventDefault()}
        />

        {/* Security Watermark Protection */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-15">
          <p className="text-2xl font-bold tracking-widest text-white rotate-[-25deg] select-none">
            WHISPERPULSE CONFIDENTIAL • NO SCREENSHOTS
          </p>
        </div>
      </div>

      {/* Bottom Warning Notice */}
      <div className="absolute bottom-6 left-6 right-6 text-center z-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111b21]/90 border border-[#202c33] text-xs text-[#8696a0]">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
          <span>
            {isViewOnce
              ? 'This photo will self-destruct once closed and cannot be re-opened.'
              : `Disappearing in ${timeLeft} seconds.`}
          </span>
        </div>
      </div>
    </div>
  );
};
