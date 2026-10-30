import React, { useState } from 'react';
import { Sparkles, User, Lock, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export default function LoginView() {
  const { login, demoUsers, switchUser } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoUser: any) => {
    switchUser(demoUser);
  };

  return (
    <div className="min-h-screen bg-[#111927] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
        {/* Brand Icon & Heading */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-indigo-500/25">
            <Sparkles size={24} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            EnterpriseIQ Access Portal
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            AI-Powered Enterprise Knowledge & Decision Management
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-600 rounded-xl text-xs">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#0c1322] hover:bg-[#1a233a] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In to EnterpriseIQ'}
          </button>
        </form>

        {/* 1-Click Instant Demo Logins */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
            Instant 1-Click Demo Logins:
          </div>

          <div className="space-y-2">
            {demoUsers.length > 0 ? (
              demoUsers.map((dUser) => (
                <button
                  key={dUser.username}
                  type="button"
                  onClick={() => handleQuickLogin(dUser)}
                  className="w-full p-2.5 bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 rounded-xl flex items-center justify-between text-left transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                      {dUser.avatar_initial}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">
                        {dUser.name}
                      </div>
                      <div className="text-[10px] text-slate-500 capitalize">
                        {dUser.role} • {dUser.department} Clearance
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                    Login →
                  </span>
                </button>
              ))
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => login('admin', 'admin123')}
                  className="w-full p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-slate-800">Eleanor Vance (Admin - Executive)</span>
                  <span className="text-indigo-600 font-bold">Login →</span>
                </button>
                <button
                  type="button"
                  onClick={() => login('employee', 'employee123')}
                  className="w-full p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-slate-800">Alex Rivera (Employee - Operations)</span>
                  <span className="text-indigo-600 font-bold">Login →</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
