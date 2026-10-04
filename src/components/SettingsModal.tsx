import React from 'react';
import {
  X,
  Moon,
  Sun,
  Bell,
  Fingerprint,
  Activity,
  WifiOff,
  Sparkles,
  Volume2,
  Check,
  Paintbrush,
  Shield,
  Layers,
} from 'lucide-react';
import { Haptics } from '../utils/haptics';

export interface AppSettings {
  theme: 'dark' | 'amoled' | 'light';
  wallpaper: 'doodle' | 'emerald' | 'navy' | 'classic';
  notificationsEnabled: boolean;
  notificationSound: 'whistle' | 'pop' | 'chime';
  notificationPreview: boolean;
  biometricLockEnabled: boolean;
  autoLockTimeout: number; // 0 = immediate, 60, 900
  rumblerEnabled: boolean;
  rumblerStrength: 'subtle' | 'normal' | 'deep';
  autocorrectEnabled: boolean;
  isOfflineSimulated: boolean;
  ttsVoice: 'Zephyr' | 'Kore' | 'Puck' | 'Charon' | 'Fenrir';
  geminiModel: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onClose: () => void;
  onLockNow: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onUpdateSettings,
  onClose,
  onLockNow,
}) => {
  if (!isOpen) return null;

  const update = (patch: Partial<AppSettings>) => {
    Haptics.tap();
    onUpdateSettings({ ...settings, ...patch });
  };

  const testRumbler = () => {
    Haptics.syncSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg max-h-[88vh] rounded-2xl bg-[#111b21] border border-[#202c33] flex flex-col overflow-hidden shadow-2xl text-[#e9edef]">
        {/* Header */}
        <div className="p-4 border-b border-[#202c33] flex items-center justify-between bg-[#202c33]/50">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#00a884]/20 text-[#00a884] flex items-center justify-center">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Settings</h2>
              <p className="text-xs text-[#8696a0]">
                Preferences, Privacy, Haptics & Security
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#202c33] text-[#8696a0] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
          {/* Theme & Wallpaper */}
          <div className="bg-[#182229] rounded-xl p-3.5 border border-[#202c33]">
            <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
              <Paintbrush className="h-3.5 w-3.5 text-[#00a884]" /> Appearance & Dark Mode
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[#8696a0] mb-1.5">Theme Palette</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'dark', label: 'WhatsApp Dark', icon: <Moon className="h-3.5 w-3.5" /> },
                    { id: 'amoled', label: 'AMOLED Black', icon: <Layers className="h-3.5 w-3.5" /> },
                    { id: 'light', label: 'Classic Light', icon: <Sun className="h-3.5 w-3.5" /> },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => update({ theme: t.id as any })}
                      className={`p-2 rounded-lg border flex items-center justify-center gap-1.5 font-medium transition-colors ${
                        settings.theme === t.id
                          ? 'bg-[#00a884] text-[#111b21] border-[#00a884] font-semibold'
                          : 'bg-[#202c33] border-transparent text-[#8696a0] hover:text-white'
                      }`}
                    >
                      {t.icon}
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[#8696a0] mb-1.5">Chat Wallpaper</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'doodle', label: 'Doodle' },
                    { id: 'emerald', label: 'Emerald' },
                    { id: 'navy', label: 'Midnight' },
                    { id: 'classic', label: 'Solid' },
                  ].map((w) => (
                    <button
                      key={w.id}
                      onClick={() => update({ wallpaper: w.id as any })}
                      className={`p-1.5 rounded-lg border text-center transition-colors ${
                        settings.wallpaper === w.id
                          ? 'border-[#00a884] text-[#00a884] bg-[#00a884]/15 font-semibold'
                          : 'border-transparent bg-[#202c33] text-[#8696a0] hover:text-white'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Biometric Security Layer */}
          <div className="bg-[#182229] rounded-xl p-3.5 border border-[#202c33]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Fingerprint className="h-3.5 w-3.5 text-[#00a884]" /> Biometric Security Layer
              </h3>
              <button
                onClick={() => update({ biometricLockEnabled: !settings.biometricLockEnabled })}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                  settings.biometricLockEnabled ? 'bg-[#00a884]' : 'bg-[#202c33]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    settings.biometricLockEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <p className="text-[11px] text-[#8696a0] mb-3">
              Require Face ID / Touch ID or 4-digit PIN to open WhisperPulse when idle.
            </p>

            {settings.biometricLockEnabled && (
              <div className="space-y-2 pt-2 border-t border-[#202c33]">
                <div className="flex items-center justify-between">
                  <span className="text-[#8696a0]">Auto-Lock Timeout:</span>
                  <div className="flex gap-1">
                    {[
                      { label: 'Immediate', val: 0 },
                      { label: '1 min', val: 60 },
                      { label: '15 min', val: 900 },
                    ].map((to) => (
                      <button
                        key={to.val}
                        onClick={() => update({ autoLockTimeout: to.val })}
                        className={`px-2 py-1 rounded text-[11px] ${
                          settings.autoLockTimeout === to.val
                            ? 'bg-[#00a884] text-[#111b21] font-semibold'
                            : 'bg-[#202c33] text-[#8696a0]'
                        }`}
                      >
                        {to.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    Haptics.tap();
                    onLockNow();
                    onClose();
                  }}
                  className="w-full py-1.5 bg-[#202c33] hover:bg-[#2a3942] rounded-lg text-amber-400 font-medium text-[11px]"
                >
                  🔒 Lock App Immediately
                </button>
              </div>
            )}
          </div>

          {/* Rumbler Effect for Haptic Feedback */}
          <div className="bg-[#182229] rounded-xl p-3.5 border border-[#202c33]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-[#00a884]" /> Rumbler Effect (Haptics)
              </h3>
              <button
                onClick={() => update({ rumblerEnabled: !settings.rumblerEnabled })}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                  settings.rumblerEnabled ? 'bg-[#00a884]' : 'bg-[#202c33]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    settings.rumblerEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <p className="text-[11px] text-[#8696a0] mb-3">
              Sub-bass tactile rumble on document edits, successful cloud syncs, and biometric unlocks.
            </p>

            {settings.rumblerEnabled && (
              <div className="flex items-center justify-between pt-2 border-t border-[#202c33]">
                <button
                  onClick={testRumbler}
                  className="px-3 py-1.5 bg-[#00a884]/20 border border-[#00a884]/40 text-[#00a884] rounded-lg font-medium hover:bg-[#00a884]/30"
                >
                  Test Rumbler Pulse
                </button>
                <span className="text-[11px] text-[#8696a0]">
                  Web Audio 45Hz Synthetic Rumbler
                </span>
              </div>
            )}
          </div>

          {/* Real-time Autocorrect */}
          <div className="bg-[#182229] rounded-xl p-3.5 border border-[#202c33]">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#00a884]" /> Real-Time Spelling Autocorrect
              </h3>
              <button
                onClick={() => update({ autocorrectEnabled: !settings.autocorrectEnabled })}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                  settings.autocorrectEnabled ? 'bg-[#00a884]' : 'bg-[#202c33]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    settings.autocorrectEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-[11px] text-[#8696a0]">
              Automatically detects and corrects spelling mistakes and contractions in real-time while typing.
            </p>
          </div>

          {/* Notifications System */}
          <div className="bg-[#182229] rounded-xl p-3.5 border border-[#202c33]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5 text-[#00a884]" /> Notifications System
              </h3>
              <button
                onClick={() => update({ notificationsEnabled: !settings.notificationsEnabled })}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                  settings.notificationsEnabled ? 'bg-[#00a884]' : 'bg-[#202c33]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    settings.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {settings.notificationsEnabled && (
              <div className="space-y-2 pt-2 border-t border-[#202c33]">
                <div className="flex items-center justify-between">
                  <span className="text-[#8696a0]">Alert Tone</span>
                  <div className="flex gap-1">
                    {['whistle', 'pop', 'chime'].map((snd) => (
                      <button
                        key={snd}
                        onClick={() => update({ notificationSound: snd as any })}
                        className={`px-2 py-1 rounded capitalize text-[11px] ${
                          settings.notificationSound === snd
                            ? 'bg-[#00a884] text-[#111b21] font-semibold'
                            : 'bg-[#202c33] text-[#8696a0]'
                        }`}
                      >
                        {snd}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#8696a0]">Show Message Preview</span>
                  <button
                    onClick={() => update({ notificationPreview: !settings.notificationPreview })}
                    className="text-[#00a884] font-medium"
                  >
                    {settings.notificationPreview ? 'Show Preview' : 'Hide Preview'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Offline Accessibility Mode Simulator */}
          <div className="bg-[#182229] rounded-xl p-3.5 border border-[#202c33]">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <WifiOff className="h-3.5 w-3.5 text-amber-400" /> Offline Mode Simulator
              </h3>
              <button
                onClick={() => update({ isOfflineSimulated: !settings.isOfflineSimulated })}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                  settings.isOfflineSimulated ? 'bg-amber-500' : 'bg-[#202c33]'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    settings.isOfflineSimulated ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-[11px] text-[#8696a0]">
              Toggle this to test document viewing and reading from encrypted local cache without network connection.
            </p>
          </div>

          {/* Gemini Voice Persona (gemini-3.8-flash-tts) */}
          <div className="bg-[#182229] rounded-xl p-3.5 border border-[#202c33]">
            <h3 className="text-xs font-semibold text-white mb-1.5 flex items-center gap-1.5">
              <Volume2 className="h-3.5 w-3.5 text-[#00a884]" /> Text-to-Speech Voice (Gemini 3.8 Flash TTS)
            </h3>
            <p className="text-[11px] text-[#8696a0] mb-2">
              Select prebuilt voice persona for synthesizing incoming voice notes & message playback.
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {['Zephyr', 'Kore', 'Puck', 'Charon', 'Fenrir'].map((voice) => (
                <button
                  key={voice}
                  onClick={() => update({ ttsVoice: voice as any })}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    settings.ttsVoice === voice
                      ? 'bg-[#00a884] text-[#111b21] font-semibold'
                      : 'bg-[#202c33] text-[#8696a0] hover:text-white'
                  }`}
                >
                  {voice}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
