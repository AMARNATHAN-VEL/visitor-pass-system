import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, ShieldCheck } from 'lucide-react';

const ROLE_HOME = {
  Admin: '/admin/dashboard',
  Receptionist: '/receptionist/register-visitor',
  Employee: '/employee/pending-requests',
};

export default function Login() {
  const { user, login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Already logged in -> go to role home or intended destination.
  if (isAuthenticated) {
    return <Navigate to={from || ROLE_HOME[user?.role] || '/login'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await login(email, password);
      navigate(from || ROLE_HOME[data.role] || '/login', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 p-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-600">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Visitor Pass System</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </section>
    </main>
  );
}