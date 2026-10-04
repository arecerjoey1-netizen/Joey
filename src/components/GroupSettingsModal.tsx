import React, { useState } from 'react';
import {
  X,
  Users,
  Shield,
  ShieldCheck,
  Lock,
  UserPlus,
  Trash2,
  Timer,
  CheckCircle2,
} from 'lucide-react';
import { ChatConversation, GroupParticipant, GroupPrivacySettings } from '../types/chat';
import { Haptics } from '../utils/haptics';

interface GroupSettingsModalProps {
  isOpen: boolean;
  group: ChatConversation;
  onClose: () => void;
  onUpdatePrivacy: (newSettings: GroupPrivacySettings) => void;
  onAddParticipant: (name: string) => void;
  onRemoveParticipant: (id: string) => void;
  onOpenSafetyCode: () => void;
}

export const GroupSettingsModal: React.FC<GroupSettingsModalProps> = ({
  isOpen,
  group,
  onClose,
  onUpdatePrivacy,
  onAddParticipant,
  onRemoveParticipant,
  onOpenSafetyCode,
}) => {
  const [newMemberName, setNewMemberName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen || !group.isGroup) return null;

  const privacy = group.privacySettings || {
    adminsOnlySend: false,
    adminsOnlyEdit: true,
    whoCanAdd: 'admins',
    readReceipts: true,
    disappearingDefault: 86400,
  };

  const handleToggle = (key: keyof GroupPrivacySettings) => {
    Haptics.tap();
    const updated = {
      ...privacy,
      [key]: !privacy[key],
    };
    onUpdatePrivacy(updated);
  };

  const handleWhoCanAdd = (val: 'all' | 'admins') => {
    Haptics.tap();
    onUpdatePrivacy({
      ...privacy,
      whoCanAdd: val,
    });
  };

  const handleDisappearingChange = (val: number) => {
    Haptics.tap();
    onUpdatePrivacy({
      ...privacy,
      disappearingDefault: val,
    });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    onAddParticipant(newMemberName.trim());
    setNewMemberName('');
    setShowAddForm(false);
    Haptics.syncSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg max-h-[85vh] rounded-2xl bg-[#111b21] border border-[#202c33] flex flex-col overflow-hidden shadow-2xl text-[#e9edef]">
        {/* Header */}
        <div className="p-4 border-b border-[#202c33] flex items-center justify-between bg-[#202c33]/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full overflow-hidden border border-[#2a3942]">
              <img
                src={group.avatar}
                alt={group.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{group.name}</h2>
              <p className="text-xs text-[#8696a0]">
                Group Info & Custom Privacy Settings
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Privacy & Permissions Section */}
          <div className="bg-[#182229] rounded-xl p-4 border border-[#202c33]">
            <h3 className="text-xs font-semibold text-[#00a884] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> Group Permissions & Governance
            </h3>

            <div className="space-y-3 text-xs">
              {/* Only Admins Send Messages */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="font-medium text-white">Send Messages</p>
                  <p className="text-[#8696a0] text-[11px]">
                    Choose who can send messages to this group
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('adminsOnlySend')}
                  className={`px-3 py-1 rounded-full font-medium transition-colors ${
                    privacy.adminsOnlySend
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-[#202c33] text-[#8696a0] hover:text-white'
                  }`}
                >
                  {privacy.adminsOnlySend ? 'Only Admins' : 'All Participants'}
                </button>
              </div>

              {/* Edit Group Info */}
              <div className="flex items-center justify-between py-1 border-t border-[#202c33] pt-2">
                <div>
                  <p className="font-medium text-white">Edit Group Info</p>
                  <p className="text-[#8696a0] text-[11px]">
                    Who can change name, icon, and description
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('adminsOnlyEdit')}
                  className={`px-3 py-1 rounded-full font-medium transition-colors ${
                    privacy.adminsOnlyEdit
                      ? 'bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/30'
                      : 'bg-[#202c33] text-[#8696a0]'
                  }`}
                >
                  {privacy.adminsOnlyEdit ? 'Only Admins' : 'All Participants'}
                </button>
              </div>

              {/* Who Can Add Members */}
              <div className="flex items-center justify-between py-1 border-t border-[#202c33] pt-2">
                <div>
                  <p className="font-medium text-white">Add Other Members</p>
                  <p className="text-[#8696a0] text-[11px]">
                    Who can invite new participants
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleWhoCanAdd('admins')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] ${
                      privacy.whoCanAdd === 'admins'
                        ? 'bg-[#00a884] text-[#111b21] font-semibold'
                        : 'bg-[#202c33] text-[#8696a0]'
                    }`}
                  >
                    Admins
                  </button>
                  <button
                    onClick={() => handleWhoCanAdd('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] ${
                      privacy.whoCanAdd === 'all'
                        ? 'bg-[#00a884] text-[#111b21] font-semibold'
                        : 'bg-[#202c33] text-[#8696a0]'
                    }`}
                  >
                    All Members
                  </button>
                </div>
              </div>

              {/* Read Receipts */}
              <div className="flex items-center justify-between py-1 border-t border-[#202c33] pt-2">
                <div>
                  <p className="font-medium text-white">Read Receipts (Blue Ticks)</p>
                  <p className="text-[#8696a0] text-[11px]">
                    Show blue checkmarks when group members view messages
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('readReceipts')}
                  className={`px-3 py-1 rounded-full font-medium ${
                    privacy.readReceipts
                      ? 'bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/30'
                      : 'bg-[#202c33] text-[#8696a0]'
                  }`}
                >
                  {privacy.readReceipts ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>
          </div>

          {/* Disappearing Messages Default */}
          <div className="bg-[#182229] rounded-xl p-4 border border-[#202c33]">
            <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5" /> Disappearing Messages Timer
            </h3>
            <p className="text-xs text-[#8696a0] mb-3">
              When turned on, new messages sent in this group will disappear after the selected period.
            </p>

            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Off', val: 0 },
                { label: '24 Hours', val: 86400 },
                { label: '7 Days', val: 604800 },
                { label: '90 Days', val: 7776000 },
              ].map((option) => (
                <button
                  key={option.val}
                  onClick={() => handleDisappearingChange(option.val)}
                  className={`py-2 px-2 text-center rounded-lg text-xs font-medium border transition-colors ${
                    privacy.disappearingDefault === option.val
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 font-semibold'
                      : 'bg-[#202c33] border-transparent text-[#8696a0] hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Group Members List */}
          <div className="bg-[#182229] rounded-xl p-4 border border-[#202c33]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-[#00a884]" />
                <span>Participants ({group.participants?.length || 0})</span>
              </h3>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-xs text-[#00a884] hover:underline flex items-center gap-1"
              >
                <UserPlus className="h-3 w-3" /> Add Member
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddSubmit} className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Enter name or contact..."
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-[#202c33] border border-[#2a3942] text-white focus:outline-none focus:border-[#00a884]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#00a884] text-[#111b21] font-semibold text-xs rounded-lg hover:bg-[#02906f]"
                >
                  Add
                </button>
              </form>
            )}

            <div className="space-y-2">
              {group.participants?.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#202c33]/50 hover:bg-[#202c33] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="h-8 w-8 rounded-full object-cover border border-[#2a3942]"
                    />
                    <div>
                      <p className="text-xs font-medium text-white">{p.name}</p>
                      {p.status && (
                        <p className="text-[10px] text-[#8696a0]">{p.status}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {p.role === 'admin' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/30 font-medium">
                        Group Admin
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#8696a0]">Member</span>
                    )}

                    {p.id !== 'me' && (
                      <button
                        onClick={() => {
                          Haptics.tap();
                          onRemoveParticipant(p.id);
                        }}
                        className="p-1 text-[#8696a0] hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Group Security Safety Verification */}
          <button
            onClick={() => {
              Haptics.tap();
              onOpenSafetyCode();
            }}
            className="w-full p-3 rounded-xl bg-[#182229] border border-[#202c33] hover:border-[#00a884]/40 flex items-center justify-between text-xs text-[#8696a0] hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-[#00a884]" />
              <div className="text-left">
                <p className="text-white font-medium">Verify Group Safety Numbers</p>
                <p className="text-[11px] text-[#8696a0]">
                  Confirm 60-digit Curve25519 ratchet key with group participants
                </p>
              </div>
            </div>
            <Lock className="h-4 w-4 text-[#00a884]" />
          </button>
        </div>
      </div>
    </div>
  );
};
