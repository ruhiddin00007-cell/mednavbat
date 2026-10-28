/**
 * useAIChat вЂ” MedNavbat Uy Shifokori Yordamchisi AI chat hook
 * Barcha chat holati va mantiqini boshqaradi.
 * localStorage orqali suhbatlar saqlanadi.
 *
 * AI so'rovlari faqat /api/ai/chat Netlify Function orqali yuboriladi вЂ”
 * API kalit brauzerda hech qachon ko'rinmaydi.
 */
import { useState, useCallback, useRef } from 'react';

const STORAGE_KEY     = 'mednavbat_ai_chats';
const ACTIVE_CHAT_KEY = 'mednavbat_ai_active_chat';

// Netlify Function URL (local dev va production ikkalasida ishlaydi)
const AI_ENDPOINT = '/api/ai/chat';

function generateId() {
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function generateTitle(firstMessage) {
  const text = firstMessage.trim();
  if (text.length <= 40) return text;
  return text.slice(0, 37) + '...';
}

function loadChats() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveChats(chats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch {
    // Storage full or unavailable
  }
}

/** Sessiya tokenini sessionStorage'dan olish */
function getAuthToken() {
  try {
    // AppContext tomonidan saqlangan token
    return sessionStorage.getItem('mednavbat_session_token') ||
           sessionStorage.getItem('auth_token') ||
           localStorage.getItem('mednavbat_session_token') ||
           null;
  } catch {
    return null;
  }
}

export function useAIChat() {
  const [chats, setChats] = useState(() => loadChats());
  const [activeChatId, setActiveChatId] = useState(() => {
    const saved = localStorage.getItem(ACTIVE_CHAT_KEY);
    const all = loadChats();
    if (saved && all.find(c => c.id === saved)) return saved;
    return all.length > 0 ? all[0].id : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const activeChat = chats.find(c => c.id === activeChatId) || null;

  // Persist chats whenever they change
  const updateChats = useCallback((updater) => {
    setChats(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveChats(next);
      return next;
    });
  }, []);

  /** Create a new empty chat and switch to it */
  const newChat = useCallback(() => {
    const id = generateId();
    const chat = {
      id,
      title: 'Yangi suhbat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    updateChats(prev => [chat, ...prev]);
    setActiveChatId(id);
    localStorage.setItem(ACTIVE_CHAT_KEY, id);
    setError(null);
    return id;
  }, [updateChats]);

  /** Switch to a different chat */
  const switchChat = useCallback((chatId) => {
    setActiveChatId(chatId);
    localStorage.setItem(ACTIVE_CHAT_KEY, chatId);
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  /** Delete a chat */
  const deleteChat = useCallback((chatId) => {
    updateChats(prev => {
      const next = prev.filter(c => c.id !== chatId);
      if (activeChatId === chatId) {
        const newActive = next.length > 0 ? next[0].id : null;
        setActiveChatId(newActive);
        localStorage.setItem(ACTIVE_CHAT_KEY, newActive || '');
      }
      return next;
    });
  }, [activeChatId, updateChats]);

  /** Rename a chat */
  const renameChat = useCallback((chatId, newTitle) => {
    updateChats(prev => prev.map(c =>
      c.id === chatId ? { ...c, title: newTitle.trim() || c.title } : c
    ));
  }, [updateChats]);

  /**
   * Xabarni yuborish va AI javobini Netlify Function orqali olish.
   * Barcha AI so'rovlari /api/ai/chat serveriga yuboriladi вЂ”
   * API kalit brauzerda hech qachon ko'rinmaydi.
   */
  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;

    // Auth token tekshiruvi
    const token = getAuthToken();
    if (!token) {
      setError("Chatdan foydalanish uchun avval tizimga kiring.");
      return;
    }

    // Aktiv chat mavjudligini ta'minlash
    let chatId = activeChatId;
    if (!chatId || !chats.find(c => c.id === chatId)) {
      chatId = generateId();
      const newChatObj = {
        id: chatId,
        title: generateTitle(text),
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      updateChats(prev => [newChatObj, ...prev]);
      setActiveChatId(chatId);
      localStorage.setItem(ACTIVE_CHAT_KEY, chatId);
    }

    const userMessage = {
      id: generateId(),
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };

    // Foydalanuvchi xabarini darhol qo'shish
    updateChats(prev => prev.map(c => {
      if (c.id !== chatId) return c;
      const isFirst = c.messages.length === 0;
      return {
        ...c,
        messages: [...c.messages, userMessage],
        title: isFirst ? generateTitle(text) : c.title,
        updatedAt: Date.now(),
      };
    }));

    setIsLoading(true);
    setError(null);

    // AI javob placeholder (streaming animatsiyasi uchun)
    const aiMsgId = generateId();
    const aiPlaceholder = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      streaming: true,
    };
    updateChats(prev => prev.map(c =>
      c.id !== chatId ? c : { ...c, messages: [...c.messages, aiPlaceholder] }
    ));

    try {
      abortControllerRef.current = new AbortController();

      // Suhbat tarixini yig'ish (kontekst oynasi)
      const currentChat = chats.find(c => c.id === chatId);
      const history = (currentChat?.messages || [])
        .filter(m => !m.streaming)
        .map(m => ({ role: m.role, content: m.content }));
      history.push({ role: 'user', content: text.trim() });

      // Netlify Function'ga so'rov yuborish
      const response = await fetch(AI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: history }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        let errData = {};
        try { errData = await response.json(); } catch {}
        throw new Error(errData.error || `Server xatosi: ${response.status}`);
      }

      const data = await response.json();
      const fullContent = data.content || '';

      if (!fullContent) {
        throw new Error("AI bo'sh javob qaytardi. Iltimos, qayta urinib ko'ring.");
      }

      // Pseudo-streaming: so'zma-so'z ko'rsatish (UX uchun)
      const words = fullContent.split(' ');
      let built = '';
      for (const word of words) {
        if (abortControllerRef.current?.signal.aborted) break;
        await new Promise(r => setTimeout(r, 18 + Math.random() * 22));
        built += (built ? ' ' : '') + word;
        updateChats(prev => prev.map(c =>
          c.id !== chatId ? c : {
            ...c,
            messages: c.messages.map(m =>
              m.id === aiMsgId ? { ...m, content: built } : m
            ),
          }
        ));
      }

      // Streaming tugatildi
      updateChats(prev => prev.map(c =>
        c.id !== chatId ? c : {
          ...c,
          messages: c.messages.map(m =>
            m.id === aiMsgId ? { ...m, streaming: false, content: fullContent } : m
          ),
          updatedAt: Date.now(),
        }
      ));

    } catch (err) {
      if (err.name === 'AbortError') {
        // Bekor qilindi вЂ” placeholderni olib tashlash
        updateChats(prev => prev.map(c =>
          c.id !== chatId ? c : {
            ...c,
            messages: c.messages.filter(m => m.id !== aiMsgId),
          }
        ));
      } else {
        setError(err.message || "Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.");
        updateChats(prev => prev.map(c =>
          c.id !== chatId ? c : {
            ...c,
            messages: c.messages.filter(m => m.id !== aiMsgId),
          }
        ));
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeChatId, chats, isLoading, updateChats]);

  /** Joriy AI so'rovini to'xtatish */
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  }, []);

  return {
    chats,
    activeChat,
    activeChatId,
    isLoading,
    error,
    setError,
    newChat,
    switchChat,
    deleteChat,
    renameChat,
    sendMessage,
    stopGeneration,
  };
}
