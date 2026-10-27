import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Building2, 
  User, 
  KeyRound, 
  ArrowRight, 
  CheckCircle2, 
  ShieldAlert, 
  FileSpreadsheet, 
  Sparkles,
  Server,
  Eye,
  EyeOff
} from 'lucide-react';
import { UserAccount, Company } from '../types';

interface AuthLoginViewProps {
  companies: Company[];
  users: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
  addSystemLog: (action: string, details: string) => void;
  addNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export default function AuthLoginView({
  companies,
  users,
  onLoginSuccess,
  addSystemLog,
  addNotification
}: AuthLoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'employee' | 'admin'>('employee');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUser = username.trim().toLowerCase();
    const trimmedPw = password.trim();

    if (!trimmedUser || !trimmedPw) {
      setError('Please enter both User ID / Email and Password.');
      return;
    }

    // Match in registered users list
    const foundUser = users.find(u => 
      u.emailOrUsername.toLowerCase() === trimmedUser && u.password === trimmedPw
    );

    if (foundUser) {
      if (foundUser.status === 'Locked') {
        setError('This account has been suspended or locked by system security policy.');
        addSystemLog('Login Blocked', `Attempted login to locked account "${foundUser.emailOrUsername}".`);
        return;
      }

      addSystemLog('User Authentication', `User "${foundUser.name}" (${foundUser.role}) logged in successfully.`);
      addNotification(
        'Authentication Success', 
        `Welcome back, ${foundUser.name}! ${foundUser.companyName ? `Connected to ${foundUser.companyName}` : 'Administrator Session Active'}.`, 
        'success'
      );
      onLoginSuccess(foundUser);
    } else {
      setError('Invalid User ID or Password. Check your credentials or select quick demo login.');
      addSystemLog('Authentication Failure', `Failed login attempt for ID "${trimmedUser}".`);
    }
  };

  const handleDemoLogin = (type: 'employee' | 'admin') => {
    if (type === 'employee') {
      const emp = users.find(u => u.role === 'Company Employee') || users[0];
      setUsername(emp.emailOrUsername);
      setPassword(emp.password);
      onLoginSuccess(emp);
      addSystemLog('Demo Login', `LoggedIn as Company Employee "${emp.name}".`);
      addNotification('Company Session Active', `Authorized as ${emp.name} (${emp.companyName}).`, 'success');
    } else {
      const admin = users.find(u => u.role === 'Administrator') || users[1];
      setUsername(admin.emailOrUsername);
      setPassword(admin.password);
      onLoginSuccess(admin);
      addSystemLog('Demo Admin Login', `LoggedIn as System Administrator "${admin.name}".`);
      addNotification('Admin Session Active', `Authorized as System Administrator.`, 'success');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 md:p-8 font-sans select-none relative overflow-hidden">
      {/* Background Decorative Security Grid & Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between relative z-10 py-2 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white font-mono text-sm shadow-lg shadow-blue-600/30">
            W
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-white text-sm tracking-tight flex items-center gap-2">
              WhatsApp Dispatcher
              <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono px-2 py-0.5 rounded-full font-bold">
                ENTERPRISE SHIELD
              </span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Isolated Data Vault & Secure Campaign Engine</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <ShieldCheck className="w-4 h-4" /> Zero-Data-Leak Wall Active
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1">
            <Server className="w-3.5 h-3.5 text-slate-500" /> Client Sandbox
          </span>
        </div>
      </header>

      {/* Main Authentication Card Grid */}
      <main className="max-w-5xl w-full mx-auto my-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Column: Security Guarantees & Features */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-blue-950/60 border border-blue-800/50 text-blue-400 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              Strict Enterprise Isolation
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Company-Isolated WhatsApp Automation Portal
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
              Your vendor spreadsheets, dispatch strategies, and contact lists remain 100% confidential. No third-party data collection, no telemetry scrapers, and direct client-side WhatsApp dispatch.
            </p>
          </div>

          {/* Security Features Badges */}
          <div className="space-y-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Direct Excel Upload & Parsing</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Spreadsheet data parsed exclusively in client memory. Never transmitted to unverified cloud logs.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Company Registration & Direct Run</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Registered company employees execute campaign dispatches directly using authorized IDs and Passwords.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Role Security & Admin Governance</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Administrator console controls registered company access, employee permissions, and system audit logs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Login Portal Box */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 relative">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-400" />
                Security Gateway Sign In
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Enter your registered company or admin credentials</p>
            </div>

            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex gap-1 text-[10px] font-mono font-bold">
              <button
                onClick={() => setActiveTab('employee')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeTab === 'employee' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Employee
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeTab === 'admin' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {/* Error Message Alert */}
          {error && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-rose-300 flex items-start gap-2.5 text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <User className="w-3 h-3 text-slate-400" />
                {activeTab === 'employee' ? 'Company User ID / Email' : 'Administrator ID'}
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={activeTab === 'employee' ? 'e.g. employee@enterprise.com' : 'e.g. admin'}
                className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-slate-400" />
                Access Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              Sign In to Operational Portal
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials Buttons */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">
              Quick One-Click Demo Logins:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('employee')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-400 group-hover:text-blue-300">
                    Company Employee
                  </span>
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                  employee@enterprise.com / emp123
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400 group-hover:text-emerald-300">
                    System Admin
                  </span>
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                  admin / admin123
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Security Guarantee */}
      <footer className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 font-mono border-t border-slate-800/80 pt-4 gap-2 relative z-10">
        <div>
          🔐 SECURE ENVIRONMENT | Client-Side Execution | End-To-End Data Wall
        </div>
        <div>
          Registered Enterprise Console v4.3.0 • Confidential
        </div>
      </footer>
    </div>
  );
}
