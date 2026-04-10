import { useState } from 'react';
import { searchApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, FileCode, Loader2 } from 'lucide-react';

export default function SearchPanel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setError('');
    setResults(null);
    setLoading(true);
    try {
      const { data } = await searchApi.search(query.trim());
      setResults(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full" data-testid="search-panel">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-[#262626]">
        <Search className="w-4 h-4 text-[#A3A3A3]" />
        <span className="text-xs uppercase tracking-[0.2em] text-[#A3A3A3] font-ibm">Search</span>
      </div>

      <div className="p-4 border-b border-[#262626]">
        <form onSubmit={handleSearch} className="flex gap-2" data-testid="search-form">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search code semantically..."
            data-testid="search-input"
            className="flex-1 bg-[#0A0A0A] border-[#262626] text-white placeholder:text-[#525252] focus-visible:ring-1 focus-visible:ring-blue-500 h-10 font-ibm text-sm"
          />
          <Button
            type="submit"
            disabled={loading || !query.trim()}
            data-testid="search-submit-button"
            className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-ibm px-5 transition-all duration-200"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </Button>
        </form>
      </div>

      <ScrollArea className="flex-1 px-4 py-3">
        {loading && (
          <div className="space-y-3" data-testid="search-loading">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#141414] border border-[#262626] rounded-md p-4 space-y-2">
                <Skeleton className="h-4 w-1/3 bg-[#1E1E1E]" />
                <Skeleton className="h-3 w-full bg-[#1E1E1E]" />
                <Skeleton className="h-3 w-2/3 bg-[#1E1E1E]" />
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-red-400 text-sm font-ibm" data-testid="search-error">{error}</p>}

        {results && results.length === 0 && (
          <p className="text-[#525252] text-sm font-ibm text-center py-8" data-testid="search-empty">No results found</p>
        )}

        {results && results.length > 0 && (
          <div className="space-y-3" data-testid="search-results">
            <p className="text-xs text-[#A3A3A3] font-ibm">{results.length} result{results.length !== 1 ? 's' : ''}</p>
            {results.map((r, i) => (
              <div
                key={i}
                className="bg-[#141414] border border-[#262626] rounded-md p-4 transition-all duration-200 hover:border-[#363636]"
                data-testid={`search-result-${i}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-[#A3A3A3]">
                    <FileCode className="w-3.5 h-3.5" />
                    <span className="font-mono">{r.file}</span>
                  </div>
                  <span className="text-xs font-mono text-blue-400">{r.relevance_score}</span>
                </div>
                <pre className="text-sm text-[#D4D4D4] font-mono whitespace-pre-wrap leading-relaxed max-h-32 overflow-hidden">
                  {r.content}
                </pre>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
