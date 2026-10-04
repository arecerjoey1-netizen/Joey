/**
 * WhisperPulse - Encrypted Messenger
 * WhatsApp-style app with E2E encrypted voice calls, disappearing media,
 * group chats with custom privacy, cross-platform syncing, document offline vault,
 * biometric security layer, real-time autocorrect, rumbler haptics,
 * and Google Workspace (Chat, Drive, Gmail) integration.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { BiometricLockModal } from './components/BiometricLockModal';
import { VoiceCallModal } from './components/VoiceCallModal';
import { DisappearingMediaModal } from './components/DisappearingMediaModal';
import { GroupSettingsModal } from './components/GroupSettingsModal';
import { LinkedDevicesModal } from './components/LinkedDevicesModal';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import { GoogleWorkspaceModal } from './components/GoogleWorkspaceModal';
import { SafetyCodeModal } from './components/SafetyCodeModal';
import { SettingsModal, AppSettings } from './components/SettingsModal';
import { NewGroupModal } from './components/NewGroupModal';
import { DocsVaultModal } from './components/DocsVaultModal';
import { NotificationBanner, NotificationItem } from './components/NotificationBanner';
import {
  ChatConversation,
  ChatMessage,
  LinkedDevice,
  CallSession,
  GroupPrivacySettings,
  DocumentMeta,
} from './types/chat';
import {
  INITIAL_CONVERSATIONS,
  INITIAL_MESSAGES,
  INITIAL_DEVICES,
} from './utils/initialData';
import { Haptics } from './utils/haptics';
import { OfflineDoc, getOfflineDocs } from './utils/offlineDocsStore';
import { DriveFile } from './services/googleWorkspace';
import { generateSafetyNumber } from './utils/cryptoSecurity';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  wallpaper: 'doodle',
  notificationsEnabled: true,
  notificationSound: 'whistle',
  notificationPreview: true,
  biometricLockEnabled: true,
  autoLockTimeout: 900,
  rumblerEnabled: true,
  rumblerStrength: 'normal',
  autocorrectEnabled: true,
  isOfflineSimulated: false,
  ttsVoice: 'Zephyr',
  geminiModel: 'gemini-3.8-flash',
};

export default function App() {
  // App state with per-conversation custom wallpaper restoration
  const [conversations, setConversations] = useState<ChatConversation[]>(() => {
    try {
      const savedWallpapers = JSON.parse(
        localStorage.getItem('whisperpulse_chat_wallpapers') || '{}'
      );
      return INITIAL_CONVERSATIONS.map((c) => {
        if (savedWallpapers[c.id]) {
          return {
            ...c,
            customWallpaper: savedWallpapers[c.id].wallpaperId,
            customWallpaperDoodle: savedWallpapers[c.id].withDoodle,
          };
        }
        return c;
      });
    } catch {
      return INITIAL_CONVERSATIONS;
    }
  });
  const [messagesByChat, setMessagesByChat] = useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES);
  const [activeChatId, setActiveChatId] = useState<string>('contact-elena');
  const [devices, setDevices] = useState<LinkedDevice[]>(INITIAL_DEVICES);
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('whisperpulse_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Biometric Lock
  const [isLocked, setIsLocked] = useState(false);

  // Active Call Session
  const [callSession, setCallSession] = useState<CallSession | null>(null);

  // View-Once Media Modal
  const [viewOnceMsg, setViewOnceMsg] = useState<ChatMessage | null>(null);

  // Document Viewer
  const [selectedDoc, setSelectedDoc] = useState<OfflineDoc | null>(null);

  // Notifications
  const [activeNotification, setActiveNotification] = useState<NotificationItem | null>(null);

  // Modals
  const [showSettings, setShowSettings] = useState(false);
  const [showLinkedDevices, setShowLinkedDevices] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [showDocsVault, setShowDocsVault] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showSafetyCode, setShowSafetyCode] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);

  // Mobile layout state
  const [isMobileView, setIsMobileView] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // Responsive check
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save settings
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('whisperpulse_settings', JSON.stringify(newSettings));
    } catch {}
  };

  // Find active chat object
  const activeChat =
    conversations.find((c) => c.id === activeChatId) || conversations[0];
  const activeMessages = messagesByChat[activeChatId] || [];

  // Real-time emoji reaction synced across all devices
  const handleToggleReaction = (messageId: string, emoji: string) => {
    setMessagesByChat((prev) => {
      const updated = { ...prev };
      const chatMsgs = updated[activeChatId] || [];
      updated[activeChatId] = chatMsgs.map((m) => {
        if (m.id !== messageId) return m;

        const currentReactions = { ...(m.reactions || {}) };
        const usersForEmoji = currentReactions[emoji] || [];
        const hasReacted = usersForEmoji.includes('You');

        if (hasReacted) {
          const remaining = usersForEmoji.filter((u) => u !== 'You');
          if (remaining.length === 0) {
            delete currentReactions[emoji];
          } else {
            currentReactions[emoji] = remaining;
          }
        } else {
          currentReactions[emoji] = [...usersForEmoji, 'You'];
        }

        return {
          ...m,
          reactions: currentReactions,
        };
      });
      return updated;
    });

    // Real-time multi-device cloud synchronization
    setDevices((prev) =>
      prev.map((d) => ({
        ...d,
        lastActive: 'Active now',
        status: 'active',
      }))
    );

    Haptics.syncSuccess();
  };

  // Custom chat wallpaper saved per-conversation
  const handleUpdateChatWallpaper = (
    chatId: string,
    wallpaperId: string,
    withDoodle: boolean
  ) => {
    setConversations((prev) => {
      const updated = prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              customWallpaper: wallpaperId,
              customWallpaperDoodle: withDoodle,
            }
          : c
      );
      try {
        const currentSaved = JSON.parse(
          localStorage.getItem('whisperpulse_chat_wallpapers') || '{}'
        );
        currentSaved[chatId] = { wallpaperId, withDoodle };
        localStorage.setItem(
          'whisperpulse_chat_wallpapers',
          JSON.stringify(currentSaved)
        );
      } catch (e) {}
      return updated;
    });

    Haptics.syncSuccess();
  };

  // Send message handler
  const handleSendMessage = async (payload: {
    text: string;
    isDisappearing?: boolean;
    disappearingDuration?: number;
    isViewOnce?: boolean;
    mediaType?: 'image' | 'video' | 'audio' | 'document';
    mediaUrl?: string;
    documentMeta?: DocumentMeta;
  }) => {
    const expiresAt =
      payload.isDisappearing && payload.disappearingDuration
        ? Date.now() + payload.disappearingDuration * 1000
        : undefined;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      chatId: activeChatId,
      senderId: 'me',
      senderName: 'You',
      text: payload.text,
      timestamp: Date.now(),
      status: 'sent',
      isEncrypted: true,
      isDisappearing: payload.isDisappearing,
      disappearingDuration: payload.disappearingDuration,
      expiresAt,
      isViewOnce: payload.isViewOnce,
      isViewed: false,
      mediaType: payload.mediaType,
      mediaUrl: payload.mediaUrl,
      documentMeta: payload.documentMeta,
    };

    setMessagesByChat((prev) => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), newMsg],
    }));

    // Update message status to delivered then read
    setTimeout(() => {
      setMessagesByChat((prev) => ({
        ...prev,
        [activeChatId]: (prev[activeChatId] || []).map((m) =>
          m.id === newMsg.id ? { ...m, status: 'delivered' } : m
        ),
      }));
    }, 600);

    setTimeout(() => {
      setMessagesByChat((prev) => ({
        ...prev,
        [activeChatId]: (prev[activeChatId] || []).map((m) =>
          m.id === newMsg.id ? { ...m, status: 'read' } : m
        ),
      }));
    }, 1200);

    // If sending to Gemini AI Bot, invoke server-side Gemini
    if (activeChat.isGeminiBot) {
      handleGeminiAiReply(payload.text);
    } else {
      // Occasional realistic contact reply
      if (Math.random() > 0.4 && !activeChat.isGroup) {
        setTimeout(() => {
          triggerContactReply(activeChat);
        }, 2200);
      }
    }
  };

  // Gemini AI multi-turn bot response
  const handleGeminiAiReply = async (userPrompt: string) => {
    try {
      const history = (messagesByChat['gemini-bot'] || []).slice(-8).map((m) => ({
        role: m.senderId === 'me' ? 'user' : 'model',
        content: m.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...history, { role: 'user', content: userPrompt }],
          systemInstruction:
            activeChat.geminiRole ||
            'You are WhisperPulse AI Assistant. Answer questions concisely, intelligently, and clearly.',
          model: settings.geminiModel || 'gemini-3.8-flash',
        }),
      });

      const data = await res.json();
      const replyText =
        data.text ||
        "I'm here to help you secure and manage your communications.";

      const aiMsg: ChatMessage = {
        id: `msg-gemini-${Date.now()}`,
        chatId: 'gemini-bot',
        senderId: 'gemini-bot',
        senderName: 'Gemini AI Assistant',
        senderAvatar: activeChat.avatar,
        text: replyText,
        timestamp: Date.now(),
        status: 'read',
        isEncrypted: true,
      };

      setMessagesByChat((prev) => ({
        ...prev,
        ['gemini-bot']: [...(prev['gemini-bot'] || []), aiMsg],
      }));

      if (settings.notificationsEnabled && activeChatId !== 'gemini-bot') {
        showNotification({
          id: `notif-${Date.now()}`,
          senderName: 'Gemini AI Assistant',
          senderAvatar: activeChat.avatar,
          text: replyText,
          type: 'message',
          chatId: 'gemini-bot',
        });
      }
    } catch (e) {
      console.error('Gemini bot error:', e);
    }
  };

  const triggerContactReply = (chat: ChatConversation) => {
    const replies = [
      'Received and securely verified with Curve25519.',
      'Got it! Storing this in our encrypted local vault.',
      'Confirmed. Call me whenever you are free to discuss over the encrypted line.',
      'Looks great. Let me check the offline document.',
    ];
    const text = replies[Math.floor(Math.random() * replies.length)];

    const replyMsg: ChatMessage = {
      id: `msg-reply-${Date.now()}`,
      chatId: chat.id,
      senderId: chat.id,
      senderName: chat.name,
      senderAvatar: chat.avatar,
      text,
      timestamp: Date.now(),
      status: 'read',
      isEncrypted: true,
    };

    setMessagesByChat((prev) => ({
      ...prev,
      [chat.id]: [...(prev[chat.id] || []), replyMsg],
    }));

    if (settings.notificationsEnabled && activeChatId !== chat.id) {
      showNotification({
        id: `notif-${Date.now()}`,
        senderName: chat.name,
        senderAvatar: chat.avatar,
        text,
        type: 'message',
        chatId: chat.id,
      });
    }
  };

  const showNotification = (notif: NotificationItem) => {
    setActiveNotification(notif);
    Haptics.tap();
    setTimeout(() => {
      setActiveNotification((cur) => (cur?.id === notif.id ? null : cur));
    }, 4500);
  };

  // Voice Call handlers
  const handleStartCall = () => {
    setCallSession({
      id: `call-${Date.now()}`,
      chatId: activeChat.id,
      contactName: activeChat.name,
      contactAvatar: activeChat.avatar,
      isIncoming: false,
      status: 'calling',
      isMuted: false,
      isSpeakerOn: true,
      isHold: false,
      durationSeconds: 0,
      isGeminiLive: activeChat.isGeminiBot || false,
      isE2EVerified: true,
    });

    // Auto connect after 2 seconds
    setTimeout(() => {
      setCallSession((prev) =>
        prev ? { ...prev, status: 'connected' } : null
      );
    }, 2400);
  };

  // Disappearing Media View Once
  const handleOpenViewOnce = (msg: ChatMessage) => {
    setViewOnceMsg(msg);
  };

  const handleBurnViewOnce = () => {
    if (!viewOnceMsg) return;
    setMessagesByChat((prev) => {
      const cId = viewOnceMsg.chatId;
      const list = prev[cId] || [];
      return {
        ...prev,
        [cId]: list.map((m) =>
          m.id === viewOnceMsg.id
            ? { ...m, isViewed: true }
            : m
        ),
      };
    });
    setViewOnceMsg(null);
  };

  // Document Viewer handlers
  const handleOpenDocumentFromMeta = (meta: DocumentMeta) => {
    const offlineDocs = getOfflineDocs();
    const existing = offlineDocs.find((d) => d.name === meta.name);
    if (existing) {
      setSelectedDoc(existing);
    } else {
      setSelectedDoc({
        id: `doc-${Date.now()}`,
        name: meta.name,
        type: (meta.type as any) || 'pdf',
        size: meta.size,
        content:
          meta.content ||
          `# ${meta.name}\n\nConfidential contents cached in encrypted memory.`,
        lastModified: Date.now(),
        cachedOffline: true,
      });
    }
  };

  // Attach Google Drive file into chat
  const handleAttachDriveFile = (file: DriveFile) => {
    handleSendMessage({
      text: `Google Drive File: ${file.name}`,
      mediaType: 'document',
      documentMeta: {
        name: file.name,
        size: 'Drive Cloud File',
        type: file.mimeType.includes('pdf') ? 'pdf' : 'text',
        driveId: file.id,
        cachedOffline: true,
      },
    });
    Haptics.syncSuccess();
  };

  // Multi-Device Cloud Sync
  const handleSyncAllDevices = () => {
    setDevices((prev) =>
      prev.map((d) => ({
        ...d,
        lastActive: 'Just now',
        status: 'active',
      }))
    );
    showNotification({
      id: `sync-${Date.now()}`,
      senderName: 'Cloud Sync Engine',
      text: 'Ratchet encryption keys and offline documents synchronized across all registered devices.',
      type: 'sync',
    });
  };

  const handleLinkNewDevice = () => {
    const newDev: LinkedDevice = {
      id: `dev-${Date.now()}`,
      name: 'Linked Tablet / Mobile Device',
      platform: 'ios',
      location: 'Primary Enclave',
      lastActive: 'Active now',
      isCurrent: false,
      status: 'active',
    };
    setDevices((prev) => [...prev, newDev]);
  };

  // Group creation
  const handleCreateGroup = (name: string, disappearingDefault: number) => {
    const newGroupId = `group-${Date.now()}`;
    const newGroup: ChatConversation = {
      id: newGroupId,
      name,
      avatar:
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
      isGroup: true,
      isOnline: true,
      unreadCount: 0,
      disappearingDefault,
      privacySettings: {
        adminsOnlySend: false,
        adminsOnlyEdit: true,
        whoCanAdd: 'admins',
        readReceipts: true,
        disappearingDefault,
      },
      participants: [
        {
          id: 'me',
          name: 'You (Creator)',
          avatar:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          role: 'admin',
        },
        {
          id: 'u-elena',
          name: 'Elena Rostova',
          avatar:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          role: 'member',
        },
      ],
      verifiedSafetyNumber: true,
      safetyCodeMatrix: generateSafetyNumber('me', newGroupId),
    };

    setConversations((prev) => [newGroup, ...prev]);
    setMessagesByChat((prev) => ({
      ...prev,
      [newGroupId]: [
        {
          id: `msg-g-init-${Date.now()}`,
          chatId: newGroupId,
          senderId: 'me',
          senderName: 'You',
          text: `You created group "${name}" with 256-bit AES end-to-end encryption.`,
          timestamp: Date.now(),
          status: 'read',
          isEncrypted: true,
        },
      ],
    }));

    setActiveChatId(newGroupId);
    if (isMobileView) setMobileShowChat(true);
  };

  // Group privacy update
  const handleUpdateGroupPrivacy = (newPrivacy: GroupPrivacySettings) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? {
              ...c,
              privacySettings: newPrivacy,
              disappearingDefault: newPrivacy.disappearingDefault,
            }
          : c
      )
    );
  };

  return (
    <div
      className={`h-screen w-screen flex flex-col overflow-hidden ${
        settings.theme === 'amoled'
          ? 'bg-black text-white'
          : settings.theme === 'light'
          ? 'bg-[#f0f2f5] text-zinc-900'
          : 'bg-[#0c1317] text-[#e9edef]'
      }`}
    >
      {/* Biometric Lock Fullscreen Overlay */}
      <BiometricLockModal
        isOpen={isLocked}
        onUnlock={() => setIsLocked(false)}
      />

      {/* In-App Notifications Toast */}
      <NotificationBanner
        notification={activeNotification}
        onDismiss={() => setActiveNotification(null)}
        onOpenChat={(chatId) => {
          setActiveChatId(chatId);
          if (isMobileView) setMobileShowChat(true);
        }}
      />

      {/* Main Dual-Pane or Mobile Single-Pane App Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {(!isMobileView || !mobileShowChat) && (
          <Sidebar
            conversations={conversations}
            activeChatId={activeChatId}
            onSelectChat={(id) => {
              setActiveChatId(id);
              if (isMobileView) setMobileShowChat(true);
            }}
            onOpenSettings={() => setShowSettings(true)}
            onOpenLinkedDevices={() => setShowLinkedDevices(true)}
            onOpenWorkspace={() => setShowWorkspace(true)}
            onOpenDocsVault={() => setShowDocsVault(true)}
            onLockApp={() => setIsLocked(true)}
            onCreateGroup={() => setShowNewGroup(true)}
            isOfflineMode={settings.isOfflineSimulated}
          />
        )}

        {/* Chat Area */}
        {(!isMobileView || mobileShowChat) && (
          <ChatArea
            chat={activeChat}
            messages={activeMessages}
            onSendMessage={handleSendMessage}
            onToggleReaction={handleToggleReaction}
            onUpdateWallpaper={handleUpdateChatWallpaper}
            onStartVoiceCall={handleStartCall}
            onOpenSafetyCode={() => setShowSafetyCode(true)}
            onOpenGroupSettings={() => setShowGroupSettings(true)}
            onOpenViewOnce={handleOpenViewOnce}
            onOpenDocument={handleOpenDocumentFromMeta}
            onOpenWorkspace={() => setShowWorkspace(true)}
            theme={settings.theme}
            wallpaper={settings.wallpaper}
            autocorrectEnabled={settings.autocorrectEnabled}
            ttsVoice={settings.ttsVoice}
            isMobileView={isMobileView}
            onBackToList={() => setMobileShowChat(false)}
          />
        )}
      </div>

      {/* End-to-End Encrypted Voice Call Screen */}
      {callSession && (
        <VoiceCallModal
          session={callSession}
          onEndCall={() => setCallSession(null)}
          onToggleMute={() =>
            setCallSession((prev) =>
              prev ? { ...prev, isMuted: !prev.isMuted } : null
            )
          }
          onToggleSpeaker={() =>
            setCallSession((prev) =>
              prev ? { ...prev, isSpeakerOn: !prev.isSpeakerOn } : null
            )
          }
          onToggleHold={() =>
            setCallSession((prev) =>
              prev ? { ...prev, isHold: !prev.isHold } : null
            )
          }
          onOpenSafetyCode={() => setShowSafetyCode(true)}
        />
      )}

      {/* View-Once Disappearing Media Modal */}
      {viewOnceMsg && (
        <DisappearingMediaModal
          isOpen={true}
          mediaUrl={
            viewOnceMsg.mediaUrl ||
            'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80'
          }
          senderName={viewOnceMsg.senderName}
          durationSeconds={viewOnceMsg.disappearingDuration || 10}
          isViewOnce={viewOnceMsg.isViewOnce || true}
          onCloseAndBurn={handleBurnViewOnce}
        />
      )}

      {/* Group Info & Custom Privacy Settings Modal */}
      {showGroupSettings && (
        <GroupSettingsModal
          isOpen={true}
          group={activeChat}
          onClose={() => setShowGroupSettings(false)}
          onUpdatePrivacy={handleUpdateGroupPrivacy}
          onAddParticipant={(name) => {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === activeChatId
                  ? {
                      ...c,
                      participants: [
                        ...(c.participants || []),
                        {
                          id: `u-${Date.now()}`,
                          name,
                          avatar:
                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
                          role: 'member',
                        },
                      ],
                    }
                  : c
              )
            );
          }}
          onRemoveParticipant={(uId) => {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === activeChatId
                  ? {
                      ...c,
                      participants: (c.participants || []).filter(
                        (p) => p.id !== uId
                      ),
                    }
                  : c
              )
            );
          }}
          onOpenSafetyCode={() => {
            setShowGroupSettings(false);
            setShowSafetyCode(true);
          }}
        />
      )}

      {/* Cross-Platform Linked Devices Modal */}
      {showLinkedDevices && (
        <LinkedDevicesModal
          isOpen={true}
          devices={devices}
          onClose={() => setShowLinkedDevices(false)}
          onSyncAll={handleSyncAllDevices}
          onUnlinkDevice={(devId) =>
            setDevices((prev) => prev.filter((d) => d.id !== devId))
          }
          onLinkNewDevice={handleLinkNewDevice}
        />
      )}

      {/* Offline Document Viewer Modal */}
      {selectedDoc && (
        <DocumentViewerModal
          isOpen={true}
          doc={selectedDoc}
          isOfflineMode={settings.isOfflineSimulated}
          onClose={() => setSelectedDoc(null)}
          onShareToChat={(doc) => {
            handleSendMessage({
              text: `Shared Document: ${doc.name}`,
              mediaType: 'document',
              documentMeta: {
                name: doc.name,
                size: doc.size,
                type: doc.type,
                cachedOffline: true,
              },
            });
          }}
          onSaveToDrive={(doc) => {
            setShowWorkspace(true);
          }}
          onDocUpdated={(updated) => setSelectedDoc(updated)}
        />
      )}

      {/* Offline Document Vault List Modal */}
      {showDocsVault && (
        <DocsVaultModal
          isOpen={true}
          isOfflineMode={settings.isOfflineSimulated}
          onClose={() => setShowDocsVault(false)}
          onOpenDoc={(doc: OfflineDoc) => setSelectedDoc(doc)}
          onSaveToDrive={(_doc: OfflineDoc) => setShowWorkspace(true)}
        />
      )}

      {/* Google Workspace Integration Hub (Drive, Chat, Gmail) */}
      {showWorkspace && (
        <GoogleWorkspaceModal
          isOpen={true}
          onClose={() => setShowWorkspace(false)}
          onAttachDriveFile={handleAttachDriveFile}
        />
      )}

      {/* 60-digit Safety Code Verification Modal */}
      {showSafetyCode && (
        <SafetyCodeModal
          isOpen={true}
          contactName={activeChat.name}
          safetyCodeMatrix={
            activeChat.safetyCodeMatrix ||
            generateSafetyNumber('me', activeChat.id)
          }
          isVerified={activeChat.verifiedSafetyNumber || false}
          onToggleVerify={() => {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === activeChat.id
                  ? {
                      ...c,
                      verifiedSafetyNumber: !c.verifiedSafetyNumber,
                    }
                  : c
              )
            );
          }}
          onClose={() => setShowSafetyCode(false)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          isOpen={true}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setShowSettings(false)}
          onLockNow={() => setIsLocked(true)}
        />
      )}

      {/* New Group Modal */}
      {showNewGroup && (
        <NewGroupModal
          isOpen={true}
          onClose={() => setShowNewGroup(false)}
          onCreateGroup={handleCreateGroup}
        />
      )}
    </div>
  );
}
