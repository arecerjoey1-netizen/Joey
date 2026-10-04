import React, { useState } from 'react';
import { X, Users, Shield, Timer } from 'lucide-react';
import { Haptics } from '../utils/haptics';

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (name: string, disappearingDefault: number) => void;
}

export const NewGroupModal: React.FC<NewGroupModalProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
}) => {
  const [name, setName] = useState('');
  const [disappearingDefault, setDisappearingDefault] = useState(86400);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateGroup(name.trim(), disappearingDefault);
    setName('');
    Haptics.syncSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-[#111b21] border border-[#202c33] p-5 shadow-2xl text-[#e9edef]">
        <div className="flex items-center justify-between pb-3 border-b border-[#202c33] mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#00a884]" />
            <h3 className="text-base font-bold text-white">Create Encrypted Group</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#8696a0] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#8696a0] mb-1">Group Subject / Name</label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Confidential Operations Team"
              className="w-full px-3 py-2 rounded-lg bg-[#202c33] border border-[#2a3942] text-white focus:outline-none focus:border-[#00a884]"
            />
          </div>

          <div>
            <label className="block text-[#8696a0] mb-1.5 flex items-center gap-1">
              <Timer className="h-3.5 w-3.5 text-amber-400" /> Default Disappearing Messages
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'Off', val: 0 },
                { label: '24 Hours', val: 86400 },
                { label: '7 Days', val: 604800 },
                { label: '90 Days', val: 7776000 },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.val}
                  onClick={() => {
                    Haptics.tap();
                    setDisappearingDefault(opt.val);
                  }}
                  className={`py-1.5 rounded-lg border text-center transition-colors ${
                    disappearingDefault === opt.val
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 font-semibold'
                      : 'bg-[#202c33] border-transparent text-[#8696a0]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#182229] border border-[#202c33] text-[11px] text-[#8696a0] flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#00a884] shrink-0" />
            <span>
              All messages within this group are protected by Signal Protocol group ratchets. You can customize admin privileges after creation.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-[#202c33] text-[#8696a0] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 bg-[#00a884] hover:bg-[#02906f] text-[#111b21] font-semibold rounded-lg disabled:opacity-40 transition-colors"
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
