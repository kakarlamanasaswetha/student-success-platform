import { useEffect, useRef, useState } from 'react';
import { fetchChatHistory, sendChatMessage } from '../../api/endpoints';

export default function ChatWidget() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    fetchChatHistory().then(({ data }) => {
      setMessages(
        data.history.length
          ? data.history
          : [
              {
                role: 'assistant',
                content:
                  "Hi! I'm your academic assistant. Ask me about your grades, attendance, study strategies, or how to talk to your advisor.",
              },
            ]
      );
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    setSending(true);

    try {
      const { data } = await sendChatMessage(text);
      setMode(data.source);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong reaching the assistant. Please try again.' },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card flex flex-col h-[28rem]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-slate-800" id="chat-heading">
          Academic Assistant
        </h2>
        {mode && (
          <span className={`badge ${mode === 'openai' ? 'badge-low' : 'badge-medium'}`}>
            {mode === 'openai' ? 'Live AI' : 'Demo mode'}
          </span>
        )}
      </div>

      <div
        className="flex-1 overflow-y-auto space-y-3 pr-1"
        role="log"
        aria-live="polite"
        aria-labelledby="chat-heading"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                m.role === 'user' ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'
              }`}
            >
              <span className="sr-only">{m.role === 'user' ? 'You' : 'Assistant'}: </span>
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-500 text-sm rounded-2xl rounded-bl-sm px-3.5 py-2">
              <span className="sr-only">Assistant: </span>Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <label htmlFor="chat-input" className="sr-only">
          Message to academic assistant
        </label>
        <input
          id="chat-input"
          className="input"
          placeholder="Ask about grades, attendance, study tips…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
        />
        <button type="submit" className="btn-primary" disabled={sending || !input.trim()} aria-busy={sending}>
          Send
        </button>
      </form>
    </div>
  );
}
