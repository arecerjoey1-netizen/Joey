import React, { useState, useEffect } from 'react';
import {
  X,
  HardDrive,
  MessageSquare,
  Mail,
  Upload,
  RefreshCw,
  Send,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  FileText,
  User as UserIcon,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  googleSignIn,
  logout,
  getAccessToken,
  initAuth,
} from '../services/firebaseAuth';
import {
  listDriveFiles,
  uploadDriveFile,
  listChatSpaces,
  listSpaceMessages,
  sendGoogleChatMessage,
  sendGmail,
  listRecentEmails,
  DriveFile,
  ChatSpace,
  ChatMessage as GoogleChatMessage,
  GmailMessageItem,
} from '../services/googleWorkspace';
import { Haptics } from '../utils/haptics';

interface GoogleWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttachDriveFile?: (file: DriveFile) => void;
}

export const GoogleWorkspaceModal: React.FC<GoogleWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onAttachDriveFile,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'drive' | 'chat' | 'gmail'>('drive');

  // Drive state
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [loadingDrive, setLoadingDrive] = useState(false);

  // Chat state
  const [spaces, setSpaces] = useState<ChatSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string>('');
  const [spaceMessages, setSpaceMessages] = useState<GoogleChatMessage[]>([]);
  const [newChatText, setNewChatText] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);

  // Gmail state
  const [recentEmails, setRecentEmails] = useState<GmailMessageItem[]>([]);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('WhisperPulse Secure Encrypted Chat Invite');
  const [emailBody, setEmailBody] = useState(
    'Hello,\n\nI am inviting you to an end-to-end encrypted WhisperPulse session. All voice calls, disappearing media, and messages are protected with zero-knowledge Curve25519 keys.\n\nBest regards.'
  );
  const [loadingGmail, setLoadingGmail] = useState(false);

  // Mandatory confirmation dialog state
  const [confirmationPending, setConfirmationPending] = useState<{
    actionTitle: string;
    description: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
  }, []);

  useEffect(() => {
    if (token) {
      if (activeTab === 'drive') loadDrive();
      if (activeTab === 'chat') loadSpaces();
      if (activeTab === 'gmail') loadEmails();
    }
  }, [token, activeTab]);

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    setStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        Haptics.syncSuccess();
      }
    } catch (err: any) {
      setStatusMessage(`Sign-in notice: ${err.message || 'Cancelled'}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setToken(null);
    Haptics.tap();
  };

  // Drive operations
  const loadDrive = async () => {
    if (!token) return;
    setLoadingDrive(true);
    try {
      const files = await listDriveFiles(token);
      setDriveFiles(files);
    } catch (e: any) {
      console.warn('Drive fetch error:', e);
    } finally {
      setLoadingDrive(false);
    }
  };

  // Chat operations
  const loadSpaces = async () => {
    if (!token) return;
    setLoadingChat(true);
    try {
      const sp = await listChatSpaces(token);
      setSpaces(sp);
      if (sp.length > 0 && !selectedSpace) {
        setSelectedSpace(sp[0].name);
        loadSpaceMessages(sp[0].name);
      }
    } catch (e: any) {
      console.warn('Chat spaces error:', e);
    } finally {
      setLoadingChat(false);
    }
  };

  const loadSpaceMessages = async (spaceName: string) => {
    if (!token) return;
    try {
      const msgs = await listSpaceMessages(token, spaceName);
      setSpaceMessages(msgs);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedSpace || !newChatText.trim()) return;

    // MANDATORY USER CONFIRMATION
    setConfirmationPending({
      actionTitle: 'Send Google Chat Message?',
      description: `You are about to publish a message into Google Chat Space "${selectedSpace}": "${newChatText.slice(
        0,
        60
      )}..."`,
      onConfirm: async () => {
        try {
          await sendGoogleChatMessage(token, selectedSpace, newChatText.trim());
          setNewChatText('');
          loadSpaceMessages(selectedSpace);
          Haptics.syncSuccess();
          setStatusMessage('Google Chat message delivered successfully!');
        } catch (err: any) {
          setStatusMessage(`Chat send failed: ${err.message}`);
        }
      },
    });
  };

  // Gmail operations
  const loadEmails = async () => {
    if (!token) return;
    setLoadingGmail(true);
    try {
      const msgs = await listRecentEmails(token);
      setRecentEmails(msgs);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoadingGmail(false);
    }
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !emailTo.trim()) return;

    // MANDATORY USER CONFIRMATION FOR SENDING EMAIL
    setConfirmationPending({
      actionTitle: 'Send Email via Gmail?',
      description: `This action will send an email from your Gmail account to "${emailTo}" with subject "${emailSubject}".`,
      onConfirm: async () => {
        try {
          await sendGmail(token, {
            to: emailTo.trim(),
            subject: emailSubject,
            body: `<p>${emailBody.replace(/\n/g, '<br/>')}</p>`,
          });
          Haptics.syncSuccess();
          setStatusMessage(`Email successfully dispatched to ${emailTo}!`);
          setEmailTo('');
        } catch (err: any) {
          setStatusMessage(`Failed to send email: ${err.message}`);
        }
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-2xl h-[85vh] rounded-2xl bg-[#111b21] border border-[#202c33] flex flex-col overflow-hidden shadow-2xl text-[#e9edef]">
        {/* Header */}
        <div className="p-4 border-b border-[#202c33] flex items-center justify-between bg-[#202c33]/50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#00a884]/20 border border-[#00a884]/40 flex items-center justify-center text-[#00a884]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Google Workspace Integration
              </h2>
              <p className="text-xs text-[#8696a0]">
                Google Chat, Google Drive, and Gmail Integration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#d1d7db] hidden sm:inline">
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-2.5 py-1 text-xs text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : null}

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#202c33] text-[#8696a0] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-[#202c33] bg-[#182229] px-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('drive')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'drive'
                ? 'border-[#00a884] text-[#00a884] font-semibold'
                : 'border-transparent text-[#8696a0] hover:text-white'
            }`}
          >
            <HardDrive className="h-4 w-4" /> Google Drive
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'chat'
                ? 'border-[#00a884] text-[#00a884] font-semibold'
                : 'border-transparent text-[#8696a0] hover:text-white'
            }`}
          >
            <MessageSquare className="h-4 w-4" /> Google Chat
          </button>
          <button
            onClick={() => setActiveTab('gmail')}
            className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'gmail'
                ? 'border-[#00a884] text-[#00a884] font-semibold'
                : 'border-transparent text-[#8696a0] hover:text-white'
            }`}
          >
            <Mail className="h-4 w-4" /> Gmail Invites
          </button>
        </div>

        {/* Notification Toast */}
        {statusMessage && (
          <div className="bg-[#00a884]/20 border-b border-[#00a884]/40 px-4 py-2 text-xs text-[#00a884] flex items-center justify-between">
            <span>{statusMessage}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-[#8696a0] hover:text-white"
            >
              ×
            </button>
          </div>
        )}

        {/* Not authenticated state */}
        {!user || !token ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0c1317]">
            <div className="h-16 w-16 rounded-full bg-[#202c33] flex items-center justify-center text-[#00a884] mb-4">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Connect Google Workspace
            </h3>
            <p className="text-xs text-[#8696a0] max-w-md mb-6 leading-relaxed">
              Connect your Google account to back up and view files from Google Drive, sync messages with Google Chat spaces, and send encrypted invites via Gmail, with permission from the app's users.
            </p>

            {/* Official Google Sign-in button */}
            <button
              onClick={handleSignIn}
              disabled={isLoggingIn}
              className="gsi-material-button flex items-center gap-3 px-5 py-2.5 rounded-lg bg-white text-zinc-800 font-medium text-sm shadow hover:bg-zinc-100 active:scale-98 transition-all disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              <span>{isLoggingIn ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>
          </div>
        ) : (
          /* Authenticated content */
          <div className="flex-1 overflow-y-auto p-4 bg-[#0c1317]">
            {/* GOOGLE DRIVE TAB */}
            {activeTab === 'drive' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider">
                    Your Google Drive Files
                  </h3>
                  <button
                    onClick={loadDrive}
                    disabled={loadingDrive}
                    className="p-1.5 rounded-lg bg-[#202c33] text-[#8696a0] hover:text-white text-xs flex items-center gap-1"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${loadingDrive ? 'animate-spin' : ''}`}
                    />
                    <span>Refresh</span>
                  </button>
                </div>

                {loadingDrive ? (
                  <p className="text-xs text-[#8696a0] text-center py-8">
                    Fetching Drive files...
                  </p>
                ) : driveFiles.length === 0 ? (
                  <div className="p-6 rounded-xl bg-[#111b21] border border-[#202c33] text-center text-xs text-[#8696a0]">
                    No files found in Google Drive.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {driveFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#111b21] border border-[#202c33] hover:border-[#00a884]/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-white truncate max-w-sm">
                              {file.name}
                            </p>
                            <p className="text-[10px] text-[#8696a0]">
                              {file.mimeType} •{' '}
                              {file.modifiedTime
                                ? new Date(file.modifiedTime).toLocaleDateString()
                                : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {onAttachDriveFile && (
                            <button
                              onClick={() => {
                                Haptics.syncSuccess();
                                onAttachDriveFile(file);
                                setStatusMessage(`Attached "${file.name}" to active chat!`);
                              }}
                              className="px-2.5 py-1 text-xs bg-[#00a884]/20 border border-[#00a884]/40 text-[#00a884] rounded-lg hover:bg-[#00a884]/30 font-medium"
                            >
                              Attach to Chat
                            </button>
                          )}
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-[#8696a0] hover:text-white"
                              title="Open in Drive"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* GOOGLE CHAT TAB */}
            {activeTab === 'chat' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider">
                    Google Chat Spaces
                  </h3>
                  <button
                    onClick={loadSpaces}
                    disabled={loadingChat}
                    className="p-1.5 rounded-lg bg-[#202c33] text-[#8696a0] hover:text-white text-xs flex items-center gap-1"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${loadingChat ? 'animate-spin' : ''}`}
                    />
                    <span>Refresh</span>
                  </button>
                </div>

                {spaces.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {spaces.map((sp) => (
                      <button
                        key={sp.name}
                        onClick={() => {
                          setSelectedSpace(sp.name);
                          loadSpaceMessages(sp.name);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap border transition-colors ${
                          selectedSpace === sp.name
                            ? 'bg-[#00a884] text-[#111b21] font-semibold border-[#00a884]'
                            : 'bg-[#111b21] text-[#8696a0] border-[#202c33] hover:text-white'
                        }`}
                      >
                        {sp.displayName || sp.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#8696a0]">
                    No Google Chat spaces found for your account.
                  </p>
                )}

                {/* Messages in Selected Space */}
                {selectedSpace && (
                  <div className="bg-[#111b21] rounded-xl border border-[#202c33] p-3 flex flex-col h-64">
                    <div className="flex-1 overflow-y-auto space-y-2 mb-2 pr-1">
                      {spaceMessages.length === 0 ? (
                        <p className="text-xs text-[#8696a0] text-center py-6">
                          No messages in this space yet.
                        </p>
                      ) : (
                        spaceMessages.map((m, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-[#202c33]/50 text-xs"
                          >
                            <span className="text-[#00a884] font-medium">
                              {m.sender?.displayName || 'User'}:
                            </span>{' '}
                            <span className="text-[#d1d7db]">{m.text}</span>
                          </div>
                        ))
                      )}
                    </div>

                    <form onSubmit={handleSendChatMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={newChatText}
                        onChange={(e) => setNewChatText(e.target.value)}
                        placeholder="Post message to Google Chat..."
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-[#202c33] border border-[#2a3942] text-white focus:outline-none focus:border-[#00a884]"
                      />
                      <button
                        type="submit"
                        disabled={!newChatText.trim()}
                        className="px-3 py-1.5 bg-[#00a884] text-[#111b21] font-semibold text-xs rounded-lg hover:bg-[#02906f] disabled:opacity-40 flex items-center gap-1"
                      >
                        <Send className="h-3 w-3" /> Post
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* GMAIL TAB */}
            {activeTab === 'gmail' && (
              <div className="space-y-4">
                <div className="bg-[#111b21] rounded-xl border border-[#202c33] p-4">
                  <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-[#00a884]" /> Send Encrypted Chat Invite
                  </h3>
                  <p className="text-[11px] text-[#8696a0] mb-4">
                    Sends an email invite with your WhisperPulse safety credentials using the Gmail API. Requires explicit user confirmation before dispatch.
                  </p>

                  <form onSubmit={handleSendEmail} className="space-y-3">
                    <div>
                      <label className="block text-[11px] text-[#8696a0] mb-1">
                        Recipient Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        placeholder="colleague@example.com"
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-[#202c33] border border-[#2a3942] text-white focus:outline-none focus:border-[#00a884]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#8696a0] mb-1">
                        Subject Line
                      </label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-[#202c33] border border-[#2a3942] text-white focus:outline-none focus:border-[#00a884]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#8696a0] mb-1">
                        Invitation Content
                      </label>
                      <textarea
                        rows={3}
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-[#202c33] border border-[#2a3942] text-white focus:outline-none focus:border-[#00a884] resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!emailTo.trim()}
                      className="px-4 py-2 bg-[#00a884] hover:bg-[#02906f] text-[#111b21] font-semibold text-xs rounded-lg disabled:opacity-40 transition-colors flex items-center gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" /> Confirm & Send via Gmail
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MANDATORY USER CONFIRMATION MODAL */}
        {confirmationPending && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-[#182229] border border-[#2a3942] p-5 shadow-2xl text-left">
              <div className="flex items-center gap-2.5 text-amber-400 mb-3">
                <AlertCircle className="h-5 w-5" />
                <h4 className="text-sm font-bold text-white">
                  {confirmationPending.actionTitle}
                </h4>
              </div>

              <p className="text-xs text-[#d1d7db] mb-4 leading-relaxed">
                {confirmationPending.description}
              </p>

              <div className="flex justify-end gap-2 text-xs">
                <button
                  onClick={() => setConfirmationPending(null)}
                  className="px-3 py-1.5 rounded-lg bg-[#202c33] text-[#8696a0] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const action = confirmationPending.onConfirm;
                    setConfirmationPending(null);
                    await action();
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#00a884] hover:bg-[#02906f] text-[#111b21] font-semibold"
                >
                  Confirm & Execute
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
