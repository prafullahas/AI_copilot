import { useState, useRef, useEffect } from 'react';
import { chatApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Send, FileCode, User, Bot } from 'lucide-react';

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

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
    }
  };

  return (
    <div className="flex flex-col h-full" data-testid="chat-interface">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-[#262626]">
        <MessageSquare className="w-4 h-4 text-[#A3A3A3]" />
        <span className="text-xs uppercase tracking-[0.2em] text-[#A3A3A3] font-ibm">Chat</span>
      </div>

      <ScrollArea className="flex-1 px-5 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16" data-testid="chat-empty">
            <Bot className="w-10 h-10 text-[#262626] mb-4" />
            <p className="text-[#525252] text-sm font-ibm">Ingest a repo, then ask questions about the code.</p>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`} data-testid={`chat-message-${i}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-md bg-blue-600/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-blue-500" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-md p-4 text-sm font-ibm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#1E1E1E] border border-[#262626] text-white'
                    : msg.isError
                    ? 'text-red-400'
                    : 'text-[#E5E5E5]'
                }`}
              >
                <pre className="whitespace-pre-wrap font-ibm text-sm">{msg.content}</pre>
                {msg.files?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#262626] space-y-1">
                    {msg.files.map((f, j) => (
                      <div key={j} className="flex items-center gap-1.5 text-xs text-[#A3A3A3]">
                        <FileCode className="w-3 h-3" />
                        <span className="font-mono">{f}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-md bg-[#262626] flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-[#A3A3A3]" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3" data-testid="chat-loading">
              <div className="w-7 h-7 rounded-md bg-blue-600/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-blue-500" />
              </div>
              <div className="space-y-2 flex-1 max-w-[85%]">
                <Skeleton className="h-4 w-3/4 bg-[#1E1E1E]" />
                <Skeleton className="h-4 w-1/2 bg-[#1E1E1E]" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSend} className="flex gap-2 p-4 border-t border-[#262626]" data-testid="chat-input-form">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the codebase..."
          disabled={loading}
          data-testid="chat-input"
          className="flex-1 bg-[#0A0A0A] border-[#262626] text-white placeholder:text-[#525252] focus-visible:ring-1 focus-visible:ring-blue-500 h-10 font-ibm text-sm"
        />
        <Button
          type="submit"
          disabled={loading || !input.trim()}
          data-testid="chat-send-button"
          className="h-10 w-10 p-0 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
