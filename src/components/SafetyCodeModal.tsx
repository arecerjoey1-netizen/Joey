import React from 'react';
import { X, ShieldCheck, QrCode, CheckCircle, Copy } from 'lucide-react';
import { Haptics } from '../utils/haptics';

interface SafetyCodeModalProps {
  isOpen: boolean;
  contactName: string;
  safetyCodeMatrix: string[];
  isVerified: boolean;
  onToggleVerify: () => void;
  onClose: () => void;
}

export const SafetyCodeModal: React.FC<SafetyCodeModalProps> = ({
  isOpen,
  contactName,
  safetyCodeMatrix,
  isVerified,
  onToggleVerify,
  onClose,
}) => {
  if (!isOpen) return null;

  const fullCode = safetyCodeMatrix.join(' ');

  const handleCopy = () => {
    navigator.clipboard?.writeText(fullCode);
    Haptics.tap();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-sm rounded-2xl bg-[#111b21] border border-[#202c33] p-5 shadow-2xl text-center text-[#e9edef]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-[#8696a0] hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#00a884]/20 border border-[#00a884]/40 text-[#00a884]">
          <ShieldCheck className="h-6 w-6" />
        </div>

        <h3 className="text-base font-bold text-white mb-1">
          Verify Security Code
        </h3>
        <p className="text-xs text-[#8696a0] mb-4">
          To verify end-to-end encryption with <strong>{contactName}</strong>, compare this 60-digit number or scan the QR code.
        </p>

        {/* QR Code Canvas */}
        <div className="mx-auto w-40 h-40 bg-white rounded-xl p-2 shadow-inner mb-4 flex items-center justify-center relative">
          <div className="w-full h-full grid grid-cols-6 gap-1 p-1">
            {Array.from({ length: 36 }).map((_, i) => (
              <div
                key={i}
                className={`rounded-xs ${
                  (i * 7) % 3 === 0 || i < 6 || i > 29 ? 'bg-black' : 'bg-zinc-200'
                }`}
              />
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-lg bg-[#00a884] flex items-center justify-center text-[#111b21] shadow border border-white">
              <QrCode className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* 60-digit matrix: 12 groups of 5 */}
        <div className="grid grid-cols-4 gap-1.5 p-3 rounded-xl bg-[#182229] border border-[#202c33] text-xs font-mono text-white mb-4">
          {safetyCodeMatrix.map((chunk, idx) => (
            <div key={idx} className="tracking-wider">
              {chunk}
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-3">
          <button
            onClick={handleCopy}
            className="flex-1 py-2 bg-[#202c33] hover:bg-[#2a3942] text-xs font-medium rounded-lg text-[#8696a0] hover:text-white flex items-center justify-center gap-1.5 transition-colors"
          >
            <Copy className="h-3.5 w-3.5" /> Copy Code
          </button>

          <button
            onClick={() => {
              Haptics.syncSuccess();
              onToggleVerify();
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              isVerified
                ? 'bg-[#00a884] text-[#111b21]'
                : 'bg-[#202c33] text-[#00a884] border border-[#00a884]/40 hover:bg-[#00a884]/20'
            }`}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            <span>{isVerified ? 'Verified ✓' : 'Mark as Verified'}</span>
          </button>
        </div>

        <p className="text-[10px] text-[#8696a0]">
          Double Ratchet Curve25519 & AES-256-GCM
        </p>
      </div>
    </div>
  );
};
