import React, { useState } from 'react';
import {
  Search,
  MessageSquarePlus,
  MoreVertical,
  Lock,
  Laptop,
  Settings as SettingsIcon,
  ShieldCheck,
  FileText,
  Users,
  HardDrive,
  WifiOff,
  Sparkles,
  Phone,
  Timer,
  CheckCheck,
  X,
} from 'lucide-react';
import { ChatConversation } from '../types/chat';
import { Haptics } from '../utils/haptics';

interface SidebarProps {
  conversations: ChatConversation[];
  activeChatId: string;
  onSelectChat: (chatId: string) => void;
  onOpenSettings: () => void;
  onOpenLinkedDevices: () => void;
  onOpenWorkspace: () => void;
  onOpenDocsVault: () => void;
  onLockApp: () => void;
  onCreateGroup: () => void;
  isOfflineMode: boolean;
}

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const escaped = query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <span key={i} className="text-[#00a884] font-bold bg-[#00a884]/20 px-0.5 rounded-xs">
        {part}
      </span>
    ) : (
      part
    )
  );
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeChatId,
  onSelectChat,
  onOpenSettings,
  onOpenLinkedDevices,
  onOpenWorkspace,
  onOpenDocsVault,
  onLockApp,
  onCreateGroup,
  isOfflineMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'groups'>('all');

  const filtered = conversations.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      if (activeFilter === 'unread') return c.unreadCount > 0;
      if (activeFilter === 'groups') return c.isGroup;
      return true;
    }

    const matchesName = c.name.toLowerCase().includes(q);
    const matchesParticipant = c.participants?.some((p) =>
      p.name.toLowerCase().includes(q)
    );
    const matchesLastMsg = c.lastMessage?.text.toLowerCase().includes(q);

    const matchesSearch = matchesName || matchesParticipant || matchesLastMsg;
    if (!matchesSearch) return false;
    if (activeFilter === 'unread') return c.unreadCount > 0;
    if (activeFilter === 'groups') return c.isGroup;
    return true;
  });

  return (
    <div className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-[#111b21] border-r border-[#202c33] select-none text-[#e9edef]">
      {/* Top Header */}
      <div className="h-16 px-4 bg-[#202c33] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-full overflow-hidden border border-[#00a884]/60">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                alt="My Profile"
                className="h-full w-full object-cover"
              />
            </div>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#00a884] border-2 border-[#202c33]" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">WhisperPulse</h1>
            <span className="text-[10px] text-[#00a884] font-medium flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> E2E Zero-Knowledge
            </span>
          </div>
        </div>

        {/* Top Header Navigation Icons */}
        <div className="flex items-center gap-1 text-[#aebac1]">
          {/* Offline Document Vault */}
          <button
            onClick={() => {
              Haptics.tap();
              onOpenDocsVault();
            }}
            className="p-2 rounded-full hover:bg-[#374248] hover:text-white transition-colors"
            title="Offline Document Vault & Cache"
          >
            <FileText className="h-5 w-5 text-amber-400" />
          </button>

          {/* Linked Devices */}
          <button
            onClick={() => {
              Haptics.tap();
              onOpenLinkedDevices();
            }}
            className="p-2 rounded-full hover:bg-[#374248] hover:text-white transition-colors"
            title="Linked Devices & Cloud Sync"
          >
            <Laptop className="h-5 w-5 text-sky-400" />
          </button>

          {/* Google Workspace */}
          <button
            onClick={() => {
              Haptics.tap();
              onOpenWorkspace();
            }}
            className="p-2 rounded-full hover:bg-[#374248] hover:text-white transition-colors"
            title="Google Workspace (Drive, Chat, Gmail)"
          >
            <HardDrive className="h-5 w-5 text-[#00a884]" />
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              Haptics.tap();
              onOpenSettings();
            }}
            className="p-2 rounded-full hover:bg-[#374248] hover:text-white transition-colors"
            title="Settings & Privacy"
          >
            <SettingsIcon className="h-5 w-5" />
          </button>

          {/* Lock Immediately */}
          <button
            onClick={() => {
              Haptics.disappearingBurn();
              onLockApp();
            }}
            className="p-2 rounded-full hover:bg-[#374248] text-amber-400 hover:text-white transition-colors"
            title="Lock with Biometrics"
          >
            <Lock className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Offline Mode Banner Warning if active */}
      {isOfflineMode && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-3 py-1.5 flex items-center justify-between text-[11px] text-amber-300">
          <div className="flex items-center gap-1.5">
            <WifiOff className="h-3.5 w-3.5" />
            <span>Offline Simulator Active: reading from local cache</span>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-2.5 border-b border-[#202c33]">
        <div className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#202c33] text-xs text-white focus-within:ring-1 focus-within:ring-[#00a884]">
          <Search className="h-4 w-4 text-[#8696a0] shrink-0" />
          <input
            type="text"
            placeholder="Search contact name or group title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent focus:outline-none placeholder-[#8696a0] text-xs pr-6"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                Haptics.tap();
              }}
              className="absolute right-2.5 p-0.5 rounded-full hover:bg-[#374248] text-[#8696a0] hover:text-white transition-colors"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {searchQuery.trim() && (
          <div className="flex items-center justify-between mt-1.5 px-1 text-[11px] text-[#8696a0]">
            <span>
              {filtered.length === 0
                ? 'No matches'
                : `Found ${filtered.length} conversation${filtered.length === 1 ? '' : 's'}`}
            </span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-[#00a884] hover:underline"
            >
              Reset
            </button>
          </div>
        )}

        {/* Filter Chips & New Group */}
        <div className="flex items-center justify-between mt-2 pt-1 text-xs">
          <div className="flex gap-1.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: 'Unread' },
              { id: 'groups', label: 'Groups' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  Haptics.tap();
                  setActiveFilter(f.id as any);
                }}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
                  activeFilter === f.id
                    ? 'bg-[#00a884] text-[#111b21] font-semibold'
                    : 'bg-[#202c33] text-[#8696a0] hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              Haptics.tap();
              onCreateGroup();
            }}
            className="text-[11px] text-[#00a884] hover:underline flex items-center gap-1"
          >
            <Users className="h-3 w-3" /> New Group
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#202c33]/40">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#8696a0]">
            <div className="h-12 w-12 rounded-full bg-[#202c33] text-[#8696a0] flex items-center justify-center mx-auto mb-3">
              <Search className="h-6 w-6" />
            </div>
            <p className="font-semibold text-white mb-1">No conversations found</p>
            <p className="text-[11px] mb-4">
              No contacts or groups match &ldquo;{searchQuery}&rdquo;
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-3 py-1.5 rounded-lg bg-[#00a884]/20 text-[#00a884] hover:bg-[#00a884]/30 font-medium text-xs transition-colors"
            >
              Clear search filter
            </button>
          </div>
        ) : (
          filtered.map((c) => {
            const isSelected = c.id === activeChatId;
            return (
              <div
                key={c.id}
                onClick={() => {
                  Haptics.tap();
                  onSelectChat(c.id);
                }}
                className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[#2a3942]'
                    : 'hover:bg-[#202c33]/60 bg-transparent'
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="h-12 w-12 rounded-full overflow-hidden border border-[#2a3942]">
                    <img
                      src={c.avatar}
                      alt={c.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {c.isOnline && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#00a884] border-2 border-[#111b21]" />
                  )}
                  {c.isGeminiBot && (
                    <span className="absolute -top-1 -right-1 p-0.5 rounded-full bg-[#00a884] text-[#111b21]">
                      <Sparkles className="h-3 w-3" />
                    </span>
                  )}
                </div>

                {/* Chat snippet */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-xs font-semibold text-white truncate">
                        {highlightMatch(c.name, searchQuery)}
                      </span>
                      {c.isGroup && (
                        <Users className="h-3 w-3 text-[#8696a0] shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-[#8696a0] shrink-0">
                      {c.isOnline ? 'Online' : 'Yesterday'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#8696a0]">
                    <p className="text-[11px] truncate pr-2">
                      {c.isGeminiBot
                        ? 'AI Assistant • Multi-turn ready'
                        : c.isGroup
                        ? 'Encrypted security group'
                        : 'End-to-end encrypted'}
                    </p>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {c.disappearingDefault > 0 && (
                        <span title="Disappearing active">
                          <Timer className="h-3 w-3 text-amber-400" />
                        </span>
                      )}

                      {c.unreadCount > 0 && (
                        <span className="h-4 min-w-4 px-1 rounded-full bg-[#00a884] text-[#111b21] font-bold text-[10px] flex items-center justify-center">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
