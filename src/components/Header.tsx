import React, { useState } from 'react';
import { Bell, ShieldAlert, User, CheckCircle2, AlertTriangle, AlertCircle, Trash2, Key, LogOut, ShieldCheck, Building2, Lock } from 'lucide-react';
import { Notification, UserAccount } from '../types';

interface HeaderProps {
  currentView: string;
  currentUser: UserAccount;
  notifications: Notification[];
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  onLogout: () => void;
  addSystemLog: (action: string, details: string) => void;
}

export default function Header({
  currentView,
  currentUser,
  notifications,
  markNotificationAsRead,
  clearAllNotifications,
  onLogout,
  addSystemLog
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Dashboard Overview';
      case 'wizard': return 'Campaign Builder';
      case 'vendors': return 'Vendor Database';
      case 'monitor': return 'Live Queue Monitor';
      case 'admin-approval': return 'Secure Review & Approval Console';
      case 'companies': return 'Registered Companies & Credentials';
      case 'history': return 'Campaign History';
      case 'reports': return 'Operational Reports';
      case 'settings': return 'System Settings';
      default: return 'WhatsApp Dispatcher';
    }
  };

  return (
    <header className="h-14 border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-40 select-none">
      <div className="flex flex-col">
        <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider uppercase flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          Enterprise Portal • {currentUser.companyName || 'System Admin'}
        </span>
        <h1 className="text-xs font-bold text-slate-800 tracking-tight">{getViewTitle()}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Zero Leak Security Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
          <Lock className="w-3 h-3 text-emerald-600" />
          <span>ZERO DATA LEAK WALL</span>
        </div>

        {/* Dynamic Role Badge */}
        <div className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border font-mono flex items-center gap-1.5 ${
          currentUser.role === 'Administrator'
            ? 'bg-purple-50 text-purple-700 border-purple-200'
            : 'bg-blue-50 text-blue-700 border-blue-200'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            currentUser.role === 'Administrator' ? 'bg-purple-500 animate-pulse' : 'bg-blue-500'
          }`} />
          {currentUser.role.toUpperCase()}
        </div>

        {/* Notifications Center */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center border border-slate-200 relative transition-all cursor-pointer"
          >
            <Bell className={`w-3.5 h-3.5 text-slate-600 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-76 bg-white border border-slate-200 rounded-lg shadow-sm z-50 overflow-hidden">
              <div className="p-2.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">Alert Notifications</span>
                <div className="flex gap-2">
                  <button
                    onClick={clearAllNotifications}
                    className="text-[9px] text-slate-500 hover:text-rose-600 flex items-center gap-1 font-bold uppercase cursor-pointer"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    Clear all
                  </button>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-5 text-center text-[11px] text-slate-400 italic">
                    No active notifications.
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationAsRead(notif.id)}
                      className={`p-2.5 transition-all cursor-pointer hover:bg-slate-50 flex gap-2.5 ${
                        !notif.read ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {notif.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                        {notif.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-500" />}
                        {notif.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                        {notif.type === 'info' && <Bell className="w-3.5 h-3.5 text-blue-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-slate-800 font-bold">{notif.title}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{notif.message}</div>
                        <div className="text-[8px] text-slate-400 mt-0.5 font-mono">
                          {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Sign Out */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px] border border-blue-200 font-mono">
            {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="hidden lg:flex flex-col min-w-0 max-w-[130px]">
            <span className="text-[11px] font-bold text-slate-800 leading-none truncate">{currentUser.name}</span>
            <span className="text-[8px] text-slate-400 font-bold font-mono mt-0.5 truncate uppercase">
              {currentUser.emailOrUsername}
            </span>
          </div>

          <button
            onClick={onLogout}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1 cursor-pointer"
            title="Sign Out of Account"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
