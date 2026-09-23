import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Sprout, Smartphone, Mail, Lock, LogIn } from 'lucide-react';

const DEMO = [
  ['Admin', 'admin@mundasense.zm'],
  ['Farmer', 'farmer@mundasense.zm'],
  ['Seller', 'seller@mundasense.zm'],
  ['Customer', 'customer@mundasense.zm'],
  ['Transporter', 'transporter@mundasense.zm'],
];

export function LoginView({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('admin@mundasense.zm');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-[#0a140d] to-black p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <Sprout className="w-8 h-8 text-emerald-400" />
            <h1 className="text-2xl font-extrabold text-white">MundaSense</h1>
          </div>
          <p className="text-xs text-emerald-300">Smallholder IoT · AI Screening · Zambia 🇿🇲</p>
        </div>

        <form onSubmit={submit} className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-6 shadow-2xl space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 block mb-1.5 uppercase tracking-wide">
              Email or Phone
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="farmer@mundasense.zm or +260970000002"
                className="w-full pl-10 pr-3 py-2.5 bg-[#152418] border border-[#233f28] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-400 block mb-1.5 uppercase tracking-wide">
              Password / PIN
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="demo1234 or 4-digit PIN"
                className="w-full pl-10 pr-3 py-2.5 bg-[#152418] border border-[#233f28] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-xs text-rose-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition active:scale-[0.98] cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Logging in…' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={onSwitchToRegister}
            className="w-full py-2.5 text-emerald-400 hover:text-emerald-300 text-xs font-semibold cursor-pointer"
          >
            New here? Create an account →
          </button>
        </form>

        <div className="mt-6 p-4 bg-[#0d1710] border border-[#1e3623] rounded-xl">
          <p className="text-[11px] text-gray-400 mb-2 flex items-center gap-1">
            <Smartphone className="w-3 h-3" /> Demo accounts (password: <code className="text-emerald-400">demo1234</code>)
          </p>
          <div className="flex flex-wrap gap-2">
            {DEMO.map(([label, email]) => (
              <button
                key={email}
                type="button"
                onClick={() => {
                  setIdentifier(email);
                  setPassword('demo1234');
                }}
                className="text-[11px] bg-[#182a1c] hover:bg-[#223d28] text-emerald-300 border border-[#24402a] px-2.5 py-1 rounded-lg font-semibold cursor-pointer"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-[11px] text-gray-500 mt-4">
          Feature phone? Dial <strong className="text-emerald-400">*2873#</strong> to register
        </p>
      </div>
    </div>
  );
}
