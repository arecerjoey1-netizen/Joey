import React from 'react';
import { X, MessageSquare, PhoneCall, ShieldCheck } from 'lucide-react';
import { Haptics } from '../utils/haptics';

export interface NotificationItem {
  id: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  type: 'message' | 'call' | 'sync';
  chatId?: string;
}

interface NotificationBannerProps {
  notification: NotificationItem | null;
  onDismiss: () => void;
  onOpenChat: (chatId: string) => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notification,
  onDismiss,
  onOpenChat,
}) => {
  if (!notification) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full animate-in slide-in-from-top-4 duration-300">
      <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1f2c34] border border-[#2a3942] shadow-2xl text-[#e9edef] backdrop-blur-lg">
        <div
          className="flex items-center gap-3 flex-1 cursor-pointer"
          onClick={() => {
            Haptics.tap();
            if (notification.chatId) onOpenChat(notification.chatId);
            onDismiss();
          }}
        >
          {notification.senderAvatar ? (
            <img
              src={notification.senderAvatar}
              alt={notification.senderName}
              className="h-10 w-10 rounded-full object-cover border border-[#2a3942]"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-[#00a884]/20 text-[#00a884] flex items-center justify-center">
              {notification.type === 'call' ? (
                <PhoneCall className="h-5 w-5" />
              ) : (
                <MessageSquare className="h-5 w-5" />
              )}
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate">
                {notification.senderName}
              </span>
              <ShieldCheck className="h-3 w-3 text-[#00a884]" />
            </div>
            <p className="text-xs text-[#8696a0] truncate">{notification.text}</p>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="p-1 rounded-full text-[#8696a0] hover:text-white ml-2"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
