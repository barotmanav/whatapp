import React from 'react';
import {
  LayoutGrid,
  PlusCircle,
  Users,
  Radio,
  History,
  BarChart3,
  Settings,
  ShieldCheck,
  LogOut,
  Lock,
  Building2,
  KeyRound
} from 'lucide-react';
import { CampaignStatus, UserAccount } from '../types';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  activeCampaignStatus?: CampaignStatus;
  currentUser: UserAccount;
  onLogout: () => void;
}

export default function Sidebar({ 
  currentView, 
  setCurrentView, 
  activeCampaignStatus,
  currentUser,
  onLogout
}: SidebarProps) {
  const isRunning = activeCampaignStatus === 'Running';
  const isAdmin = currentUser.role === 'Administrator';

  return (
    <aside className="w-60 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col h-screen sticky top-0 shrink-0 select-none">
      {/* Platform Title */}
      <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center text-white font-black text-xs font-mono">W</div>
          <div className="flex flex-col">
            <span className="font-extrabold text-white text-xs tracking-tight">WhatsApp <span className="text-[10px] text-blue-400 font-semibold">Dispatcher</span></span>
            <span className="text-[8px] text-slate-400 font-medium font-mono flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
              Isolated Shield Active
            </span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="text-slate-500 hover:text-rose-400 transition-colors p-1 rounded cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Navigation Menu */}
      <div className="flex-1 px-4 py-4 overflow-y-auto space-y-6">
        <div className="space-y-1">
          <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Operations</span>
          
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-semibold transition-all ${
              currentView === 'dashboard'
                ? 'bg-blue-600 text-white font-bold'
                : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => setCurrentView('wizard')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-semibold transition-all ${
              currentView === 'wizard'
                ? 'bg-blue-600 text-white font-bold'
                : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 shrink-0" />
            <span>New Campaign</span>
          </button>

          <button
            onClick={() => setCurrentView('monitor')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold transition-all ${
              currentView === 'monitor'
                ? 'bg-blue-600 text-white font-bold'
                : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Radio className={`w-3.5 h-3.5 shrink-0 ${isRunning ? 'text-emerald-400 animate-pulse' : ''}`} />
              <span>Monitor</span>
            </div>
            {isRunning && (
              <span className="text-[8px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.2 rounded font-mono animate-bounce">
                LIVE
              </span>
            )}
          </button>

          {/* Admin Reviews & Approvals (Only visible to admin) */}
          {isAdmin && (
            <button
              onClick={() => setCurrentView('admin-approval')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-bold transition-all ${
                currentView === 'admin-approval'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-950/20 text-emerald-400 hover:bg-slate-800 border border-emerald-900/30'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Review Queue</span>
            </button>
          )}
        </div>

        <div className="space-y-1">
          <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Data & Access</span>

          <button
            onClick={() => setCurrentView('vendors')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-semibold transition-all ${
              currentView === 'vendors'
                ? 'bg-blue-600 text-white font-bold'
                : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>Vendors Master</span>
          </button>

          <button
            onClick={() => setCurrentView('companies')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-semibold transition-all ${
              currentView === 'companies'
                ? 'bg-blue-600 text-white font-bold'
                : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span>Companies & Logins</span>
          </button>

          <button
            onClick={() => setCurrentView('history')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-semibold transition-all ${
              currentView === 'history'
                ? 'bg-blue-600 text-white font-bold'
                : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <History className="w-3.5 h-3.5 shrink-0" />
            <span>History</span>
          </button>

          <button
            onClick={() => setCurrentView('reports')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-semibold transition-all ${
              currentView === 'reports'
                ? 'bg-blue-600 text-white font-bold'
                : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span>Reports</span>
          </button>
        </div>

        <div className="space-y-1">
          <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">System</span>

          <button
            onClick={() => setCurrentView('settings')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-semibold transition-all ${
              currentView === 'settings'
                ? 'bg-blue-600 text-white font-bold'
                : 'hover:bg-slate-800 hover:text-white text-slate-400'
            }`}
          >
            <Settings className="w-3.5 h-3.5 shrink-0" />
            <span>Settings & Security</span>
          </button>
        </div>
      </div>

      {/* Current Logged-In User Details */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60">
        <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold text-blue-400 uppercase tracking-wider">
              {currentUser.role}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-white font-sans truncate">{currentUser.name}</div>
            <div className="text-[10px] text-slate-400 font-mono truncate">{currentUser.companyName || 'System Admin'}</div>
          </div>
          <button
            onClick={onLogout}
            className="w-full text-[10px] font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 py-1.5 rounded-lg border border-slate-700 hover:border-rose-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1 font-mono"
          >
            <LogOut className="w-3 h-3" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
