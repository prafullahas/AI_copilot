import { useState, useRef, useEffect } from 'react';
import { chatApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, FileCode, User, Bot, Sparkles } from 'lucide-react';

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-1" data-testid="chat-typing">
      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 typing-dot" />
      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 typing-dot" />
      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 typing-dot" />
    </div>
  );
}

function MessageBubble({ msg, index }) {
  const isUser = msg.role === 'user';

  return (
    <div
      className={`flex gap-3 animate-fade-in ${isUser ? 'flex-row-reverse' : ''}`}
      data-testid={`chat-message-${index}`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1 ${
          isUser ? 'bg-[#1E1E1E]' : 'bg-blue-600/15'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-[#A3A3A3]" />
        ) : (
          <Bot className="w-4 h-4 text-blue-400" />
        )}
      </div>

      <div className={`max-w-[80%] space-y-2 ${isUser ? 'items-end' : ''}`}>
        <div
          className={`rounded-lg text-sm leading-relaxed ${
            isUser
              ? 'bg-[#1A1A1A] border border-[#262626] px-4 py-3 text-[#E5E5E5]'
              : msg.isError
              ? 'px-4 py-3 text-red-400 bg-red-500/5 border border-red-500/10 rounded-lg'
              : 'px-1 py-1 text-[#D4D4D4]'
          }`}
        >
          <pre className="whitespace-pre-wrap font-ibm text-sm leading-relaxed">{msg.content}</pre>
        </div>

        {msg.files?.length > 0 && (
          <div className="flex flex-wrap gap-2 ml-1">
            {msg.files.map((f, j) => (
              <div
                key={j}
                className="flex items-center gap-1.5 text-xs text-[#737373] bg-[#111111] border border-[#1A1A1A] rounded-md px-2.5 py-1.5 font-mono transition-colors duration-200 hover:border-[#262626] hover:text-[#A3A3A3]"
              >
                <FileCode className="w-3 h-3 shrink-0" />
                <span className="truncate max-w-[200px]">{f}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    try {
      const { data } = await chatApi.ask(question);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.answer, files: data.referencedFiles },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: err.response?.data?.error || 'Failed to get response', isError: true },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-full" data-testid="chat-interface">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#1A1A1A] shrink-0">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-xs uppercase tracking-[0.15em] text-[#737373] font-ibm font-medium">AI Chat</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            data-testid="chat-clear-button"
            className="text-xs text-[#525252] hover:text-[#A3A3A3] font-ibm transition-colors duration-200"
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1">
        <div className="px-6 py-5">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-20" data-testid="chat-empty">
              <div className="w-14 h-14 rounded-2xl bg-[#111111] border border-[#1A1A1A] flex items-center justify-center mb-5">
                <Bot className="w-7 h-7 text-[#262626]" />
              </div>
              <p className="text-[#525252] text-sm font-ibm mb-1">No messages yet</p>
              <p className="text-[#3A3A3A] text-xs font-ibm">Ingest a repository, then ask questions about the code.</p>
            </div>
          )}

          <div className="space-y-5">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} index={i} />
            ))}

            {loading && (
              <div className="flex gap-3 animate-fade-in" data-testid="chat-loading">
                <div className="w-8 h-8 rounded-lg bg-blue-600/15 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-blue-400" />
                </div>
                <div className="pt-2">
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="px-5 py-4 border-t border-[#1A1A1A] shrink-0">
        <form onSubmit={handleSend} className="flex gap-3" data-testid="chat-input-form">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the codebase..."
            disabled={loading}
            data-testid="chat-input"
            className="flex-1 bg-[#111111] border-[#1A1A1A] text-white placeholder:text-[#3A3A3A] focus-visible:ring-1 focus-visible:ring-blue-500/50 focus-visible:border-blue-500/30 h-11 font-ibm text-sm rounded-lg transition-all duration-200"
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            data-testid="chat-send-button"
            className="h-11 w-11 p-0 bg-blue-600 hover:bg-blue-500 disabled:bg-[#1A1A1A] disabled:text-[#3A3A3A] text-white rounded-lg transition-all duration-200"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
