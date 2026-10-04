import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  WifiOff,
  CloudCheck,
  Edit3,
  Save,
  Share2,
  HardDrive,
  Check,
} from 'lucide-react';
import { OfflineDoc, saveOfflineDoc } from '../utils/offlineDocsStore';
import { Haptics } from '../utils/haptics';

interface DocumentViewerModalProps {
  isOpen: boolean;
  doc: OfflineDoc | null;
  isOfflineMode: boolean;
  onClose: () => void;
  onShareToChat?: (doc: OfflineDoc) => void;
  onSaveToDrive?: (doc: OfflineDoc) => void;
  onDocUpdated?: (doc: OfflineDoc) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  doc,
  isOfflineMode,
  onClose,
  onShareToChat,
  onSaveToDrive,
  onDocUpdated,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  React.useEffect(() => {
    if (doc) {
      setEditableContent(doc.content);
      setIsEditing(false);
    }
  }, [doc]);

  if (!isOpen || !doc) return null;

  const handleSave = () => {
    const updatedDoc: OfflineDoc = {
      ...doc,
      content: editableContent,
      lastModified: Date.now(),
    };
    saveOfflineDoc(updatedDoc);
    Haptics.documentEdit();
    setIsSavedRecently(true);
    setIsEditing(false);
    if (onDocUpdated) onDocUpdated(updatedDoc);
    setTimeout(() => setIsSavedRecently(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-2xl h-[85vh] rounded-2xl bg-[#111b21] border border-[#202c33] flex flex-col overflow-hidden shadow-2xl text-[#e9edef]">
        {/* Header */}
        <div className="p-4 border-b border-[#202c33] flex items-center justify-between bg-[#202c33]/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white truncate max-w-xs">
                  {doc.name}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] bg-[#202c33] text-[#8696a0] uppercase">
                  {doc.type}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#8696a0]">
                <span>{doc.size}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-[#00a884]">
                  <CloudCheck className="h-3.5 w-3.5" /> Cached for Offline Access
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSavedRecently && (
              <span className="text-xs text-[#00a884] flex items-center gap-1 font-medium animate-in fade-in">
                <Check className="h-3.5 w-3.5" /> Saved & Haptic Rumbler fired
              </span>
            )}

            {!isEditing ? (
              <button
                onClick={() => {
                  Haptics.tap();
                  setIsEditing(true);
                }}
                className="px-3 py-1.5 bg-[#202c33] hover:bg-[#2a3942] text-xs font-medium rounded-lg text-white flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="px-3 py-1.5 bg-[#00a884] hover:bg-[#02906f] text-xs font-semibold rounded-lg text-[#111b21] flex items-center gap-1.5 transition-colors"
              >
                <Save className="h-3.5 w-3.5" /> Save Changes
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#202c33] text-[#8696a0] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Offline Status Alert if offline */}
        {isOfflineMode && (
          <div className="px-4 py-2 bg-amber-500/15 border-b border-amber-500/30 flex items-center gap-2 text-xs text-amber-300">
            <WifiOff className="h-4 w-4" />
            <span>
              <strong>Offline Mode Active:</strong> You are viewing this document from the local encrypted cache without an active internet connection.
            </span>
          </div>
        )}

        {/* Document Body Area */}
        <div className="flex-1 overflow-y-auto p-5 bg-[#0c1317]">
          {isEditing ? (
            <textarea
              value={editableContent}
              onChange={(e) => setEditableContent(e.target.value)}
              className="w-full h-full min-h-[380px] bg-transparent text-sm text-[#d1d7db] font-mono focus:outline-none resize-none leading-relaxed"
              placeholder="Edit document content..."
            />
          ) : (
            <div className="prose prose-invert max-w-none text-sm font-sans leading-relaxed text-[#d1d7db] whitespace-pre-wrap">
              {doc.content}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-[#111b21] border-t border-[#202c33] flex items-center justify-between text-xs">
          <div className="text-[11px] text-[#8696a0]">
            Last Modified: {new Date(doc.lastModified).toLocaleTimeString()} • AES-256 Verified
          </div>

          <div className="flex items-center gap-2">
            {onShareToChat && (
              <button
                onClick={() => {
                  Haptics.tap();
                  onShareToChat(doc);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-[#202c33] hover:bg-[#2a3942] text-[#8696a0] hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <Share2 className="h-3.5 w-3.5" /> Share in Chat
              </button>
            )}

            {onSaveToDrive && (
              <button
                onClick={() => {
                  Haptics.tap();
                  onSaveToDrive(doc);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#00a884]/20 border border-[#00a884]/40 hover:bg-[#00a884]/30 text-[#00a884] font-medium flex items-center gap-1.5 transition-colors"
              >
                <HardDrive className="h-3.5 w-3.5" /> Back Up to Google Drive
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
