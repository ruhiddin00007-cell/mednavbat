/**
 * ChatSidebar — conversation history panel
 * Lists all chats with rename, delete, and new chat functionality.
 */
import React, { useState, memo } from 'react';
import {
  MessageSquarePlus,
  Trash2,
  Pencil,
  Check,
  X,
  MessageSquare,
  Bot,
} from 'lucide-react';

const ChatItem = memo(({ chat, isActive, onSelect, onDelete, onRename }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(chat.title);

  const handleRenameSubmit = () => {
    onRename(chat.id, editValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleRenameSubmit();
    if (e.key === 'Escape') {
      setEditValue(chat.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`group relative flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-pointer transition-colors duration-150 ${
        isActive
          ? 'bg-teal-600/15 dark:bg-teal-500/15 border border-teal-500/30 dark:border-teal-500/25'
          : 'hover:bg-slate-100 dark:hover:bg-slate-700/50 border border-transparent'
      }`}
      onClick={() => !isEditing && onSelect(chat.id)}
    >
      <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${
        isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'
      }`} />

      {isEditing ? (
        <input
          autoFocus
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleRenameSubmit}
          onClick={e => e.stopPropagation()}
          className="flex-1 text-[11px] bg-transparent border-b border-teal-500 outline-none text-slate-800 dark:text-slate-200 min-w-0"
        />
      ) : (
        <span className={`flex-1 text-[11px] truncate leading-tight ${
          isActive ? 'text-teal-700 dark:text-teal-300 font-medium' : 'text-slate-700 dark:text-slate-300'
        }`}>
          {chat.title}
        </span>
      )}

      {/* Action buttons — show on hover or active */}
      <div className={`flex items-center gap-0.5 flex-shrink-0 ${
        isEditing ? 'flex' : 'opacity-0 group-hover:opacity-100'
      } transition-opacity`}>
        {isEditing ? (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handleRenameSubmit(); }}
              className="p-0.5 rounded text-teal-600 hover:bg-teal-100 dark:hover:bg-teal-900/50"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setEditValue(chat.title); setIsEditing(false); }}
              className="p-0.5 rounded text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
              className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
              title="Nomini o'zgartirish"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(chat.id); }}
              className="p-0.5 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30"
              title="O'chirish"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </>
        )}
      </div>
    </div>
  );
});

ChatItem.displayName = 'ChatItem';

export const ChatSidebar = memo(({ chats, activeChatId, onNewChat, onSelectChat, onDeleteChat, onRenameChat }) => {
  // Group chats by date
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  const grouped = chats.reduce((acc, chat) => {
    const dateStr = new Date(chat.updatedAt).toDateString();
    let label;
    if (dateStr === today) label = 'Bugun';
    else if (dateStr === yesterday) label = 'Kecha';
    else label = new Date(chat.updatedAt).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' });

    if (!acc[label]) acc[label] = [];
    acc[label].push(chat);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-800/60 border-r border-slate-200 dark:border-slate-700/60">
      {/* Header */}
      <div className="px-3 py-3 border-b border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Suhbatlar
          </span>
        </div>
        <button
          onClick={onNewChat}
          id="ai-new-chat-btn"
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          Yangi suhbat
        </button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
        {chats.length === 0 ? (
          <div className="text-center py-6 px-3">
            <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              Hali suhbat yo'q. Yangi suhbat boshlang!
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([label, groupChats]) => (
            <div key={label}>
              <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-1">
                {label}
              </p>
              <div className="space-y-0.5">
                {groupChats.map(chat => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === activeChatId}
                    onSelect={onSelectChat}
                    onDelete={onDeleteChat}
                    onRename={onRenameChat}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

ChatSidebar.displayName = 'ChatSidebar';
