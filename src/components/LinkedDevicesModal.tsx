import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Laptop,
  Globe,
  RefreshCw,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { LinkedDevice } from '../types/chat';
import { Haptics } from '../utils/haptics';

interface LinkedDevicesModalProps {
  isOpen: boolean;
  devices: LinkedDevice[];
  onClose: () => void;
  onSyncAll: () => void;
  onUnlinkDevice: (id: string) => void;
  onLinkNewDevice: () => void;
}

export const LinkedDevicesModal: React.FC<LinkedDevicesModalProps> = ({
  isOpen,
  devices,
  onClose,
  onSyncAll,
  onUnlinkDevice,
  onLinkNewDevice,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  if (!isOpen) return null;

  const handleSyncClick = () => {
    setIsSyncing(true);
    Haptics.tap();
    setTimeout(() => {
      setIsSyncing(false);
      Haptics.syncSuccess();
      onSyncAll();
    }, 1200);
  };

  const getDeviceIcon = (platform: LinkedDevice['platform']) => {
    switch (platform) {
      case 'ios':
      case 'android':
        return <Smartphone className="h-5 w-5 text-[#00a884]" />;
      case 'mac':
      case 'windows':
        return <Laptop className="h-5 w-5 text-sky-400" />;
      default:
        return <Globe className="h-5 w-5 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-[#111b21] border border-[#202c33] flex flex-col overflow-hidden shadow-2xl text-[#e9edef]">
        {/* Header */}
        <div className="p-4 border-b border-[#202c33] flex items-center justify-between bg-[#202c33]/50">
          <div>
            <h2 className="text-base font-bold text-white">Linked Devices</h2>
            <p className="text-xs text-[#8696a0]">
              Multi-Device Cloud Syncing & Cross-Platform State
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#202c33] text-[#8696a0] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Cloud Sync Hero Banner */}
          <div className="bg-[#182229] rounded-xl p-4 border border-[#202c33] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#00a884]/20 border border-[#00a884]/40 flex items-center justify-center text-[#00a884]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">
                  Multi-Device Encryption
                </p>
                <p className="text-[11px] text-[#8696a0]">
                  Ratchet keys synchronized seamlessly across all clients
                </p>
              </div>
            </div>

            <button
              onClick={handleSyncClick}
              disabled={isSyncing}
              className="px-3 py-1.5 bg-[#00a884] text-[#111b21] hover:bg-[#02906f] font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`}
              />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>

          {/* QR Code Linking Section */}
          {showQrCode ? (
            <div className="bg-[#182229] rounded-xl p-4 border border-[#00a884]/30 text-center animate-in zoom-in-95">
              <h3 className="text-xs font-semibold text-white mb-1">
                Scan to Link New Phone or Tablet
              </h3>
              <p className="text-[11px] text-[#8696a0] mb-3">
                Open WhisperPulse on your mobile device &gt; Settings &gt; Link a Device
              </p>

              {/* Synthetic Animated QR Code */}
              <div className="mx-auto w-44 h-44 bg-white rounded-xl p-2.5 shadow-inner flex flex-col items-center justify-center relative overflow-hidden">
                <div className="w-full h-full grid grid-cols-7 gap-1 p-1">
                  {Array.from({ length: 49 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-xs ${
                        (i % 2 === 0 && i % 3 !== 0) || i < 8 || i > 40
                          ? 'bg-black'
                          : 'bg-zinc-200'
                      }`}
                    />
                  ))}
                </div>
                {/* Central lock logo */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-10 w-10 rounded-lg bg-[#00a884] flex items-center justify-center text-[#111b21] shadow-md border-2 border-white">
                    <QrCode className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-center gap-2">
                <button
                  onClick={() => {
                    Haptics.syncSuccess();
                    onLinkNewDevice();
                    setShowQrCode(false);
                  }}
                  className="px-3 py-1.5 bg-[#00a884] text-[#111b21] text-xs font-semibold rounded-lg hover:bg-[#02906f]"
                >
                  Confirm Linked
                </button>
                <button
                  onClick={() => setShowQrCode(false)}
                  className="px-3 py-1.5 bg-[#202c33] text-[#8696a0] text-xs rounded-lg hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                Haptics.tap();
                setShowQrCode(true);
              }}
              className="w-full py-2.5 bg-[#202c33] hover:bg-[#2a3942] border border-[#2a3942] rounded-xl text-xs font-semibold text-[#00a884] flex items-center justify-center gap-2 transition-colors"
            >
              <QrCode className="h-4 w-4" /> Link a New Device
            </button>
          )}

          {/* Registered Devices List */}
          <div>
            <h3 className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider mb-2">
              Registered Endpoints ({devices.length})
            </h3>

            <div className="space-y-2">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#182229] border border-[#202c33]"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-[#202c33] flex items-center justify-center">
                      {getDeviceIcon(device.platform)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-medium text-white">
                          {device.name}
                        </p>
                        {device.isCurrent && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/30">
                            This Device
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#8696a0]">
                        {device.location} • {device.lastActive}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {device.status === 'active' ? (
                      <span className="flex items-center gap-1 text-[11px] text-[#00a884]">
                        <CheckCircle2 className="h-3 w-3" /> Synced
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#8696a0]">Idle</span>
                    )}

                    {!device.isCurrent && (
                      <button
                        onClick={() => {
                          Haptics.tap();
                          onUnlinkDevice(device.id);
                        }}
                        className="p-1 text-[#8696a0] hover:text-rose-400 transition-colors"
                        title="Log out device"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
