import React, { useState } from 'react';
import { Briefcase, Mail, Lock, ChevronLeft } from 'lucide-react';

export default function LoginPage({ onLogin, onBack }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login'); // login | recovery
  const [error, setError] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryType, setRecoveryType] = useState('password');
  const [recoveryMessage, setRecoveryMessage] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    const result = await Promise.resolve(onLogin(username, password));
    if (!result?.ok) {
      setError(result?.message || 'Username atau password salah.');
    }
  };

  const handleRecovery = (e) => {
    e.preventDefault();
    if (!recoveryEmail.trim()) {
      setRecoveryMessage('Masukkan email yang terdaftar.');
      return;
    }
    setRecoveryMessage(
      `Kami telah mengirim petunjuk reset ${recoveryType === 'password' ? 'password' : 'username'} ke ${recoveryEmail}.`
    );
    setRecoveryEmail('');
  };

  const renderLoginForm = () => (
    <form onSubmit={handleSignIn} className="space-y-5">
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-800">Username</label>
        <input
          type="text"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          placeholder="e.g., boss, leader1, sadiro"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-800">Password</label>
        <input
          type="password"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          placeholder="123"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <Lock className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <button
        type="submit"
        className="w-full inline-flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-blue-500/25"
      >
        Sign In
      </button>
      <button
        type="button"
        onClick={() => {
          setMode('recovery');
          setRecoveryMessage('');
        }}
        className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-semibold"
      >
        Lupa username / password?
      </button>
    </form>
  );

  const renderRecoveryForm = () => (
    <form onSubmit={handleRecovery} className="space-y-5">
      <div className="bg-blue-50 border border-blue-100 text-blue-800 text-sm rounded-xl px-4 py-3 flex gap-2">
        <Mail className="w-4 h-4 shrink-0" />
        <p className="leading-relaxed">Masukkan email yang terdaftar untuk menerima petunjuk pemulihan.</p>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-800">Email Terdaftar</label>
        <input
          type="email"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          placeholder="nama@perusahaan.go.id"
          value={recoveryEmail}
          onChange={(e) => setRecoveryEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-800">Apa yang ingin dipulihkan?</p>
        <label className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-transparent hover:border-slate-200 transition">
          <input
            type="radio"
            name="recoveryType"
            value="password"
            checked={recoveryType === 'password'}
            onChange={(e) => setRecoveryType(e.target.value)}
          />
          Password akun
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-transparent hover:border-slate-200 transition">
          <input
            type="radio"
            name="recoveryType"
            value="username"
            checked={recoveryType === 'username'}
            onChange={(e) => setRecoveryType(e.target.value)}
          />
          Username akun
        </label>
      </div>
      {recoveryMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl px-4 py-3">
          {recoveryMessage}
        </div>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setMode('login')}
          className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl py-3"
        >
          <ChevronLeft className="w-4 h-4" />
          Kembali ke Login
        </button>
        <button
          type="submit"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-blue-500/25"
        >
          Kirim Instruksi
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 relative overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_45%)]" />
      <div className="absolute -left-20 -bottom-24 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute -right-16 -top-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-700">Office Daily Task</p>
              <p className="text-xs text-slate-500">Export-Import Institution</p>
            </div>
          </div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg bg-white/80"
            >
              <ChevronLeft className="w-4 h-4" />
              Kembali ke landing
            </button>
          )}
        </div>

        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden grid md:grid-cols-5">
          <div className="hidden md:flex md:col-span-2 bg-gradient-to-b from-blue-700 to-indigo-700 text-white p-8 flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 rounded-full text-xs font-semibold uppercase tracking-wide">
                <Briefcase className="w-4 h-4" />
                <span>Office Daily Task</span>
              </div>
              <h2 className="mt-6 text-2xl font-semibold">Masuk dan lanjutkan pekerjaan</h2>
              <p className="mt-3 text-sm text-blue-100 leading-relaxed">
                Pantau tugas ekspor-impor, berikan catatan, dan selesaikan lebih cepat bersama tim.
              </p>
            </div>
            <div className="space-y-2 text-sm text-blue-100">
              <p className="font-semibold text-white">Butuh akun demo?</p>
              <p>Admin: boss / 123</p>
              <p>Team Leader: leader1 / 123</p>
              <p>Members: sadiro, fatin / 123</p>
            </div>
          </div>

          <div className="col-span-5 md:col-span-3 p-8 sm:p-10">
            <div className="mb-6 sm:mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                <Briefcase className="w-4 h-4" />
                <span>Export-Import Institution</span>
              </div>
              <h1 className="mt-4 text-3xl font-bold text-slate-900">Masuk ke dashboard</h1>
              <p className="text-slate-500 mt-1">Akses pekerjaan harian dan pantau progres tim dengan cepat.</p>
            </div>

            {mode === 'login' ? renderLoginForm() : renderRecoveryForm()}

            {mode === 'login' && (
              <div className="mt-8 text-xs text-slate-600 bg-slate-50 border border-slate-100 p-4 sm:p-5 rounded-xl">
                <p className="font-semibold text-slate-800 mb-2">Demo Credentials (User / Pass)</p>
                <div className="grid sm:grid-cols-2 gap-y-1 gap-x-4">
                  <p>
                    Admin: <code className="text-blue-700">boss</code> / <code className="text-blue-700">123</code>
                  </p>
                  <p>
                    Team Leader: <code className="text-blue-700">leader1</code> / <code className="text-blue-700">123</code>
                  </p>
                  <p className="sm:col-span-2">
                    Members: <code className="text-blue-700">sadiro</code>, <code className="text-blue-700">fatin</code> /{' '}
                    <code className="text-blue-700">123</code>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
