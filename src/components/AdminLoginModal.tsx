import React, { useState } from 'react';
import { Lock, ShieldAlert, X, Eye, EyeOff } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  addSystemLog: (action: string, details: string) => void;
  addNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export default function AdminLoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  addSystemLog,
  addNotification
}: AdminLoginModalProps) {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedId = adminId.trim();
    const trimmedPw = password.trim();

    if (!trimmedId || !trimmedPw) {
      setError('Please provide both Console ID and Access Password.');
      return;
    }

    // Predefined credentials check
    if (trimmedId === 'admin' && (trimmedPw === 'admin123' || trimmedPw === 'password123' || trimmedPw === 'adminpassword')) {
      addSystemLog('Admin Authorization', 'Predefined administration credentials successfully authorized.');
      addNotification('Admin Session Active', 'You have unlocked the secure review and approvals console.', 'success');
      onLoginSuccess();
      onClose();
      // Reset
      setAdminId('');
      setPassword('');
    } else {
      setError('Invalid Console ID or Access Password. Access denied.');
      addSystemLog('Unauthorized Access Attempt', `Console ID: "${trimmedId}" failed verification.`);
      addNotification('Access Denied', 'An unauthorized attempt was blocked.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-slate-950 text-white p-5 border-b border-slate-800 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
          
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-blue-400 shrink-0 border border-slate-700">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-400">Security Gate</h3>
              <h2 className="text-sm font-bold text-white">System Console Login</h2>
            </div>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Authorized administrative access only. To unlock, enter your predefined console credentials.
          </p>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex gap-2 text-[11px] font-medium leading-relaxed animate-shake">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Console ID</label>
              <input
                type="text"
                value={adminId}
                onChange={e => setAdminId(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2.5 focus:border-blue-500 focus:outline-none bg-slate-50 focus:bg-white"
                placeholder="e.g. admin"
                autoComplete="username"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Access Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 focus:border-blue-500 focus:outline-none bg-slate-50 focus:bg-white font-mono"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-between gap-3 text-xs">
            <span className="text-[9px] text-slate-400 font-mono mt-2 self-start bg-slate-50 px-1.5 py-0.5 rounded">
              HINT: admin / admin123
            </span>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold shadow-xs shadow-blue-600/10"
              >
                Access Console
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
