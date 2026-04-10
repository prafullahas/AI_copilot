import { useState } from 'react';
import { repoApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GitBranch, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function RepoIngest({ onIngested }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleIngest = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const { data } = await repoApi.ingest(url);
      setResult(data);
      onIngested?.(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Ingestion failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="repo-ingest-panel">
      <div className="flex items-center gap-2 mb-1">
        <GitBranch className="w-4 h-4 text-[#A3A3A3]" />
        <span className="text-xs uppercase tracking-[0.2em] text-[#A3A3A3] font-ibm">Repository</span>
      </div>
      <form onSubmit={handleIngest} className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          required
          data-testid="repo-url-input"
          className="flex-1 bg-[#0A0A0A] border-[#262626] text-white placeholder:text-[#525252] focus-visible:ring-1 focus-visible:ring-blue-500 h-10 font-mono text-sm"
        />
        <Button
          type="submit"
          disabled={loading}
          data-testid="repo-ingest-button"
          className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-ibm px-5 transition-all duration-200"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ingest'}
        </Button>
      </form>

      {loading && (
        <div className="flex items-center gap-2 text-[#A3A3A3] text-sm font-ibm" data-testid="repo-loading">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cloning and processing repository...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm" data-testid="repo-error">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="bg-[#141414] border border-[#262626] rounded-md p-4 text-sm font-ibm space-y-1" data-testid="repo-result">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-medium">Repository ingested</span>
          </div>
          <div className="text-[#A3A3A3]">Files: <span className="text-white">{result.fileCount}</span></div>
          <div className="text-[#A3A3A3]">Chunks: <span className="text-white">{result.chunkCount}</span></div>
          <div className="text-[#A3A3A3]">Embeddings: <span className="text-white">{result.embeddings?.totalEmbeddings}</span></div>
        </div>
      )}
    </div>
  );
}
