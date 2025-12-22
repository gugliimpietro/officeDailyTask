import React, { useState } from 'react';
import { Briefcase, Mail, Lock, ChevronLeft } from 'lucide-react';

export default function LoginPage({ onLogin }) {
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
    <form onSubmit={handleSignIn} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
        <input
          type="text"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="e.g., boss, leader1, sadiro"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
        <input
          type="password"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="123"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2 flex items-center gap-2">
          <Lock className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
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
    <form onSubmit={handleRecovery} className="space-y-4">
      <div className="bg-blue-50 border border-blue-100 text-blue-700 text-sm rounded-lg px-4 py-3 flex gap-2">
        <Mail className="w-4 h-4" />
        <p>Masukkan email yang terdaftar untuk menerima petunjuk pemulihan.</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Email Terdaftar</label>
        <input
          type="email"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="nama@perusahaan.go.id"
          value={recoveryEmail}
          onChange={(e) => setRecoveryEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Apa yang ingin dipulihkan?</p>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="radio"
            name="recoveryType"
            value="password"
            checked={recoveryType === 'password'}
            onChange={(e) => setRecoveryType(e.target.value)}
          />
          Password akun
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
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
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-2">
          {recoveryMessage}
        </div>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setMode('login')}
          className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg py-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Kembali ke Login
        </button>
        <button
          type="submit"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors"
        >
          Kirim Instruksi
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-lg mx-auto flex items-center justify-center mb-4">
            <Briefcase className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Office Daily Task</h1>
          <p className="text-slate-500">Export-Import Institution</p>
        </div>

        {mode === 'login' ? renderLoginForm() : renderRecoveryForm()}

        {mode === 'login' && (
          <div className="mt-6 text-xs text-slate-400 bg-slate-50 p-4 rounded border">
            <p className="font-bold mb-1">Demo Credentials (User / Pass):</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                Admin: <code className="text-blue-600">boss</code> / <code className="text-blue-600">123</code>
              </li>
              <li>
                Team Leader: <code className="text-blue-600">leader1</code> / <code className="text-blue-600">123</code>
              </li>
              <li>
                Members: <code className="text-blue-600">sadiro</code>, <code className="text-blue-600">fatin</code> /{' '}
                <code className="text-blue-600">123</code>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
