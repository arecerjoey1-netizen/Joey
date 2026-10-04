import React, { useState } from 'react';
import {
  X,
  FileText,
  Plus,
  Trash2,
  CloudCheck,
  HardDrive,
  Eye,
  WifiOff,
} from 'lucide-react';
import {
  OfflineDoc,
  getOfflineDocs,
  saveOfflineDoc,
  deleteOfflineDoc,
} from '../utils/offlineDocsStore';
import { Haptics } from '../utils/haptics';

interface DocsVaultModalProps {
  isOpen: boolean;
  isOfflineMode: boolean;
  onClose: () => void;
  onOpenDoc: (doc: OfflineDoc) => void;
  onSaveToDrive: (doc: OfflineDoc) => void;
}

export const DocsVaultModal: React.FC<DocsVaultModalProps> = ({
  isOpen,
  isOfflineMode,
  onClose,
  onOpenDoc,
  onSaveToDrive,
}) => {
  const [docs, setDocs] = useState<OfflineDoc[]>(getOfflineDocs());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'pdf' | 'markdown' | 'sheet' | 'text'>('markdown');
  const [newContent, setNewContent] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newDoc: OfflineDoc = {
      id: `doc-${Date.now()}`,
      name: newTitle.trim(),
      type: newType,
      size: `${Math.round(newContent.length / 1024 + 1)} KB`,
      content: newContent || '# Confidential Document\n\nEncrypted offline draft.',
      lastModified: Date.now(),
      cachedOffline: true,
    };

    const updated = saveOfflineDoc(newDoc);
    setDocs(updated);
    setNewTitle('');
    setNewContent('');
    setShowCreateForm(false);
    Haptics.documentEdit();
  };

  const handleDelete = (id: string) => {
    Haptics.tap();
    const updated = deleteOfflineDoc(id);
    setDocs(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-2xl h-[80vh] rounded-2xl bg-[#111b21] border border-[#202c33] flex flex-col overflow-hidden shadow-2xl text-[#e9edef]">
        {/* Header */}
        <div className="p-4 border-b border-[#202c33] flex items-center justify-between bg-[#202c33]/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Offline Document Vault
              </h2>
              <p className="text-xs text-[#8696a0]">
                Zero-Connectivity Document Storage & Encrypted Local Cache
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-3 py-1.5 bg-[#00a884] text-[#111b21] font-semibold text-xs rounded-lg hover:bg-[#02906f] flex items-center gap-1.5 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> New Document
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#202c33] text-[#8696a0] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Offline notice */}
        {isOfflineMode && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center gap-2 text-xs text-amber-300">
            <WifiOff className="h-4 w-4" />
            <span>
              All documents below are currently accessible locally without network access.
            </span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0c1317]">
          {showCreateForm && (
            <form
              onSubmit={handleCreate}
              className="p-4 rounded-xl bg-[#182229] border border-[#00a884]/40 space-y-3 animate-in zoom-in-95 text-xs"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Add Encrypted Offline Document</h3>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="text-[#8696a0] hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#8696a0] mb-1">Document Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Secret_Report.pdf"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#202c33] border border-[#2a3942] text-white focus:outline-none focus:border-[#00a884]"
                  />
                </div>

                <div>
                  <label className="block text-[#8696a0] mb-1">Document Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#202c33] border border-[#2a3942] text-white focus:outline-none focus:border-[#00a884]"
                  >
                    <option value="markdown">Markdown (.md)</option>
                    <option value="pdf">Encrypted PDF (.pdf)</option>
                    <option value="sheet">Spreadsheet (.sheet)</option>
                    <option value="text">Plain Text (.txt)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#8696a0] mb-1">Document Content</label>
                <textarea
                  rows={4}
                  placeholder="Enter or paste text content..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#202c33] border border-[#2a3942] text-white focus:outline-none focus:border-[#00a884] font-mono text-xs"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-[#00a884] text-[#111b21] font-semibold rounded-lg hover:bg-[#02906f]"
              >
                Save to Local Vault
              </button>
            </form>
          )}

          {/* List of Offline Docs */}
          <div className="space-y-2.5">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="p-3.5 rounded-xl bg-[#111b21] border border-[#202c33] hover:border-[#00a884]/40 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white truncate max-w-sm">
                      {doc.name}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-[#8696a0]">
                      <span>{doc.size}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[#00a884]">
                        <CloudCheck className="h-3 w-3" /> Indexed in Cache
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      Haptics.tap();
                      onOpenDoc(doc);
                      onClose();
                    }}
                    className="px-2.5 py-1.5 bg-[#202c33] hover:bg-[#2a3942] text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5 text-[#00a884]" /> View
                  </button>

                  <button
                    onClick={() => {
                      Haptics.tap();
                      onSaveToDrive(doc);
                    }}
                    className="p-1.5 rounded-lg bg-[#202c33] hover:bg-[#2a3942] text-sky-400 hover:text-white transition-colors"
                    title="Back up to Google Drive"
                  >
                    <HardDrive className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 rounded-lg text-[#8696a0] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Remove from Cache"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
