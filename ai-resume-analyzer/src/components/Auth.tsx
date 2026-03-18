import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Role } from '../types';
import { Mail, Lock, User as UserIcon, Briefcase } from 'lucide-react';

interface Props {
  type: 'login' | 'signup';
  onAuth: (user: User, token: string) => void;
}

export default function Auth({ type, onAuth }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('SEEKER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = type === 'login' ? '/api/auth/login' : '/api/auth/signup';
    const body = type === 'login' ? { email, password } : { name, email, password, role };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      if (type === 'login') {
        onAuth(data.user, data.token);
        navigate('/');
      } else {
        // After signup, log in automatically
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const loginData = await loginRes.json();
        onAuth(loginData.user, loginData.token);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl border border-zinc-200 shadow-sm">
      <h2 className="text-3xl font-montserrat font-black text-zinc-900 mb-8 text-center uppercase tracking-tight">
        {type === 'login' ? 'Welcome Back' : 'Join Us'}
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {type === 'signup' && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-600 ml-1">Full Name</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                placeholder="John Doe"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-600 ml-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
              placeholder="name@example.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-600 ml-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
              placeholder="••••••••"
            />
          </div>
        </div>

        {type === 'signup' && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-600 ml-1">I am a...</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('SEEKER')}
                className={`py-3 rounded-2xl border-2 font-semibold transition-all ${role === 'SEEKER' ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'}`}
              >
                Job Seeker
              </button>
              <button
                type="button"
                onClick={() => setRole('RECRUITER')}
                className={`py-3 rounded-2xl border-2 font-semibold transition-all ${role === 'RECRUITER' ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 text-zinc-600 hover:border-zinc-300'}`}
              >
                Recruiter
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold text-lg hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        >
          {loading ? 'Processing...' : type === 'login' ? 'Login' : 'Create Account'}
        </button>
      </form>

      <div className="mt-8 text-center text-zinc-600 text-sm">
        {type === 'login' ? (
          <>
            Don't have an account?{' '}
            <Link to="/signup" className="font-bold text-zinc-900 hover:underline">Sign Up</Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-zinc-900 hover:underline">Login</Link>
          </>
        )}
      </div>
    </div>
  );
}
