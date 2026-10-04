import React, { useState } from 'react';
import { X, Check, Paintbrush, RotateCcw, Sparkles } from 'lucide-react';
import { WALLPAPER_PRESETS, WallpaperPreset } from '../utils/wallpaperPresets';
import { Haptics } from '../utils/haptics';

interface WallpaperPickerModalProps {
  isOpen: boolean;
  chatName: string;
  currentWallpaperId?: string;
  hasDoodleOverlay?: boolean;
  onSelectWallpaper: (presetId: string, withDoodle: boolean) => void;
  onClose: () => void;
  onResetToDefault: () => void;
}

export const WallpaperPickerModal: React.FC<WallpaperPickerModalProps> = ({
  isOpen,
  chatName,
  currentWallpaperId = 'default-doodle',
  hasDoodleOverlay = true,
  onSelectWallpaper,
  onClose,
  onResetToDefault,
}) => {
  const [selectedId, setSelectedId] = useState(currentWallpaperId);
  const [doodleActive, setDoodleActive] = useState(hasDoodleOverlay);
  const [activeTab, setActiveTab] = useState<'all' | 'gradients' | 'dark' | 'light'>('all');

  if (!isOpen) return null;

  const filteredPresets = WALLPAPER_PRESETS.filter((p) => {
    if (activeTab === 'all') return true;
    return p.category === activeTab;
  });

  const handlePick = (preset: WallpaperPreset) => {
    setSelectedId(preset.id);
    Haptics.tap();
    onSelectWallpaper(preset.id, doodleActive);
  };

  const handleToggleDoodle = () => {
    const next = !doodleActive;
    setDoodleActive(next);
    Haptics.tap();
    onSelectWallpaper(selectedId, next);
  };

  const handleReset = () => {
    setSelectedId('default-doodle');
    setDoodleActive(true);
    Haptics.syncSuccess();
    onResetToDefault();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in select-none">
      <div className="relative w-full max-w-lg max-h-[85vh] rounded-2xl bg-[#111b21] border border-[#202c33] flex flex-col overflow-hidden shadow-2xl text-[#e9edef]">
        {/* Header */}
        <div className="p-4 border-b border-[#202c33] flex items-center justify-between bg-[#202c33]/50">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#00a884]/20 text-[#00a884] flex items-center justify-center">
              <Paintbrush className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Chat Wallpaper
              </h2>
              <p className="text-[11px] text-[#8696a0]">
                Customized specifically for <strong>{chatName}</strong>
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

        {/* Tab Filters & Doodle Toggle */}
        <div className="p-3 bg-[#182229] border-b border-[#202c33] flex items-center justify-between text-xs">
          <div className="flex gap-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'gradients', label: 'Gradients' },
              { id: 'dark', label: 'Dark Tones' },
              { id: 'light', label: 'Light' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  Haptics.tap();
                  setActiveTab(tab.id as any);
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#00a884] text-[#111b21] font-semibold'
                    : 'bg-[#202c33] text-[#8696a0] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* WhatsApp Doodle Pattern Toggle */}
          <button
            onClick={handleToggleDoodle}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
              doodleActive
                ? 'bg-[#00a884]/20 border-[#00a884]/50 text-[#00a884]'
                : 'bg-[#202c33] border-transparent text-[#8696a0] hover:text-white'
            }`}
            title="Toggle subtle WhatsApp doodle sketch watermark"
          >
            <Sparkles className="h-3 w-3" />
            <span>{doodleActive ? 'Doodle On' : 'Doodle Off'}</span>
          </button>
        </div>

        {/* Preset Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#0c1317]">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredPresets.map((preset) => {
              const isSelected = selectedId === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => handlePick(preset)}
                  className={`group relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all p-2 flex flex-col justify-end h-28 shadow ${
                    isSelected
                      ? 'border-[#00a884] ring-2 ring-[#00a884]/40 scale-102'
                      : 'border-[#202c33] hover:border-[#8696a0]/50'
                  }`}
                  style={{
                    background: preset.backgroundCss,
                  }}
                >
                  {/* Subtle Doodle Sketch Overlay Preview */}
                  {doodleActive && (
                    <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />
                  )}

                  {/* Sample Mock Chat Bubbles inside thumbnail for authentic feel */}
                  <div className="absolute top-2 left-2 right-2 flex flex-col gap-1 pointer-events-none opacity-85">
                    <div className="self-start px-2 py-0.5 rounded-md bg-[#202c33]/80 text-[8px] text-[#e9edef] max-w-[70%]">
                      Hello!
                    </div>
                    <div className="self-end px-2 py-0.5 rounded-md bg-[#005c4b]/90 text-[8px] text-white max-w-[70%]">
                      Encrypted 🔒
                    </div>
                  </div>

                  {/* Active Selection Badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-[#00a884] text-[#111b21] flex items-center justify-center shadow-md">
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                  )}

                  {/* Label Bar */}
                  <div className="relative z-10 px-2 py-1 rounded-md bg-[#111b21]/80 backdrop-blur-xs text-[10px] font-medium text-white truncate shadow-sm">
                    {preset.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#111b21] border-t border-[#202c33] flex items-center justify-between text-xs">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-[#8696a0] hover:text-white transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset to Default</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#00a884] hover:bg-[#02906f] text-[#111b21] font-semibold rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
