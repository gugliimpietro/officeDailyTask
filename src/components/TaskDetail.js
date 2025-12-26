import React, { useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext'; 
import { MessageSquare, Clock, CheckCircle, RotateCcw, Lock, RefreshCw, FileText, Paperclip, X, AlertCircle, XCircle, ArrowLeft } from 'lucide-react';
import { formatDateTime } from '../utils/helpers';
import { INITIAL_USERS, TEAMS } from '../data/mockData';

export default function TaskDetail() {
  const { taskId } = useParams(); // FIXED: Get ID from URL
  const navigate = useNavigate();
  
  // FIXED: Get functions from context
  const { 
    user: currentUser, 
    tasks, 
    addComment, 
    closeTask, 
    requestReopen, 
    reopenTask, 
    acceptTask, 
    rejectTask 
  } = useAppState();

  // Find the specific task
  const task = useMemo(() => 
    tasks.find(t => String(t.id) === String(taskId)), 
    [tasks, taskId]
  );

  const comments = task?.comments || [];
  const [commentText, setCommentText] = useState('');
  const [attachmentData, setAttachmentData] = useState(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [closeNote, setCloseNote] = useState('');
  const [showReopenRequestModal, setShowReopenRequestModal] = useState(false);
  const [reopenRequestNote, setReopenRequestNote] = useState('');
  const [showLeaderReopenModal, setShowLeaderReopenModal] = useState(false);
  const [leaderReopenNote, setLeaderReopenNote] = useState('');
  const fileInputRef = useRef(null);

  // --- Handlers ---
  const handleBack = () => navigate('/dashboard');

  if (!task) return <div className="p-8 text-center text-slate-500">Loading task...</div>;
  if (!currentUser) return null;

  const viewer = currentUser;
  const viewerInitial = viewer.name ? viewer.name.charAt(0).toUpperCase() : '?';

  const resetAttachment = () => {
    setAttachmentData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (!commentText.trim() && !attachmentData) return;
    addComment(task.id, {
      text: commentText.trim(),
      attachment: attachmentData,
    });
    setCommentText('');
    resetAttachment();
  };

  const handleFileChange = (e) => {
    if (!e.target.files || !e.target.files[0]) {
      resetAttachment();
      return;
    }
    const selected = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentData({
        name: selected.name,
        type: selected.type,
        size: selected.size,
        dataUrl: reader.result,
        isImage: selected.type?.startsWith('image/'),
      });
    };
    reader.readAsDataURL(selected);
  };

  const handleCloseTaskConfirm = () => {
    closeTask(task.id, closeNote.trim());
    setCloseNote('');
    setShowCloseConfirm(false);
  };

  const handleReopenRequestConfirm = () => {
    if (!reopenRequestNote.trim()) return;
    requestReopen(task.id, reopenRequestNote.trim());
    setReopenRequestNote('');
    setShowReopenRequestModal(false);
  };

  const handleLeaderReopenConfirm = () => {
    if (!leaderReopenNote.trim()) return;
    reopenTask(task.id, leaderReopenNote.trim());
    setLeaderReopenNote('');
    setShowLeaderReopenModal(false);
  };

  const isLeaderOrAdmin = viewer.role === 'TEAM_LEADER' || viewer.role === 'ADMIN';
  const canClose = task.status === 'Running' && (isLeaderOrAdmin || viewer.id === task.assigneeId);
  const canRequestReopen =
    (task.status === 'Done' || task.status === 'Rejected') &&
    viewer.role === 'TEAM_MEMBER' &&
    viewer.id === task.assigneeId &&
    !task.reopenRequested;
  const canLeaderReopen =
    isLeaderOrAdmin && (task.status === 'Done' || task.status === 'Rejected' || task.reopenRequested);
  const isTaskClosed = task.status === 'Done' || task.status === 'Rejected';
  const isPendingAcceptance = viewer.role === 'TEAM_MEMBER' && task.status === 'New' && task.assigneeId === viewer.id;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-100 p-6">
        <button
          onClick={handleBack}
          className="text-sm text-slate-500 hover:text-blue-600 mb-4 inline-flex items-center gap-2 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard</span>
        </button>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-mono text-sm font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{task.code}</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">Due: {task.dueDate}</span>
              <span className="text-xs text-slate-400 flex items-center gap-1 border-l border-slate-200 pl-2"><Clock className="w-3 h-3" /> Created: {formatDateTime(task.createdAt)}</span>
            </div>
            {task.jobType && (
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-1">
                {task.jobType}
              </p>
            )}
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">{task.title}</h1>
          </div>
          <div className="flex flex-col items-end gap-3 shrink-0">
             <div className="text-right">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Status</p>
                <div className="flex gap-2 items-center">
                    {task.reopenRequested && <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded animate-pulse">REOPEN REQUESTED</span>}
                    <p className={`font-bold px-3 py-1 rounded-full text-sm inline-block ${task.status === 'Done' ? 'bg-green-100 text-green-700' : task.status === 'Running' ? 'bg-orange-100 text-orange-700' : task.status === 'Rejected' ? 'bg-red-800 text-white' : 'bg-slate-100 text-slate-700'}`}>{task.status}</p>
                </div>
                {task.completedAt && (
                  <p className="text-xs text-slate-400 mt-2">
                    Selesai: {formatDateTime(task.completedAt)}
                  </p>
                )}
             </div>
             <div className="flex flex-col gap-2 w-full">
                {canClose && (
                  <button
                    onClick={() => setShowCloseConfirm(true)}
                    className="flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm w-full"
                  >
                    <CheckCircle className="w-4 h-4" /> Selesai
                  </button>
                )}
                {canLeaderReopen && (
                  <button
                    onClick={() => setShowLeaderReopenModal(true)}
                    className="flex items-center justify-center gap-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm w-full"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {task.reopenRequested ? 'Tindaklanjuti Reopen' : 'Buka Kembali'}
                  </button>
                )}
             </div>
             {task.reopenRequested && (
               <div className="w-full rounded-lg border border-orange-200 bg-orange-50 p-3 text-xs text-orange-700">
                 <p className="text-sm font-semibold text-orange-800">
                   Permintaan buka kembali oleh {task.reopenRequestedByName || 'Anggota'}
                 </p>
                 {task.reopenReason && <p className="mt-1">{task.reopenReason}</p>}
               </div>
             )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
        <div className="lg:col-span-2 p-6">
          <div className="prose prose-sm max-w-none text-slate-600 mb-8"><h3 className="text-slate-900 font-semibold mb-2">Deskripsi Pekerjaan</h3><p>{task.description}</p></div>
          <div className="mt-8">
            <h3 className="text-slate-900 font-semibold mb-4 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Activity Timeline</h3>
            <div className="space-y-6">
              {comments.length === 0 && <p className="text-sm text-slate-400 italic">No comments yet.</p>}
              {comments.map((comment) => {
                const attachment =
                  typeof comment.attachment === 'string'
                    ? { name: comment.attachment, dataUrl: null, isImage: false }
                    : comment.attachment;
                return (
                  <div key={comment.id} className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${comment.role === 'TEAM_LEADER' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>{comment.authorName.charAt(0)}</div>
                    <div className="bg-gray-50 rounded-lg p-3 w-full">
                      <div className="flex justify-between items-baseline mb-1"><span className="font-semibold text-sm text-slate-900">{comment.authorName}</span><span className="text-xs text-slate-400">{formatDateTime(comment.createdAt)}</span></div>
                      <p className="text-sm text-slate-700">{comment.text}</p>
                      {attachment && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500 tracking-wide">
                            <Paperclip className="w-3 h-3" />
                            Lampiran
                          </div>
                          {attachment.isImage && attachment.dataUrl ? (
                            <div className="rounded-lg overflow-hidden border border-gray-200">
                              <img
                                src={attachment.dataUrl}
                                alt={attachment.name || 'Lampiran'}
                                className="max-h-60 w-full object-cover"
                              />
                            </div>
                          ) : attachment.dataUrl ? (
                            <a
                              href={attachment.dataUrl}
                              download={attachment.name || 'lampiran'}
                              className="inline-flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                              <span>{attachment.name || 'Lampiran'}</span>
                            </a>
                          ) : (
                            <div className="inline-flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded text-xs text-slate-600">
                              <FileText className="w-4 h-4" />
                              <span>{attachment.name || 'Lampiran'}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {isPendingAcceptance ? (
               <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200 text-center">
                  <div className="flex flex-col items-center gap-3">
                      <AlertCircle className="w-8 h-8 text-blue-500" />
                      <div><p className="font-bold text-slate-800">Menunggu Konfirmasi Anda</p><p className="text-sm text-slate-500">Anda harus menerima atau menolak pekerjaan ini sebelum dapat memulai diskusi.</p></div>
                      <div className="flex gap-3 mt-2">
                        <button onClick={() => acceptTask(task.id)} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"><CheckCircle className="w-4 h-4" /> Terima</button>
                        <button onClick={() => rejectTask(task.id)} className="flex items-center gap-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm font-bold px-4 py-2 rounded-lg transition-colors"><XCircle className="w-4 h-4" /> Tolak</button>
                      </div>
                      <button
                        onClick={handleBack}
                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Kembali ke Dashboard</span>
                      </button>
                  </div>
               </div>
            ) : isTaskClosed ? (
                <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                        <Lock className="w-6 h-6" />
                        <p className="text-sm font-medium">Komentar dinonaktifkan karena tugas sudah selesai/ditolak.</p>
                        {task.closeNote && (
                          <p className="text-xs text-slate-400 max-w-md">Catatan penyelesaian: {task.closeNote}</p>
                        )}
                        {canRequestReopen && (
                          <button
                            onClick={() => setShowReopenRequestModal(true)}
                            className="mt-2 flex items-center gap-2 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                          >
                            <RefreshCw className="w-4 h-4" /> Ajukan Pembukaan Pekerjaan
                          </button>
                        )}
                        {task.reopenRequested && (
                          <p className="text-xs text-orange-500 font-bold mt-2">
                            Menunggu persetujuan pembukaan kembali dari Leader.
                          </p>
                        )}
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmitComment} className="mt-6 flex gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">{viewerInitial}</div>
                <div className="flex-1">
                    <textarea rows="3" className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Write a comment update..." value={commentText} onChange={(e) => setCommentText(e.target.value)} />
                    <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-2">
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" id="file-upload" accept=".doc,.docx,.xls,.xlsx,.pdf,.jpeg,.jpg,.png"/>
                            <label htmlFor="file-upload" className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 cursor-pointer p-1.5 rounded hover:bg-slate-100 transition-colors">
                              <Paperclip className="w-4 h-4" />
                              {attachmentData ? (
                                <span className="text-blue-600 font-medium truncate max-w-[160px]">
                                  {attachmentData.name}
                                </span>
                              ) : (
                                'Lampirkan File / Gambar'
                              )}
                            </label>
                            {attachmentData && (
                              <button
                                type="button"
                                onClick={resetAttachment}
                                className="text-xs text-red-400 hover:text-red-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                        </div>
                        <button type="submit" className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">Post Comment</button>
                    </div>
                </div>
                </form>
            )}
          </div>
        </div>
        <div className="p-6 bg-gray-50">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Task Details</h3>
          <dl className="space-y-4">
            <div><dt className="text-xs text-slate-500">Penugasan Kepada</dt><dd className="text-sm font-medium text-slate-900">{INITIAL_USERS.find(u => u.id === task.assigneeId)?.name || 'Unknown'}</dd></div>
            <div><dt className="text-xs text-slate-500">Team</dt><dd className="text-sm font-medium text-slate-900">{TEAMS.find(t => t.id === task.teamId)?.name}</dd></div>
            <div><dt className="text-xs text-slate-500">Prioritas</dt><dd className={`inline-flex text-xs font-medium px-2 py-0.5 rounded ${task.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'}`}>{task.priority}</dd></div>
            {task.completedAt && (
              <div>
                <dt className="text-xs text-slate-500">Diselesaikan Pada</dt>
                <dd className="text-sm text-slate-700">{formatDateTime(task.completedAt)}</dd>
              </div>
            )}
            {task.closeNote && <div><dt className="text-xs text-slate-500">Catatan Penyelesaian</dt><dd className="text-sm text-slate-700">{task.closeNote}</dd></div>}
            {task.reopenRequested && task.reopenReason && (
              <div>
                <dt className="text-xs text-slate-500">Alasan Permintaan Reopen</dt>
                <dd className="text-sm text-slate-700">{task.reopenReason}</dd>
              </div>
            )}
            {task.reopenHandledNote && (
              <div>
                <dt className="text-xs text-slate-500">Catatan Buka Kembali</dt>
                <dd className="text-sm text-slate-700">{task.reopenHandledNote}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
      {/* Modals are the same... */}
      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Konfirmasi Pekerjaan Selesai</h3>
            <p className="text-sm text-slate-500">
              {isLeaderOrAdmin
                ? 'Pastikan semua catatan telah diunggah. Isi catatan singkat jika diperlukan.'
                : 'Apakah Anda yakin pekerjaan ini sudah selesai?'}
            </p>
            {isLeaderOrAdmin && (
              <textarea
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows={4}
                value={closeNote}
                onChange={(e) => setCloseNote(e.target.value)}
                placeholder="Catatan penyelesaian (opsional)"
              />
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleCloseTaskConfirm}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Tandai Selesai
              </button>
            </div>
          </div>
        </div>
      )}
      {showReopenRequestModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Ajukan Pembukaan Pekerjaan</h3>
            <p className="text-sm text-slate-500">
              Jelaskan alasan mengapa pekerjaan ini perlu dibuka kembali.
            </p>
            <textarea
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              rows={4}
              value={reopenRequestNote}
              onChange={(e) => setReopenRequestNote(e.target.value)}
              placeholder="Contoh: Ada revisi tambahan dari leader..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowReopenRequestModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleReopenRequestConfirm}
                disabled={!reopenRequestNote.trim()}
                className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Kirim Permintaan
              </button>
            </div>
          </div>
        </div>
      )}
      {showLeaderReopenModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Konfirmasi Buka Kembali</h3>
            <p className="text-sm text-slate-500">
              Berikan catatan mengapa pekerjaan ini dibuka kembali untuk tim.
            </p>
            <textarea
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              rows={4}
              value={leaderReopenNote}
              onChange={(e) => setLeaderReopenNote(e.target.value)}
              placeholder="Contoh: Ada revisi yang harus diselesaikan..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLeaderReopenModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleLeaderReopenConfirm}
                disabled={!leaderReopenNote.trim()}
                className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buka Kembali
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}