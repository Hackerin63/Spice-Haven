import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '@/api/services';
import { useAuthStore } from '@/contexts/authStore';
import { getErrorMessage } from '@/api/client';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // Trim defensively - a trailing space from copy/pasting credentials is
      // one of the most common causes of a "correct" login failing.
      const { token, user } = await login(email.trim(), password);
      setAuth(token, user);
      toast.success(`Welcome back, ${user.name}`);
      navigate('/admin');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal/[0.03] px-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm space-y-4 p-8">
        <h1 className="text-center text-2xl font-bold">Restaurant Admin</h1>
        <p className="text-center text-sm text-charcoal/50">Sign in to manage your restaurant</p>
        <input
          type="email"
          required
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-xl border border-charcoal/15 p-3 text-sm"
        />
        <input
          type="password"
          required
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-xl border border-charcoal/15 p-3 text-sm"
        />
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
