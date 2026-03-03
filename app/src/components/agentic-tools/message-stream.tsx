// src/components/agentic-tools/message-stream.tsx
import { useEffect, useRef } from 'react';
import { useAgentic } from '../../state/providers/agentic-context';

export default function MessageStream() {
  const { messages, isStreaming, setScrollPercent, registerScrollToBottom } = useAgentic();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Register scroll-to-bottom so external callers (e.g. the button in AgenticSurface) can trigger it
  useEffect(() => {
    registerScrollToBottom(() => {
      containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
    });
  }, [registerScrollToBottom]);

  // Scroll event → update percent (0 = top, 100 = bottom/caught-up)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollHeight - el.clientHeight;
      setScrollPercent(max <= 0 ? 100 : Math.round((el.scrollTop / max) * 100));
    };
    el.addEventListener('scroll', update, { passive: true });
    return () => el.removeEventListener('scroll', update);
  }, [setScrollPercent]);

  // When all messages fit without overflow, ensure percent stays at 100
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight) setScrollPercent(100);
  }, [messages, setScrollPercent]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setScrollPercent(100);
  }, [messages, setScrollPercent]);

  return (
    <div ref={containerRef} className="at-messages">
      {messages.map((msg, i) => {
        const isLast = i === messages.length - 1;
        const showCursor = isLast && msg.role === 'assistant' && isStreaming;
        return (
          <p key={i} className={`at-message ${msg.role}`}>
            {msg.content}
            {showCursor && <span className="at-cursor" />}
          </p>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
