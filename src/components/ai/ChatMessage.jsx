/**
 * ChatMessage — individual message bubble component
 * Supports user, assistant roles, streaming indicator, and markdown-lite rendering.
 * AI javoblarida telefon raqamlar (103, +998...) avtomatik tel: havolasiga aylanadi.
 */
import React, { memo } from 'react';
import { Bot, User, AlertCircle } from 'lucide-react';
import { phoneToTelHref } from '../../utils/phoneFormatter';

// Very lightweight markdown renderer (bold, lists, line breaks)
function renderMarkdown(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let listItems = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${key++}`} className="list-none space-y-1 my-1">
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="text-teal-500 dark:text-teal-400 mt-0.5 flex-shrink-0">•</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Numbered list: "1. text" or "- text"
    if (/^[\d]+\.\s/.test(trimmed) || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.replace(/^[\d]+\.\s/, '').replace(/^[-*]\s/, '');
      listItems.push(content);
    } else {
      flushList();
      if (trimmed === '') {
        elements.push(<div key={`br-${key++}`} className="h-1" />);
      } else {
        elements.push(
          <p key={`p-${key++}`} className="leading-relaxed">
            {renderInline(trimmed)}
          </p>
        );
      }
    }
  });
  flushList();

  return elements;
}

/**
 * Matn ichidagi telefon raqamlarini topib tel: havolasiga aylantiradi:
 *  - "103" kabi qisqa tez yordam raqamlari
 *  - "+998 90 123 45 67" yoki "+99890123456" kabi O'zbekiston raqamlari
 * Keyin **bold** formatini ham qo'llaydi.
 */
function renderInline(text) {
  // 1. Avval telefon raqamlarni ajratib olamiz
  // Pattern: +998 ga boshlanadigan yoki 103/112 kabi qisqa raqamlar
  const phonePattern = /(\+998[\s\-().\d]{9,}|\b10[123]\b|\b112\b)/g;
  const phoneParts = text.split(phonePattern);

  return phoneParts.map((part, pi) => {
    if (phonePattern.test(part)) {
      phonePattern.lastIndex = 0; // regex reset
      const href = phoneToTelHref(part.trim());
      const isEmergency = /^(103|112|101|102)$/.test(part.trim());
      return (
        <a
          key={`tel-${pi}`}
          href={href}
          className={`
            inline-flex items-center
            min-h-[44px] py-0.5 px-0.5 -my-0.5
            font-bold underline underline-offset-2
            transition-colors duration-150
            active:opacity-60
            ${isEmergency
              ? 'text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300'
              : 'text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300'
            }
          `}
          title={`${part.trim()} ga qo'ng'iroq qilish`}
        >
          {part}
        </a>
      );
    }
    phonePattern.lastIndex = 0;

    // 2. Bold: **text**
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bp, bi) => {
      if (bp.startsWith('**') && bp.endsWith('**')) {
        return <strong key={`b-${pi}-${bi}`} className="font-semibold">{bp.slice(2, -2)}</strong>;
      }
      return <React.Fragment key={`t-${pi}-${bi}`}>{bp}</React.Fragment>;
    });
  });
}


const TypingDots = () => (
  <span className="inline-flex items-center gap-1 h-4">
    {[0, 1, 2].map(i => (
      <span
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-current opacity-60 animate-bounce"
        style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
      />
    ))}
  </span>
);

export const ChatMessage = memo(({ message, isLast }) => {
  const isUser = message.role === 'user';
  const isStreaming = message.streaming;

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end animate-fadeIn`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white ${
        isUser
          ? 'bg-gradient-to-br from-teal-500 to-emerald-600'
          : 'bg-gradient-to-br from-blue-600 to-indigo-700'
      }`}>
        {isUser
          ? <User className="w-3.5 h-3.5" />
          : <Bot className="w-3.5 h-3.5" />
        }
      </div>

      {/* Bubble */}
      <div className={`relative max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
        isUser
          ? 'bg-teal-600 text-white rounded-br-sm'
          : 'bg-white dark:bg-slate-700/80 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600/60 rounded-bl-sm shadow-sm'
      }`}>
        {isUser ? (
          <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="space-y-1 min-w-16">
            {isStreaming && !message.content ? (
              <TypingDots />
            ) : (
              <>
                {renderMarkdown(message.content)}
                {isStreaming && isLast && (
                  <span className="inline-block ml-0.5">
                    <TypingDots />
                  </span>
                )}
              </>
            )}
          </div>
        )}

        {/* Timestamp */}
        {!isStreaming && (
          <div className={`text-[9px] mt-1 select-none ${
            isUser ? 'text-teal-200 text-right' : 'text-slate-400 dark:text-slate-500'
          }`}>
            {new Date(message.timestamp).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
});

ChatMessage.displayName = 'ChatMessage';
