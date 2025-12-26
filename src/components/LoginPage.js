import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';
import { Briefcase, ChevronLeft, Loader2, AlertCircle } from 'lucide-react'; // Removed Mail, Lock

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAppState();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login'); 
  const [error, setError] = useState('');
  
  const from = location.state?.from?.pathname || "/dashboard";

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError("Mohon isi username dan password");
      return;
    }

    const result = await login(username, password);
    
    if (result.ok) {
      navigate(from, { replace: true });
    } else {
      setError(result.message || 'Gagal masuk.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl mix-blend-screen"></div>
      </div>

      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10 border border-white/20">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
            <Briefcase className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Office Daily Task</h1>
          <p className="text-slate-500 text-sm mt-1">Export-Import Operations Platform</p>
        </div>

        {mode === 'login' ? (
           <form onSubmit={handleSignIn} className="space-y-5">
             <div>
               <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 ml-1">Username</label>
               <input
                 type="text"
                 className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-800 placeholder:text-slate-400"
                 placeholder="e.g. boss"
                 value={username}
                 onChange={(e) => setUsername(e.target.value)}
                 disabled={isLoading}
               />
             </div>
             <div>
               <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5 ml-1">Password</label>
               <input
                 type="password"
                 className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-800"
                 placeholder="••••••"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 disabled={isLoading}
               />
             </div>
             
             {error && (
               <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg px-4 py-3 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                 <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                 <span>{error}</span>
               </div>
             )}

             <button
               type="submit"
               disabled={isLoading}
               className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
             >
               {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
             </button>
             
             <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('recovery')}
                  className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors"
                >
                  Lupa akses akun?
                </button>
             </div>
           </form>
        ) : (
          <div className="space-y-4">
             <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm border border-blue-100">
               Hubungi Administrator IT untuk mereset password Anda.
             </div>
             <button
               onClick={() => setMode('login')}
               className="w-full border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
             >
               <ChevronLeft className="w-4 h-4" /> Kembali Login
             </button>
          </div>
        )}

        <div className="mt-8 border-t border-slate-100 pt-6">
          <p className="text-xs text-center text-slate-400 mb-3 uppercase tracking-wider font-semibold">Demo Accounts</p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
             <div 
                className="bg-slate-50 p-2 rounded cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition"
                onClick={() => { setUsername('boss'); setPassword('123'); }}
             >
               <strong>Admin</strong><br/>boss / 123
             </div>
             <div 
                className="bg-slate-50 p-2 rounded cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition"
                onClick={() => { setUsername('leader1'); setPassword('123'); }}
             >
               <strong>Leader</strong><br/>leader1 / 123
             </div>
             <div 
                className="bg-slate-50 p-2 rounded cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition"
                onClick={() => { setUsername('sadiro'); setPassword('123'); }}
             >
               <strong>Staff</strong><br/>sadiro / 123
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}