import React, { useState, useRef, useEffect } from 'react';
import {
  Phone,
  Video,
  Search,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Send,
  ShieldCheck,
  Lock,
  Timer,
  Eye,
  Check,
  CheckCheck,
  FileText,
  Volume2,
  HardDrive,
  Users,
  Sparkles,
  Play,
  Pause,
  AlertCircle,
  Plus,
  SmilePlus,
  Paintbrush,
  ChevronUp,
  ChevronDown,
  X,
} from 'lucide-react';
import { ChatConversation, ChatMessage, DocumentMeta } from '../types/chat';
import { Haptics } from '../utils/haptics';
import { autoCorrectText, getActiveWordSuggestions } from '../utils/spelling';
import { playBase64Audio } from '../utils/audioCallManager';
import { OfflineDoc } from '../utils/offlineDocsStore';
import { WallpaperPickerModal } from './WallpaperPickerModal';
import { WALLPAPER_PRESETS } from '../utils/wallpaperPresets';

interface ChatAreaProps {
  chat: ChatConversation;
  messages: ChatMessage[];
  onSendMessage: (payload: {
    text: string;
    isDisappearing?: boolean;
    disappearingDuration?: number;
    isViewOnce?: boolean;
    mediaType?: 'image' | 'video' | 'audio' | 'document';
    mediaUrl?: string;
    documentMeta?: DocumentMeta;
  }) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onUpdateWallpaper: (chatId: string, wallpaperId: string, withDoodle: boolean) => void;
  onStartVoiceCall: () => void;
  onOpenSafetyCode: () => void;
  onOpenGroupSettings: () => void;
  onOpenViewOnce: (msg: ChatMessage) => void;
  onOpenDocument: (meta: DocumentMeta) => void;
  onOpenWorkspace: () => void;
  theme: 'dark' | 'amoled' | 'light';
  wallpaper: 'doodle' | 'emerald' | 'navy' | 'classic';
  autocorrectEnabled: boolean;
  ttsVoice: string;
  isMobileView?: boolean;
  onBackToList?: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  chat,
  messages,
  onSendMessage,
  onToggleReaction,
  onUpdateWallpaper,
  onStartVoiceCall,
  onOpenSafetyCode,
  onOpenGroupSettings,
  onOpenViewOnce,
  onOpenDocument,
  onOpenWorkspace,
  theme,
  wallpaper,
  autocorrectEnabled,
  ttsVoice,
  isMobileView,
  onBackToList,
}) => {
  const [inputText, setInputText] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [disappearingChoice, setDisappearingChoice] = useState<number>(
    chat.disappearingDefault || 0
  );
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [ttsLoadingId, setTtsLoadingId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [activeSuggestions, setActiveSuggestions] = useState<string[]>([]);
  const [reactingMsgId, setReactingMsgId] = useState<string | null>(null);
  const [showExtendedPicker, setShowExtendedPicker] = useState<boolean>(false);
  const [showWallpaperPicker, setShowWallpaperPicker] = useState<boolean>(false);

  // In-Chat Message Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recIntervalRef = useRef<any>(null);
  const longPressTimerRef = useRef<any>(null);
  const isLongPressActiveRef = useRef(false);

  const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉'];
  const EXTENDED_EMOJIS = [
    '👏', '💯', '✨', '🔒', '👀', '💡', '🚀', '🤝', '🥳', '🙌', '🎯', '⚡', '☕', '🌟'
  ];

  // Matching message IDs within this conversation
  const matchingMessages = React.useMemo(() => {
    const q = messageSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return messages
      .filter((m) => {
        const inText = m.text?.toLowerCase().includes(q);
        const inDoc = m.documentMeta?.name?.toLowerCase().includes(q);
        return inText || inDoc;
      })
      .map((m) => m.id);
  }, [messages, messageSearchQuery]);

  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(`msg-bubble-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleNextMatch = () => {
    if (matchingMessages.length === 0) return;
    const nextIdx = (activeMatchIndex + 1) % matchingMessages.length;
    setActiveMatchIndex(nextIdx);
    scrollToMessage(matchingMessages[nextIdx]);
    Haptics.tap();
  };

  const handlePrevMatch = () => {
    if (matchingMessages.length === 0) return;
    const prevIdx =
      (activeMatchIndex - 1 + matchingMessages.length) % matchingMessages.length;
    setActiveMatchIndex(prevIdx);
    scrollToMessage(matchingMessages[prevIdx]);
    Haptics.tap();
  };

  function highlightMessageText(text: string, query: string) {
    if (!query.trim()) return text;
    const escaped = query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={i}
          className="bg-amber-400 text-black font-semibold rounded-xs px-0.5"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  }

  const startLongPress = (msgId: string) => {
    isLongPressActiveRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      setReactingMsgId(msgId);
      setShowExtendedPicker(false);
      Haptics.tap();
    }, 420);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleMsgContextMenu = (e: React.MouseEvent, msgId: string) => {
    e.preventDefault();
    setReactingMsgId(msgId);
    setShowExtendedPicker(false);
    Haptics.tap();
  };

  const selectReactionEmoji = (msgId: string, emoji: string) => {
    onToggleReaction(msgId, emoji);
    setReactingMsgId(null);
    setShowExtendedPicker(false);
  };

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sync disappearing choice with chat default
  useEffect(() => {
    setDisappearingChoice(chat.disappearingDefault || 0);
  }, [chat.id, chat.disappearingDefault]);

  // Real-time suggestions on typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (autocorrectEnabled) {
      const suggestions = getActiveWordSuggestions(val);
      setActiveSuggestions(suggestions);
    } else {
      setActiveSuggestions([]);
    }
  };

  // Autocorrect on Space key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' && autocorrectEnabled) {
      const res = autoCorrectText(inputText);
      if (res.replaced) {
        setInputText(res.newText + ' ');
        setActiveSuggestions([]);
        Haptics.tap();
        return;
      }
    }
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const applySuggestion = (suggestedWord: string) => {
    const words = inputText.split(/\s+/);
    words[words.length - 1] = suggestedWord;
    setInputText(words.join(' ') + ' ');
    setActiveSuggestions([]);
    Haptics.tap();
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    const isDisapp = disappearingChoice > 0;

    onSendMessage({
      text: inputText.trim(),
      isDisappearing: isDisapp,
      disappearingDuration: isDisapp ? disappearingChoice : undefined,
    });

    setInputText('');
    setActiveSuggestions([]);
    setShowAttachMenu(false);
    Haptics.tap();
  };

  // Send a View-Once photo
  const handleSendViewOncePhoto = () => {
    onSendMessage({
      text: 'Confidential View-Once Photo',
      isViewOnce: true,
      mediaType: 'image',
      mediaUrl:
        'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
    });
    setShowAttachMenu(false);
    Haptics.syncSuccess();
  };

  // Send a sample offline document
  const handleSendDocument = () => {
    onSendMessage({
      text: 'Encrypted Security Protocol v4.pdf',
      mediaType: 'document',
      documentMeta: {
        name: 'Encrypted_Security_Protocol_v4.pdf',
        size: '1.4 MB',
        type: 'pdf',
        cachedOffline: true,
      },
    });
    setShowAttachMenu(false);
    Haptics.documentEdit();
  };

  // Voice note simulation
  const handleToggleVoiceRecord = () => {
    if (!isRecordingAudio) {
      setIsRecordingAudio(true);
      setRecordingSeconds(0);
      Haptics.tap();
      recIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(recIntervalRef.current);
      setIsRecordingAudio(false);
      const secs = recordingSeconds || 4;
      onSendMessage({
        text: `Voice message (${secs}s)`,
        mediaType: 'audio',
      });
      Haptics.syncSuccess();
    }
  };

  // Text-To-Speech with gemini-3.8-flash-tts
  const handleTTS = async (msg: ChatMessage) => {
    if (ttsLoadingId) return;
    setTtsLoadingId(msg.id);
    Haptics.tap();

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: msg.text,
          voiceName: ttsVoice || 'Zephyr',
        }),
      });

      const data = await res.json();
      if (data.audio) {
        setPlayingAudioId(msg.id);
        playBase64Audio(data.audio, () => {
          setPlayingAudioId(null);
        });
      }
    } catch (err) {
      console.error('TTS playback failed:', err);
    } finally {
      setTtsLoadingId(null);
    }
  };

  // Dynamic Wallpaper background (per-conversation override or global fallback)
  const activeCustomPreset = chat.customWallpaper
    ? WALLPAPER_PRESETS.find((p) => p.id === chat.customWallpaper)
    : null;

  const getActiveWallpaperStyle = (): React.CSSProperties => {
    if (activeCustomPreset) {
      return { background: activeCustomPreset.backgroundCss };
    }
    return {};
  };

  const getWallpaperClasses = () => {
    if (activeCustomPreset) {
      const withDoodle = chat.customWallpaperDoodle !== false;
      return withDoodle
        ? activeCustomPreset.isLight
          ? 'bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px]'
          : 'bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]'
        : '';
    }

    switch (wallpaper) {
      case 'emerald':
        return 'bg-[#0b141a] bg-radial from-[#003b30]/30 to-[#0b141a]';
      case 'navy':
        return 'bg-[#09111e] bg-radial from-[#132238]/40 to-[#09111e]';
      case 'classic':
        return theme === 'light' ? 'bg-[#efeae2]' : 'bg-[#111b21]';
      case 'doodle':
      default:
        return theme === 'light'
          ? 'bg-[#efeae2] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]'
          : 'bg-[#0b141a] bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px]';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0b141a] select-text">
      {/* Chat Room Top Bar */}
      <div className="h-16 px-4 bg-[#202c33] border-b border-[#2a3942] flex items-center justify-between text-[#e9edef] z-10 shadow-sm">
        <div className="flex items-center gap-3">
          {isMobileView && onBackToList && (
            <button
              onClick={onBackToList}
              className="p-1 -ml-2 text-[#00a884] hover:text-white"
            >
              ← Back
            </button>
          )}

          <div
            className="relative cursor-pointer"
            onClick={chat.isGroup ? onOpenGroupSettings : undefined}
          >
            <div className="h-10 w-10 rounded-full overflow-hidden border border-[#2a3942]">
              <img
                src={chat.avatar}
                alt={chat.name}
                className="h-full w-full object-cover"
              />
            </div>
            {chat.isOnline && (
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#00a884] border-2 border-[#202c33]" />
            )}
          </div>

          <div
            className="cursor-pointer"
            onClick={chat.isGroup ? onOpenGroupSettings : undefined}
          >
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold text-white leading-tight">
                {chat.name}
              </h2>
              {chat.verifiedSafetyNumber && (
                <span title="Safety Number Verified">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#00a884]" />
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#8696a0]">
              {chat.isGroup
                ? `${chat.participants?.length || 0} participants`
                : chat.isOnline
                ? 'online'
                : chat.lastSeen || 'offline'}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 text-[#aebac1]">
          {/* End-to-End Voice Call */}
          <button
            onClick={() => {
              Haptics.tap();
              onStartVoiceCall();
            }}
            className="p-2 rounded-full hover:bg-[#374248] text-[#00a884] hover:text-white transition-colors"
            title="Start End-to-End Encrypted Voice Call"
          >
            <Phone className="h-5 w-5" />
          </button>

          {/* Custom Chat Wallpaper Picker Button */}
          <button
            onClick={() => {
              Haptics.tap();
              setShowWallpaperPicker(true);
            }}
            className="p-2 rounded-full hover:bg-[#374248] text-amber-400 hover:text-white transition-colors"
            title="Custom Chat Wallpaper (Per-Conversation)"
          >
            <Paintbrush className="h-5 w-5" />
          </button>

          {/* Google Workspace Integration */}
          <button
            onClick={() => {
              Haptics.tap();
              onOpenWorkspace();
            }}
            className="p-2 rounded-full hover:bg-[#374248] hover:text-white transition-colors"
            title="Google Drive, Chat & Gmail Integration"
          >
            <HardDrive className="h-5 w-5 text-sky-400" />
          </button>

          {/* Safety Code Modal */}
          <button
            onClick={() => {
              Haptics.tap();
              onOpenSafetyCode();
            }}
            className="p-2 rounded-full hover:bg-[#374248] hover:text-white transition-colors"
            title="Verify 60-digit Encryption Safety Number"
          >
            <Lock className="h-5 w-5" />
          </button>

          {/* Secondary In-Chat Message Search */}
          <button
            onClick={() => {
              Haptics.tap();
              setIsSearchOpen((prev) => !prev);
              if (!isSearchOpen) {
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }
            }}
            className={`p-2 rounded-full transition-colors ${
              isSearchOpen
                ? 'bg-[#374248] text-[#00a884]'
                : 'hover:bg-[#374248] hover:text-white text-[#aebac1]'
            }`}
            title="Search messages in this conversation"
          >
            <Search className="h-5 w-5" />
          </button>

          {chat.isGroup && (
            <button
              onClick={() => {
                Haptics.tap();
                onOpenGroupSettings();
              }}
              className="p-2 rounded-full hover:bg-[#374248] hover:text-white transition-colors"
              title="Group Privacy & Member Settings"
            >
              <Users className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Secondary Message Search Bar within Active Conversation */}
      {isSearchOpen && (
        <div className="bg-[#182229] border-b border-[#202c33] px-4 py-2 flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2 duration-150 z-20 shadow-md">
          <div className="relative flex-1 flex items-center gap-2 bg-[#202c33] px-3 py-1.5 rounded-lg border border-[#2a3942] focus-within:border-[#00a884]">
            <Search className="h-4 w-4 text-[#8696a0] shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search text messages in this conversation..."
              value={messageSearchQuery}
              onChange={(e) => {
                setMessageSearchQuery(e.target.value);
                setActiveMatchIndex(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (e.shiftKey) handlePrevMatch();
                  else handleNextMatch();
                } else if (e.key === 'Escape') {
                  setIsSearchOpen(false);
                  setMessageSearchQuery('');
                  Haptics.tap();
                }
              }}
              className="w-full bg-transparent focus:outline-none text-white text-xs placeholder-[#8696a0]"
            />
            {messageSearchQuery && (
              <button
                onClick={() => {
                  setMessageSearchQuery('');
                  setActiveMatchIndex(0);
                  Haptics.tap();
                }}
                className="text-[#8696a0] hover:text-white"
                title="Clear query"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Matches Counter & Navigation Arrows */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] text-[#8696a0] min-w-16 text-center">
              {messageSearchQuery.trim()
                ? matchingMessages.length > 0
                  ? `${activeMatchIndex + 1} of ${matchingMessages.length}`
                  : '0 matches'
                : `${messages.length} msgs`}
            </span>

            <button
              onClick={handlePrevMatch}
              disabled={matchingMessages.length <= 1}
              className="p-1 rounded-md bg-[#202c33] hover:bg-[#2a3942] text-[#8696a0] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous match (Shift+Enter)"
            >
              <ChevronUp className="h-4 w-4" />
            </button>

            <button
              onClick={handleNextMatch}
              disabled={matchingMessages.length <= 1}
              className="p-1 rounded-md bg-[#202c33] hover:bg-[#2a3942] text-[#8696a0] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next match (Enter)"
            >
              <ChevronDown className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                setIsSearchOpen(false);
                setMessageSearchQuery('');
                Haptics.tap();
              }}
              className="p-1 rounded-md text-[#8696a0] hover:text-white hover:bg-[#202c33] transition-colors ml-1"
              title="Close search (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Disappearing Messages Active Header Notice */}
      {disappearingChoice > 0 && (
        <div className="bg-[#182229] border-b border-[#202c33] px-4 py-1.5 flex items-center justify-between text-[11px] text-amber-300">
          <div className="flex items-center gap-2">
            <Timer className="h-3.5 w-3.5" />
            <span>
              Disappearing messages are on. New messages will dissolve after{' '}
              {disappearingChoice === 10
                ? '10 seconds'
                : disappearingChoice === 86400
                ? '24 hours'
                : `${disappearingChoice}s`}
              .
            </span>
          </div>
          <button
            onClick={() => setDisappearingChoice(0)}
            className="text-[10px] text-[#8696a0] hover:text-white underline ml-2"
          >
            Turn Off
          </button>
        </div>
      )}

      {/* Scrollable Messages Stream */}
      <div
        className={`flex-1 overflow-y-auto p-4 space-y-3 transition-colors ${getWallpaperClasses()}`}
        style={getActiveWallpaperStyle()}
      >
        {/* End-to-End Encryption Security Pill */}
        <div className="flex justify-center my-3">
          <div
            onClick={onOpenSafetyCode}
            className="cursor-pointer max-w-sm px-3.5 py-1.5 rounded-lg bg-[#182229]/90 border border-[#202c33] text-[11px] text-[#ffd279] text-center shadow flex items-center gap-2 hover:border-[#00a884]/40 transition-colors"
          >
            <Lock className="h-3.5 w-3.5 shrink-0 text-[#00a884]" />
            <span>
              Messages and calls are end-to-end encrypted with Signal Protocol
              AES-256. Tap to verify safety number.
            </span>
          </div>
        </div>

        {/* Messages */}
        {messages.map((msg) => {
          const isMe = msg.senderId === 'me';
          const isSearchActive =
            isSearchOpen && messageSearchQuery.trim().length > 0;
          const isMatch = isSearchActive && matchingMessages.includes(msg.id);
          const isActiveMatch =
            isSearchActive &&
            matchingMessages.length > 0 &&
            matchingMessages[activeMatchIndex] === msg.id;

          return (
            <div
              key={msg.id}
              id={`msg-bubble-${msg.id}`}
              className={`flex flex-col ${
                isMe ? 'items-end' : 'items-start'
              } group transition-all duration-200 ${
                isActiveMatch ? 'scale-[1.02]' : ''
              }`}
            >
              {chat.isGroup && !isMe && (
                <span className="text-[10px] text-[#00a884] font-medium ml-2 mb-0.5">
                  {msg.senderName}
                </span>
              )}

              <div
                onTouchStart={() => startLongPress(msg.id)}
                onTouchEnd={cancelLongPress}
                onTouchMove={cancelLongPress}
                onMouseDown={() => startLongPress(msg.id)}
                onMouseUp={cancelLongPress}
                onMouseLeave={cancelLongPress}
                onContextMenu={(e) => handleMsgContextMenu(e, msg.id)}
                className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 py-2 text-xs shadow-md transition-all select-none ${
                  isMe
                    ? 'bg-[#005c4b] text-white rounded-tr-xs'
                    : 'bg-[#202c33] text-[#e9edef] rounded-tl-xs'
                } ${
                  isActiveMatch
                    ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-[#0b141a] shadow-lg shadow-amber-500/20'
                    : isMatch
                    ? 'ring-1 ring-amber-400/50'
                    : ''
                }`}
              >
                {/* Floating WhatsApp-Style Emoji Reaction Bar */}
                {reactingMsgId === msg.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute -top-11 ${
                      isMe ? 'right-0' : 'left-0'
                    } z-30 flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#1f2c34] border border-[#2a3942] shadow-2xl backdrop-blur-md animate-in zoom-in-90 fade-in duration-150`}
                  >
                    {QUICK_EMOJIS.map((emoji) => {
                      const userReacted =
                        msg.reactions?.[emoji]?.includes('You');
                      return (
                        <button
                          key={emoji}
                          onClick={() => selectReactionEmoji(msg.id, emoji)}
                          className={`p-1 text-base hover:scale-130 active:scale-95 transition-transform rounded-full ${
                            userReacted ? 'bg-[#00a884]/30' : ''
                          }`}
                        >
                          {emoji}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setShowExtendedPicker(!showExtendedPicker)}
                      className="p-1 text-[#8696a0] hover:text-white rounded-full hover:bg-[#2a3942] transition-colors"
                      title="More Emojis"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Extended Emoji Tray if '+' is clicked */}
                {reactingMsgId === msg.id && showExtendedPicker && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute -top-24 ${
                      isMe ? 'right-0' : 'left-0'
                    } z-30 flex items-center gap-1.5 p-2 rounded-2xl bg-[#1f2c34] border border-[#2a3942] shadow-2xl backdrop-blur-md animate-in zoom-in-95 fade-in duration-150`}
                  >
                    {EXTENDED_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => selectReactionEmoji(msg.id, emoji)}
                        className="p-1 text-base hover:scale-130 active:scale-95 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* Desktop hover quick-reaction trigger */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setReactingMsgId(reactingMsgId === msg.id ? null : msg.id);
                    setShowExtendedPicker(false);
                  }}
                  className={`hidden sm:flex absolute top-1 ${
                    isMe ? '-left-8' : '-right-8'
                  } opacity-0 group-hover:opacity-100 p-1 rounded-full bg-[#202c33]/80 hover:bg-[#2a3942] text-[#8696a0] hover:text-white border border-[#2a3942] shadow transition-opacity`}
                  title="Long press or click to react with emoji"
                >
                  <SmilePlus className="h-3.5 w-3.5" />
                </button>

                {/* Photo / View-Once Photo (Never Deleted) */}
                {msg.isViewOnce || msg.mediaUrl ? (
                  <div
                    onClick={() => {
                      Haptics.tap();
                      onOpenViewOnce(msg);
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-[#111b21] border border-[#00a884]/40 hover:border-[#00a884] cursor-pointer transition-colors"
                  >
                    <div className="h-9 w-9 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                      ①
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        Encrypted Media Photo
                      </p>
                      <p className="text-[10px] text-[#8696a0]">
                        Tap to view full encrypted photo
                      </p>
                    </div>
                  </div>
                ) : msg.mediaType === 'document' && msg.documentMeta ? (
                  /* Document Attachment */
                  <div
                    onClick={() => {
                      Haptics.tap();
                      onOpenDocument(msg.documentMeta!);
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-[#111b21] border border-[#2a3942] hover:border-[#00a884]/60 cursor-pointer transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {highlightMessageText(
                          msg.documentMeta.name,
                          isSearchActive ? messageSearchQuery : ''
                        )}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-[#8696a0]">
                        <span>{msg.documentMeta.size}</span>
                        <span>•</span>
                        <span className="text-[#00a884]">
                          Cached for Offline
                        </span>
                      </div>
                    </div>
                  </div>
                ) : msg.mediaType === 'audio' ? (
                  /* Audio Voice Message Waveform */
                  <div className="flex items-center gap-2 py-1 min-w-[200px]">
                    <button
                      onClick={() => handleTTS(msg)}
                      className="h-8 w-8 rounded-full bg-[#00a884] text-[#111b21] flex items-center justify-center hover:bg-[#02906f]"
                    >
                      {playingAudioId === msg.id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4 ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1 flex items-center gap-1 h-6">
                      {Array.from({ length: 18 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-white/40 rounded-full"
                          style={{
                            height: `${Math.max(
                              4,
                              Math.sin(i * 0.6) * 16 + 10
                            )}px`,
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-[#8696a0]">
                      {msg.audioDuration ? `0:0${msg.audioDuration}` : '0:05'}
                    </span>
                  </div>
                ) : (
                  /* Normal Text */
                  <p className="leading-relaxed whitespace-pre-wrap select-text">
                    {highlightMessageText(
                      msg.text,
                      isSearchActive ? messageSearchQuery : ''
                    )}
                  </p>
                )}

                {/* Emoji Reactions Pills beneath message */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {Object.entries(msg.reactions).map(([emoji, users]) => {
                      if (!users || users.length === 0) return null;
                      const hasUserReacted = users.includes('You');
                      return (
                        <button
                          key={emoji}
                          onClick={(e) => {
                            e.stopPropagation();
                            Haptics.tap();
                            onToggleReaction(msg.id, emoji);
                          }}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] border shadow-xs transition-all ${
                            hasUserReacted
                              ? 'bg-[#00a884]/30 border-[#00a884] text-white font-semibold'
                              : 'bg-[#182229]/80 border-[#2a3942] text-[#d1d7db] hover:border-[#8696a0]'
                          }`}
                          title={`${emoji} (${users.join(', ')})`}
                        >
                          <span>{emoji}</span>
                          {users.length > 1 && (
                            <span className="text-[10px] text-[#aebac1]">
                              {users.length}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Bubble Footer */}
                <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-[#8696a0]">
                  {/* Disappearing Timer Indicator */}
                  {msg.isDisappearing && (
                    <span className="flex items-center gap-0.5 text-amber-300 font-mono">
                      <Timer className="h-3 w-3" />
                      {msg.disappearingDuration}s
                    </span>
                  )}

                  {/* Gemini TTS Listen button */}
                  {!msg.isViewOnce && (
                    <button
                      onClick={() => handleTTS(msg)}
                      disabled={ttsLoadingId === msg.id}
                      className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity p-0.5"
                      title="Synthesize Voice with Gemini 3.8 Flash TTS"
                    >
                      <Volume2
                        className={`h-3 w-3 ${
                          ttsLoadingId === msg.id
                            ? 'animate-spin text-[#00a884]'
                            : ''
                        }`}
                      />
                    </button>
                  )}

                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  {/* WhatsApp Checkmarks */}
                  {isMe && (
                    <span>
                      {msg.status === 'read' ? (
                        <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" />
                      ) : msg.status === 'delivered' ? (
                        <CheckCheck className="h-3.5 w-3.5 text-[#8696a0]" />
                      ) : (
                        <Check className="h-3.5 w-3.5 text-[#8696a0]" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Real-time Predictive Autocorrect Suggestion Bar */}
      {activeSuggestions.length > 0 && (
        <div className="bg-[#182229] border-t border-[#202c33] px-4 py-1.5 flex items-center gap-2 overflow-x-auto text-xs animate-in fade-in duration-150">
          <span className="text-[10px] text-[#8696a0] font-medium flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-[#00a884]" /> Autocorrect:
          </span>
          {activeSuggestions.map((sug, idx) => (
            <button
              key={idx}
              onClick={() => applySuggestion(sug)}
              className="px-2.5 py-0.5 rounded-full bg-[#202c33] hover:bg-[#00a884] hover:text-[#111b21] text-white border border-[#2a3942] text-xs transition-colors"
            >
              {sug}
            </button>
          ))}
        </div>
      )}

      {/* Attachment Popover Menu */}
      {showAttachMenu && (
        <div className="p-3 bg-[#182229] border-t border-[#202c33] grid grid-cols-4 gap-2 animate-in slide-in-from-bottom-2 text-xs">
          {/* Document */}
          <button
            onClick={handleSendDocument}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] transition-colors"
          >
            <div className="h-9 w-9 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-[11px]">Offline Doc</span>
          </button>

          {/* View-Once Photo */}
          <button
            onClick={handleSendViewOncePhoto}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] transition-colors"
          >
            <div className="h-9 w-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Eye className="h-5 w-5" />
            </div>
            <span className="text-[11px]">View Once</span>
          </button>

          {/* Google Drive */}
          <button
            onClick={() => {
              setShowAttachMenu(false);
              onOpenWorkspace();
            }}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] transition-colors"
          >
            <div className="h-9 w-9 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <HardDrive className="h-5 w-5" />
            </div>
            <span className="text-[11px]">Google Drive</span>
          </button>

          {/* Disappearing Timer Toggle */}
          <button
            onClick={() => {
              Haptics.tap();
              setDisappearingChoice((prev) => (prev === 0 ? 10 : prev === 10 ? 86400 : 0));
            }}
            className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-colors ${
              disappearingChoice > 0
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef]'
            }`}
          >
            <div className="h-9 w-9 rounded-full bg-[#202c33] flex items-center justify-center">
              <Timer className="h-5 w-5" />
            </div>
            <span className="text-[11px]">
              {disappearingChoice === 0
                ? 'Disappear: Off'
                : disappearingChoice === 10
                ? 'Timer: 10s'
                : 'Timer: 24h'}
            </span>
          </button>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-3 bg-[#202c33] border-t border-[#2a3942] flex items-center gap-2 z-10">
        <button
          onClick={() => {
            Haptics.tap();
            setShowAttachMenu(!showAttachMenu);
          }}
          className={`p-2 rounded-full hover:bg-[#374248] transition-colors ${
            showAttachMenu ? 'text-[#00a884] bg-[#374248]' : 'text-[#8696a0]'
          }`}
          title="Share files, view-once photos, or set disappearing timer"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        {isRecordingAudio ? (
          <div className="flex-1 flex items-center justify-between px-4 py-2 bg-[#111b21] rounded-full text-xs text-rose-400 animate-pulse">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
              Recording encrypted voice note... {recordingSeconds}s
            </span>
            <span className="text-[11px] text-[#8696a0]">Tap mic to finish</span>
          </div>
        ) : (
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              disappearingChoice > 0
                ? `Disappearing message (${disappearingChoice}s)...`
                : 'Type a message (auto-correct active)...'
            }
            className="flex-1 px-4 py-2.5 bg-[#2a3942] rounded-full text-xs text-white placeholder-[#8696a0] focus:outline-none focus:ring-1 focus:ring-[#00a884]"
          />
        )}

        {inputText.trim() ? (
          <button
            onClick={handleSend}
            className="p-2.5 rounded-full bg-[#00a884] hover:bg-[#02906f] text-[#111b21] transition-transform active:scale-95 shadow"
          >
            <Send className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleToggleVoiceRecord}
            className={`p-2.5 rounded-full transition-all active:scale-95 ${
              isRecordingAudio
                ? 'bg-rose-500 text-white animate-bounce'
                : 'bg-[#00a884] hover:bg-[#02906f] text-[#111b21]'
            }`}
            title="Record Voice Note"
          >
            <Mic className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Custom Chat Wallpaper Picker Modal (Per-Conversation) */}
      <WallpaperPickerModal
        isOpen={showWallpaperPicker}
        chatName={chat.name}
        currentWallpaperId={chat.customWallpaper || 'default-doodle'}
        hasDoodleOverlay={chat.customWallpaperDoodle !== false}
        onSelectWallpaper={(presetId, withDoodle) => {
          onUpdateWallpaper(chat.id, presetId, withDoodle);
        }}
        onClose={() => setShowWallpaperPicker(false)}
        onResetToDefault={() => {
          onUpdateWallpaper(chat.id, 'default-doodle', true);
        }}
      />
    </div>
  );
};
