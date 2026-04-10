import { useState } from 'react';
import { repoApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GitBranch, Loader2, CheckCircle2, AlertCircle, FolderCode, Blocks, Database } from 'lucide-react';

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
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-[#737373]" />
        <span className="text-xs uppercase tracking-[0.15em] text-[#737373] font-ibm font-medium">Repository</span>
      </div>
      <form onSubmit={handleIngest} className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          required
          data-testid="repo-url-input"
          className="flex-1 bg-[#111111] border-[#1A1A1A] text-white placeholder:text-[#3A3A3A] focus-visible:ring-1 focus-visible:ring-blue-500/50 h-10 font-mono text-sm rounded-lg transition-all duration-200"
        />
        <Button
          type="submit"
          disabled={loading}
          data-testid="repo-ingest-button"
          className="h-10 bg-blue-600 hover:bg-blue-500 text-white font-ibm px-5 rounded-lg transition-all duration-200"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ingest'}
        </Button>
      </form>

      {loading && (
        <div className="flex items-center gap-3 text-sm font-ibm py-2" data-testid="repo-loading">
          <div className="relative">
            <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
          <span className="text-[#737373]">Cloning and processing...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 text-red-400 text-sm bg-red-500/5 border border-red-500/10 rounded-lg px-4 py-3" data-testid="repo-error">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-ibm">{error}</span>
        </div>
      )}

      {result && (
        <div className="bg-[#111111] border border-[#1A1A1A] rounded-lg p-4" data-testid="repo-result">
          <div className="flex items-center gap-2 text-green-400 mb-3">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-ibm font-medium">Repository ingested</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#0A0A0A] rounded-md p-3 text-center">
              <FolderCode className="w-4 h-4 text-[#525252] mx-auto mb-1.5" />
              <div className="text-white text-lg font-outfit font-light">{result.fileCount}</div>
              <div className="text-[#525252] text-[10px] uppercase tracking-wider">Files</div>
            </div>
            <div className="bg-[#0A0A0A] rounded-md p-3 text-center">
              <Blocks className="w-4 h-4 text-[#525252] mx-auto mb-1.5" />
              <div className="text-white text-lg font-outfit font-light">{result.chunkCount}</div>
              <div className="text-[#525252] text-[10px] uppercase tracking-wider">Chunks</div>
            </div>
            <div className="bg-[#0A0A0A] rounded-md p-3 text-center">
              <Database className="w-4 h-4 text-[#525252] mx-auto mb-1.5" />
              <div className="text-white text-lg font-outfit font-light">{result.embeddings?.totalEmbeddings}</div>
              <div className="text-[#525252] text-[10px] uppercase tracking-wider">Vectors</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
