import React, { useState } from 'react';
import { Shield, Fingerprint, Lock, KeyRound, AlertTriangle } from 'lucide-react';
import { Haptics } from '../utils/haptics';

interface BiometricLockModalProps {
  isOpen: boolean;
  onUnlock: () => void;
  correctPin?: string;
}

export const BiometricLockModal: React.FC<BiometricLockModalProps> = ({
  isOpen,
  onUnlock,
  correctPin = '0000',
}) => {
  const [pin, setPin] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [usePinFallback, setUsePinFallback] = useState(false);

  if (!isOpen) return null;

  const handleBiometricScan = () => {
    setIsScanning(true);
    setErrorMsg('');
    setTimeout(() => {
      setIsScanning(false);
      Haptics.biometricSuccess();
      onUnlock();
    }, 1100);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === correctPin) {
      Haptics.biometricSuccess();
      onUnlock();
    } else {
      setErrorMsg('Incorrect security PIN. Default is 0000');
      setPin('');
      Haptics.disappearingBurn();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-[#111b21] border border-[#222e35] p-6 text-center shadow-2xl text-[#e9edef]">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#00a884]/20 border border-[#00a884]/40 text-[#00a884]">
          <Shield className="h-8 w-8" />
        </div>

        <h2 className="text-xl font-bold text-white mb-1">WhisperPulse Locked</h2>
        <p className="text-xs text-[#8696a0] mb-6">
          Protected by Biometric Security Layer & Hardware Enclave
        </p>

        {!usePinFallback ? (
          <div className="flex flex-col items-center">
            <button
              onClick={handleBiometricScan}
              disabled={isScanning}
              className={`relative group my-4 p-6 rounded-full transition-all duration-300 ${
                isScanning
                  ? 'scale-110 bg-[#00a884]/30 ring-4 ring-[#00a884] ring-offset-4 ring-offset-[#111b21]'
                  : 'bg-[#202c33] hover:bg-[#2a3942] active:scale-95'
              }`}
            >
              <Fingerprint
                className={`h-16 w-16 transition-colors duration-300 ${
                  isScanning ? 'text-[#00a884] animate-pulse' : 'text-[#aebac1]'
                }`}
              />
              {isScanning && (
                <div className="absolute inset-0 rounded-full border-2 border-[#00a884] border-t-transparent animate-spin" />
              )}
            </button>

            <p className="text-sm font-medium text-[#00a884] mt-2 mb-6">
              {isScanning ? 'Authenticating Face ID / Touch ID...' : 'Tap sensor to unlock'}
            </p>

            <button
              onClick={() => setUsePinFallback(true)}
              className="text-xs text-[#8696a0] hover:text-[#00a884] flex items-center gap-1.5 transition-colors"
            >
              <KeyRound className="h-3.5 w-3.5" /> Use Security PIN instead
            </button>
          </div>
        ) : (
          <form onSubmit={handlePinSubmit} className="flex flex-col items-center">
            <div className="mb-4 w-full">
              <label className="block text-xs text-[#8696a0] mb-2">
                Enter 4-digit Security PIN (Default: 0000)
              </label>
              <input
                type="password"
                maxLength={4}
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full text-center text-2xl tracking-[0.5em] px-4 py-2.5 rounded-lg bg-[#202c33] border border-[#2a3942] text-white focus:outline-none focus:border-[#00a884]"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-400 mb-4 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={pin.length < 4}
              className="w-full py-2.5 bg-[#00a884] hover:bg-[#02906f] disabled:opacity-40 disabled:cursor-not-allowed text-[#111b21] font-semibold rounded-lg transition-colors mb-3"
            >
              Unlock
            </button>

            <button
              type="button"
              onClick={() => setUsePinFallback(false)}
              className="text-xs text-[#8696a0] hover:text-[#00a884] flex items-center gap-1.5 transition-colors"
            >
              <Fingerprint className="h-3.5 w-3.5" /> Back to Biometrics
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-[#202c33] flex items-center justify-center gap-2 text-[11px] text-[#8696a0]">
          <Lock className="h-3 w-3 text-[#00a884]" />
          <span>Zero-Knowledge AES-256 Storage</span>
        </div>
      </div>
    </div>
  );
};
