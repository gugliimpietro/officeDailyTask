import React, { useState } from 'react';
import { Calendar, User, CheckCircle } from 'lucide-react';
import { JOB_TYPES, INITIAL_USERS } from '../data/mockData';
import { addWorkingDays } from '../utils/helpers';

export function CreateTaskModal({ user, onClose, onSubmit, currentTaskCount }) {
  const createInitialFormState = () => ({
    title: '',
    jobType: '',
    description: '',
    assigneeId: '',
    priority: 'Normal',
    dueDate: addWorkingDays(new Date(), 7),
  });

  const [step, setStep] = useState(1); // 1: Input, 2: Confirmation
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState(createInitialFormState);

  const teamMembers = INITIAL_USERS.filter(u => u.teamId === user.teamId && u.role === 'TEAM_MEMBER');

  const handlePriorityChange = (e) => {
    const newPriority = e.target.value;
    let days = 7;
    if (newPriority === 'Low') days = 14;
    if (newPriority === 'High') days = 3;
    
    setFormData({
        ...formData,
        priority: newPriority,
        dueDate: addWorkingDays(new Date(), days)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 1) {
        setStep(2); // Go to confirmation
        return;
    }
    
    onSubmit({
      ...formData,
      // dueDate is already in formData from state
      teamId: user.teamId,
      status: 'New'
    });
    setShowSuccess(true);
  };

  const handleModalClose = () => {
    setShowSuccess(false);
    setStep(1);
    setFormData(createInitialFormState());
    onClose();
  };

  const getAssigneeName = (id) => {
      const member = teamMembers.find(m => m.id === id);
      return member ? member.name : '-';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900">{showSuccess ? 'Pekerjaan Baru Dibuat' : step === 1 ? 'Buat Pekerjaan Baru' : 'Konfirmasi Pekerjaan'}</h3>
          <button onClick={handleModalClose} className="text-slate-400 hover:text-red-500">✕</button>
        </div>
        
        {showSuccess ? (
          <div className="p-6 space-y-5 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center shadow-inner">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900 mb-1">Pekerjaan berhasil dibuat!</p>
              <p className="text-sm text-slate-600">Notifikasi telah dikirim ke anggota tim terkait.</p>
            </div>
            <button
              onClick={handleModalClose}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
            >
              Tutup
            </button>
          </div>
        ) : step === 1 ? (
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Pekerjaan <span className="text-red-500">*</span></label>
                <select 
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                value={formData.jobType}
                onChange={e => setFormData({...formData, jobType: e.target.value})}
                >
                <option value="">-- Pilih Jenis Pekerjaan --</option>
                {JOB_TYPES.map((type, index) => (
                    <option key={index} value={type}>{type}</option>
                ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Pekerjaan <span className="text-red-500">*</span></label>
                <input 
                required
                type="text" 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Pekerjaan</label>
                <textarea 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                rows="3"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Penugasan Kepada <span className="text-red-500">*</span></label>
                <select 
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    value={formData.assigneeId}
                    onChange={e => setFormData({...formData, assigneeId: e.target.value})}
                >
                    <option value="">-- Pilih Staff --</option>
                    {teamMembers.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prioritas</label>
                <select 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    value={formData.priority}
                    onChange={handlePriorityChange}
                >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                </select>
            </div>
            
            <div className="bg-blue-50 p-3 rounded text-xs text-blue-700 flex gap-2">
                <Calendar className="w-4 h-4 shrink-0" />
                <p>Tenggat waktu dihitung otomatis berdasarkan prioritas: {formData.priority} ({formData.priority === 'High' ? '+3' : formData.priority === 'Normal' ? '+7' : '+14'} hari kerja).</p>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Review</button>
            </div>
            </form>
        ) : (
            <div className="p-6 space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg space-y-3 border border-blue-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">ID Pekerjaan (Estimasi)</p>
                            <p className="font-mono font-bold text-slate-900">TASK-000{currentTaskCount + 1}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Tenggat Waktu</p>
                            <p className="font-bold text-slate-900 flex items-center gap-1 justify-end mt-1">
                                <Calendar className="w-3 h-3" /> {formData.dueDate}
                            </p>
                        </div>
                    </div>
                    <div className="border-t border-blue-200 my-2"></div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Nama Pekerjaan</p>
                        <p className="font-bold text-slate-900">{formData.title}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Jenis Pekerjaan</p>
                        <p className="text-sm text-slate-800">{formData.jobType}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Prioritas</p>
                            <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold bg-slate-200 text-slate-700">{formData.priority}</span>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide">PIC (Staff)</p>
                            <p className="font-bold text-slate-900 flex items-center gap-1 mt-1">
                                <User className="w-3 h-3" /> {getAssigneeName(formData.assigneeId)}
                            </p>
                        </div>
                    </div>
                </div>
                <p className="text-sm text-slate-500 text-center">Pastikan data di atas sudah benar sebelum membuat pekerjaan ini.</p>
                <div className="pt-2 flex justify-end gap-3 border-t border-gray-100">
                    <button type="button" onClick={() => setStep(1)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Kembali</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Ya, Buat Pekerjaan</button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
export function RejectTaskModal({ taskId, onClose, onConfirm }) {
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onConfirm(taskId, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Konfirmasi Penolakan</h3>
        <p className="text-sm text-slate-500 mb-4">Apakah Anda yakin ingin menolak pekerjaan ini? Harap berikan alasan yang jelas.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Alasan Penolakan</label>
            <textarea 
              required
              autoFocus
              className="w-full px-3 py-2 border border-red-200 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              rows="3"
              placeholder="Contoh: Beban kerja sudah penuh..."
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm">Batal</button>
            <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm">Tolak Pekerjaan</button>
          </div>
        </form>
      </div>
    </div>
  );
}
export function ReviewTaskModal({ taskId, onClose, onConfirm }) {
    const [reason, setReason] = useState('');
  
    const handleSubmit = (e) => {
      e.preventDefault();
      if (!reason.trim()) return;
      onConfirm(taskId, reason);
      onClose();
    };
  
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Konfirmasi Review Ulang</h3>
          <p className="text-sm text-slate-500 mb-4">Anda akan membuka kembali pekerjaan ini. Harap berikan catatan untuk staff.</p>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Catatan Review</label>
              <textarea 
                required
                autoFocus
                className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                rows="3"
                placeholder="Contoh: Ada bagian yang kurang lengkap..."
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm">Batal</button>
              <button type="submit" className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-sm">Kirim Review</button>
            </div>
          </form>
        </div>
      </div>
    );
}

// GENERIC CONFIRMATION MODAL
export function ConfirmationModal({ title, message, confirmText, cancelText, onConfirm, onClose }) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-sm text-slate-500 mb-6">{message}</p>
            
            <div className="flex gap-3 justify-center">
                <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm">{cancelText}</button>
                <button onClick={onConfirm} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm">{confirmText}</button>
            </div>
        </div>
      </div>
    );
}
