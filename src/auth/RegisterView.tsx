import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Sprout, User, Phone, Lock, MapPin, ArrowLeft } from 'lucide-react';

export function RegisterView({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    full_name: '',
    phone: '+260',
    email: '',
    password: '',
    role: 'farmer',
    village: '',
    province: 'Eastern',
    language: 'English',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-[#0a140d] to-black p-4">
      <div className="w-full max-w-lg">
        <button
          onClick={onSwitchToLogin}
          className="mb-4 text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-3 h-3" /> Back to login
        </button>

        <form onSubmit={submit} className="bg-[#101b13] border border-[#1e3623] rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="text-center">
            <Sprout className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
            <h2 className="text-lg font-bold text-white">Create Account</h2>
            <p className="text-[11px] text-gray-400">All roles supported · farmers, sellers, buyers, transporters</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field icon={<User className="w-4 h-4" />} label="Full Name">
              <input
                value={form.full_name}
                onChange={(e) => set('full_name', e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                placeholder="Chanda Mwape"
              />
            </Field>

            <Field icon={<Phone className="w-4 h-4" />} label="Phone Number">
              <input
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                placeholder="+260970000002"
              />
            </Field>

            <Field icon={<Phone className="w-4 h-4" />} label="Email (optional)">
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                className="w-full px-3 py-2.5 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                placeholder="you@example.com"
              />
            </Field>

            <Field icon={<Lock className="w-4 h-4" />} label="Password / PIN">
              <input
                type="password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                placeholder="minimum 4 characters"
                minLength={4}
              />
            </Field>

            <Field label="Role">
              <select
                value={form.role}
                onChange={(e) => set('role', e.target.value)}
                className="w-full px-3 py-2.5 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="farmer">Farmer</option>
                <option value="seller">Seller / Cooperative</option>
                <option value="customer">Buyer / Customer</option>
                <option value="transporter">Transporter</option>
              </select>
            </Field>

            <Field icon={<MapPin className="w-4 h-4" />} label="Village / Town">
              <input
                value={form.village}
                onChange={(e) => set('village', e.target.value)}
                className="w-full px-3 py-2.5 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                placeholder="Msekera"
              />
            </Field>

            <Field label="Province">
              <select
                value={form.province}
                onChange={(e) => set('province', e.target.value)}
                className="w-full px-3 py-2.5 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option>Eastern</option>
                <option>Lusaka</option>
                <option>Central</option>
                <option>Southern</option>
                <option>Northern</option>
                <option>Western</option>
                <option>North-Western</option>
                <option>Muchinga</option>
                <option>Luapula</option>
                <option>Copperbelt</option>
              </select>
            </Field>

            <Field label="Language">
              <select
                value={form.language}
                onChange={(e) => set('language', e.target.value)}
                className="w-full px-3 py-2.5 bg-[#152418] border border-[#233f28] rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option>English</option>
                <option>Bemba</option>
                <option>Nyanja</option>
                <option>Tonga</option>
                <option>Lozi</option>
                <option>Lunda</option>
                <option>Luvale</option>
                <option>Kaonde</option>
              </select>
            </Field>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-xs text-rose-200">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-950 transition active:scale-[0.98] cursor-pointer"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>

          <p className="text-center text-[11px] text-gray-500">
            Feature phone users: dial <strong className="text-emerald-400">*2873#</strong> and select "Register new account"
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({ icon, label, children }: { icon?: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-bold text-gray-400 block mb-1.5 uppercase tracking-wide flex items-center gap-1">
        {icon} {label}
      </label>
      {children}
    </div>
  );
}
