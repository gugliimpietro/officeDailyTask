import React from 'react';
import { ArrowRight, Briefcase, CheckCircle2, Clock3, Shield } from 'lucide-react';

export default function LandingPage({ onSignIn }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_40%)]" />
      <div className="absolute -left-24 -bottom-24 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute -right-24 -top-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />

      <header className="relative max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white w-11 h-11 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-700">Office Daily Task</p>
            <p className="text-xs text-slate-500">Export-Import Institution</p>
          </div>
        </div>
        <button
          onClick={onSignIn}
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-600 text-blue-700 font-semibold hover:bg-blue-50 transition"
        >
          Masuk
          <ArrowRight className="w-4 h-4" />
        </button>
      </header>

      <main className="relative max-w-6xl mx-auto px-6 pb-16 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
            <Shield className="w-4 h-4" />
            Sistem internal ekspor-impor
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-slate-900">
              Kelola pekerjaan harian dengan rapi dan cepat.
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Pantau progres tugas, tindak lanjuti komentar, dan kirim dokumen dengan alur yang jelas untuk seluruh tim.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {[
              'Ringkasan status tugas real-time',
              'Akses aman per peran (Admin/Leader/Member)',
              'Riwayat komentar dan permintaan buka kembali',
              'Generator surat untuk kebutuhan ekspor-impor',
            ].map((text) => (
              <div key={text} className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                <span>{text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onSignIn}
              className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition"
            >
              Masuk ke Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Clock3 className="w-4 h-4 text-slate-500" />
              <span>Demo kredensial tersedia di halaman masuk.</span>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700">Snapshot hari ini</p>
              <p className="text-xs text-slate-500">Pemantauan cepat tim ekspor-impor</p>
            </div>
            <div className="text-xs px-3 py-1 rounded-full bg-green-50 text-green-700 font-semibold">Online</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Tugas baru', value: '08', tone: 'text-blue-700 bg-blue-50' },
              { label: 'Sedang jalan', value: '14', tone: 'text-amber-700 bg-amber-50' },
              { label: 'Butuh review', value: '05', tone: 'text-purple-700 bg-purple-50' },
              { label: 'Selesai', value: '21', tone: 'text-emerald-700 bg-emerald-50' },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl p-4 border border-slate-100 bg-slate-50`}>
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className={`text-2xl font-bold ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-100 p-4 bg-slate-50">
            <p className="text-sm font-semibold text-slate-800 mb-1">Keamanan berlapis</p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Akses dibatasi per peran dan semua aktivitas terekam sehingga audit internal tetap mudah.
            </p>
          </div>

          <button
            onClick={onSignIn}
            className="w-full inline-flex justify-center items-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition"
          >
            Lanjutkan ke Halaman Masuk
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  );
}
