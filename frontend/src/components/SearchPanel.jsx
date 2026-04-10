import { useState } from 'react';
import { searchApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, FileCode, Loader2, Code2 } from 'lucide-react';

export default function SearchPanel() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setError('');
    setResults(null);
    setExpanded(null);
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
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#1A1A1A] shrink-0">
        <Search className="w-4 h-4 text-[#737373]" />
        <span className="text-xs uppercase tracking-[0.15em] text-[#737373] font-ibm font-medium">Semantic Search</span>
      </div>

      <div className="p-4 border-b border-[#1A1A1A] shrink-0">
        <form onSubmit={handleSearch} className="flex gap-2" data-testid="search-form">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search code semantically..."
            data-testid="search-input"
            className="flex-1 bg-[#111111] border-[#1A1A1A] text-white placeholder:text-[#3A3A3A] focus-visible:ring-1 focus-visible:ring-blue-500/50 h-10 font-ibm text-sm rounded-lg transition-all duration-200"
          />
          <Button
            type="submit"
            disabled={loading || !query.trim()}
            data-testid="search-submit-button"
            className="h-10 bg-blue-600 hover:bg-blue-500 disabled:bg-[#1A1A1A] text-white font-ibm px-5 rounded-lg transition-all duration-200"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </Button>
        </form>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {loading && (
            <div className="space-y-3" data-testid="search-loading">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[#111111] border border-[#1A1A1A] rounded-lg p-4 space-y-2.5">
                  <Skeleton className="h-3.5 w-2/5 bg-[#1A1A1A]" />
                  <Skeleton className="h-3 w-full bg-[#1A1A1A]" />
                  <Skeleton className="h-3 w-3/4 bg-[#1A1A1A]" />
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-red-400 text-sm font-ibm px-1" data-testid="search-error">{error}</p>}

          {results && results.length === 0 && (
            <div className="text-center py-10" data-testid="search-empty">
              <Code2 className="w-8 h-8 text-[#1A1A1A] mx-auto mb-3" />
              <p className="text-[#3A3A3A] text-sm font-ibm">No results found</p>
            </div>
          )}

          {results && results.length > 0 && (
            <div className="space-y-2" data-testid="search-results">
              <p className="text-xs text-[#525252] font-ibm px-1 mb-3">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="w-full text-left bg-[#111111] border border-[#1A1A1A] rounded-lg p-4 transition-all duration-200 hover:border-[#262626] hover:bg-[#131313]"
                  data-testid={`search-result-${i}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs text-[#737373]">
                      <FileCode className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-mono truncate">{r.file}</span>
                    </div>
                    <span className="text-[10px] font-mono text-blue-400/70 bg-blue-500/10 px-2 py-0.5 rounded">{r.relevance_score}</span>
                  </div>
                  <pre
                    className={`text-xs text-[#A3A3A3] font-mono whitespace-pre-wrap leading-relaxed transition-all duration-200 overflow-hidden ${
                      expanded === i ? 'max-h-96' : 'max-h-16'
                    }`}
                  >
                    {r.content}
                  </pre>
                  {r.content.split('\n').length > 3 && (
                    <span className="text-[10px] text-[#525252] mt-2 inline-block">
                      {expanded === i ? 'Click to collapse' : 'Click to expand'}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
