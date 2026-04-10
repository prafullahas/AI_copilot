import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Terminal, ArrowRight, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authApi.register(email, password);
      localStorage.setItem('token', data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="register-page">
      <div
        className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden"
        style={{ background: '#050505' }}
      >
        <img
          src="https://images.unsplash.com/photo-1714548529197-537c1f0b6aa7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2OTV8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMHRlY2hub2xvZ3klMjBiYWNrZ3JvdW5kfGVufDB8fHx8MTc3NTgxNjA1M3ww&ixlib=rb-4.1.0&q=85&w=1200"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="relative z-10 p-12 max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <Terminal className="w-8 h-8 text-blue-500" />
            <span className="font-outfit text-2xl font-light text-white tracking-tight">Copilot</span>
          </div>
          <h1 className="font-outfit text-4xl font-light text-white tracking-tight leading-none mb-4">
            Start exploring codebases
          </h1>
          <p className="text-[#A3A3A3] text-sm font-ibm leading-relaxed">
            Create an account to ingest repositories and unlock AI-powered code search and chat.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 bg-[#0A0A0A]">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <Terminal className="w-6 h-6 text-blue-500" />
            <span className="font-outfit text-xl font-light text-white tracking-tight">Copilot</span>
          </div>
          <div>
            <h2 className="font-outfit text-2xl font-light text-white tracking-tight">Create account</h2>
            <p className="text-[#A3A3A3] text-sm font-ibm mt-1">Get started in seconds</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="register-form">
            {error && (
              <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-md px-4 py-3" data-testid="register-error">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#A3A3A3] text-xs uppercase tracking-[0.2em]">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                data-testid="register-email-input"
                className="bg-[#0A0A0A] border-[#262626] text-white placeholder:text-[#525252] focus-visible:ring-1 focus-visible:ring-blue-500 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#A3A3A3] text-xs uppercase tracking-[0.2em]">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                minLength={6}
                data-testid="register-password-input"
                className="bg-[#0A0A0A] border-[#262626] text-white placeholder:text-[#525252] focus-visible:ring-1 focus-visible:ring-blue-500 h-11"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              data-testid="register-submit-button"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-ibm transition-all duration-200"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create account <ArrowRight className="w-4 h-4 ml-2" /></>}
            </Button>
          </form>

          <p className="text-center text-sm text-[#A3A3A3] font-ibm">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-500 hover:text-blue-400 transition-colors" data-testid="login-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
