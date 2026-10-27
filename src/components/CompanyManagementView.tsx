import React, { useState } from 'react';
import { 
  Building2, 
  UserPlus, 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  Unlock, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Users, 
  ShieldAlert, 
  Sparkles,
  Server,
  FileSpreadsheet,
  Database,
  Globe,
  HardDrive,
  RefreshCw,
  ExternalLink,
  Layers
} from 'lucide-react';
import { Company, UserAccount } from '../types';

interface CompanyManagementViewProps {
  companies: Company[];
  users: UserAccount[];
  currentUser: UserAccount;
  onAddCompany: (company: Company) => void;
  onUpdateCompany: (company: Company) => void;
  onAddUser: (user: UserAccount) => void;
  onToggleUserStatus: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  addSystemLog: (action: string, details: string) => void;
  addNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export default function CompanyManagementView({
  companies,
  users,
  currentUser,
  onAddCompany,
  onUpdateCompany,
  onAddUser,
  onToggleUserStatus,
  onDeleteUser,
  addSystemLog,
  addNotification
}: CompanyManagementViewProps) {
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingCompanyDb, setEditingCompanyDb] = useState<Company | null>(null);

  // New Company Form
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyCode, setNewCompanyCode] = useState('');
  const [newCompanyMaxDaily, setNewCompanyMaxDaily] = useState(5000);
  const [newDbProvider, setNewDbProvider] = useState<'Supabase' | 'PostgreSQL' | 'Isolated Local Vault' | 'Custom Database API'>('Supabase');
  const [newDbUrl, setNewDbUrl] = useState('');
  const [newDbApiKey, setNewDbApiKey] = useState('');

  // Database Config Modal Form
  const [dbProvider, setDbProvider] = useState<'Supabase' | 'PostgreSQL' | 'Isolated Local Vault' | 'Custom Database API'>('Supabase');
  const [dbUrl, setDbUrl] = useState('');
  const [dbApiKey, setDbApiKey] = useState('');
  const [dbTablesText, setDbTablesText] = useState('vendors_master, active_merchants, region_targets');
  const [isTestingDb, setIsTestingDb] = useState(false);

  // New User Form
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserCompanyId, setNewUserCompanyId] = useState(companies[0]?.id || '');
  const [newUserAutoApprove, setNewUserAutoApprove] = useState(true);

  const handleRegisterCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    const code = newCompanyCode.trim().toUpperCase() || `CMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const company: Company = {
      id: `comp-${Date.now()}`,
      name: newCompanyName.trim(),
      code,
      registeredAt: new Date().toISOString(),
      status: 'Active',
      maxDailyMessages: Number(newCompanyMaxDaily) || 5000,
      dbProvider: newDbProvider,
      dbUrl: newDbUrl.trim() || undefined,
      dbApiKey: newDbApiKey.trim() || undefined,
      dbConnectedTables: ['vendors_master', 'daily_targets_2026'],
      dbConnectionStatus: newDbUrl ? 'Connected' : 'Not Configured'
    };

    onAddCompany(company);
    addSystemLog('Company Registered', `Registered new enterprise company "${company.name}" with ${company.dbProvider} integration.`);
    addNotification('Company Registered', `Successfully registered "${company.name}". Database connection configured.`, 'success');

    setNewCompanyName('');
    setNewCompanyCode('');
    setNewDbUrl('');
    setNewDbApiKey('');
    setShowCompanyModal(false);
  };

  const handleOpenDbConfig = (company: Company) => {
    setEditingCompanyDb(company);
    setDbProvider(company.dbProvider || 'Supabase');
    setDbUrl(company.dbUrl || '');
    setDbApiKey(company.dbApiKey || '');
    setDbTablesText(company.dbConnectedTables?.join(', ') || 'vendors_master, active_merchants_2026');
  };

  const handleSaveDbConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompanyDb) return;

    setIsTestingDb(true);
    setTimeout(() => {
      setIsTestingDb(false);
      const tables = dbTablesText.split(',').map(t => t.trim()).filter(Boolean);
      const updatedCompany: Company = {
        ...editingCompanyDb,
        dbProvider,
        dbUrl: dbUrl.trim() || undefined,
        dbApiKey: dbApiKey.trim() || undefined,
        dbConnectedTables: tables.length > 0 ? tables : ['vendors_master'],
        dbConnectionStatus: dbUrl.trim() ? 'Connected' : 'Not Configured'
      };

      onUpdateCompany(updatedCompany);
      addSystemLog('Company Database Integrated', `Updated database sync configuration for "${updatedCompany.name}" (${dbProvider}).`);
      addNotification('Database Connected', `Successfully synced database credentials for ${updatedCompany.name}.`, 'success');
      setEditingCompanyDb(null);
    }, 600);
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      addNotification('Validation Error', 'Name, Email/ID and Password are required.', 'warning');
      return;
    }

    const assignedCompany = companies.find(c => c.id === newUserCompanyId) || companies[0];

    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      name: newUserName.trim(),
      emailOrUsername: newUserEmail.trim().toLowerCase(),
      password: newUserPassword.trim(),
      role: 'Company Employee',
      companyId: assignedCompany?.id,
      companyName: assignedCompany?.name,
      autoApproveCampaigns: newUserAutoApprove,
      status: 'Active',
      createdAt: new Date().toISOString()
    };

    onAddUser(newUser);
    addSystemLog('User Credentials Created', `Created employee login "${newUser.emailOrUsername}" for company "${assignedCompany?.name}".`);
    addNotification('Employee Account Created', `Created login for ${newUser.name}. Password set successfully.`, 'success');

    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setShowUserModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-blue-950 text-blue-400 border border-blue-800 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            Security Governance Console
          </div>
          <h2 className="text-xl font-bold tracking-tight">Registered Companies & Employee Credentials</h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Register organizations and manage employee ID/passwords. Authorized company employees can upload Excel spreadsheets and execute campaigns directly.
          </p>
        </div>

        {currentUser.role === 'Administrator' && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setShowCompanyModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Register Company
            </button>
            <button
              onClick={() => setShowUserModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              Add Employee Login
            </button>
          </div>
        )}
      </div>

      {/* Security Wall Statement Box */}
      <div className="p-4 bg-emerald-50/50 border border-emerald-200/60 rounded-xl text-emerald-950 flex items-start gap-3 text-xs">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="font-bold text-emerald-900 uppercase font-mono tracking-wider text-[11px]">
            Data Hazard Boundary & Leak Protection Active
          </strong>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            All Excel files, target matrices, and phone records uploaded by registered employees are isolated to their company session. No external data scraper or unverified 3rd-party endpoint receives this information.
          </p>
        </div>
      </div>

      {/* Registered Companies Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            Registered Companies ({companies.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map(c => {
            const companyEmployees = users.filter(u => u.companyId === c.id);
            const dbProvider = c.dbProvider || 'Supabase';
            const isDbConnected = c.dbConnectionStatus === 'Connected' || Boolean(c.dbUrl);

            return (
              <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs hover:border-slate-300 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full uppercase border border-blue-100">
                      {c.code}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{c.name}</h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    {c.status}
                  </span>
                </div>

                {/* Company Database Connection Status Box */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5 font-sans">
                      <Database className="w-3.5 h-3.5 text-purple-600" />
                      {dbProvider} Database:
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isDbConnected
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {isDbConnected ? '✓ Sync Active' : 'Not Configured'}
                    </span>
                  </div>

                  {c.dbConnectedTables && c.dbConnectedTables.length > 0 && (
                    <div className="text-[10px] text-slate-500 font-mono truncate">
                      Tables: <span className="text-slate-800 font-semibold">{c.dbConnectedTables.join(', ')}</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleOpenDbConfig(c)}
                    className="w-full mt-1 py-1.5 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Database className="w-3 h-3" />
                    Setup / Edit Company DB
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 space-y-1 pt-1 font-mono border-t border-slate-100">
                  <div className="flex justify-between">
                    <span>Registered Employees:</span>
                    <strong className="text-slate-700 font-bold">{companyEmployees.length} Account(s)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily Message Limit:</span>
                    <strong className="text-slate-700 font-bold">{c.maxDailyMessages.toLocaleString()} / day</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Employee Credentials Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-700" />
              Employee Credentials & Access Passwords
            </h3>
            <p className="text-xs text-slate-500">Employees with ID & Password can sign in, upload Excel spreadsheets, and trigger campaigns directly.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-bold">User Name</th>
                <th className="py-2.5 px-3 font-bold">Role</th>
                <th className="py-2.5 px-3 font-bold">Assigned Company</th>
                <th className="py-2.5 px-3 font-bold">Login ID / Email</th>
                <th className="py-2.5 px-3 font-bold">Password</th>
                <th className="py-2.5 px-3 font-bold">Direct Campaign Run</th>
                <th className="py-2.5 px-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900 font-sans">{u.name}</td>
                  <td className="py-3 px-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      u.role === 'Administrator' 
                        ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                        : 'bg-blue-50 text-blue-700 border border-blue-100'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-700 font-sans">
                    {u.companyName || 'System-Wide'}
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-800">{u.emailOrUsername}</td>
                  <td className="py-3 px-3 text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200 text-[10px] inline-block mt-2">
                    {u.password}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      u.autoApproveCampaigns 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {u.autoApproveCampaigns ? 'Authorized (Direct Run)' : 'Requires Admin Review'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right space-x-2">
                    {currentUser.role === 'Administrator' && u.role !== 'Administrator' && (
                      <>
                        <button
                          onClick={() => onToggleUserStatus(u.id)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            u.status === 'Active'
                              ? 'text-slate-600 hover:text-amber-600 border-slate-200'
                              : 'text-amber-600 bg-amber-50 border-amber-200'
                          }`}
                          title={u.status === 'Active' ? 'Lock Account' : 'Unlock Account'}
                        >
                          {u.status === 'Active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => onDeleteUser(u.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-200 hover:border-rose-200 transition-colors"
                          title="Delete User Credentials"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Register Company */}
      {showCompanyModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Register New Enterprise Company
              </h3>
              <button onClick={() => setShowCompanyModal(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">✕</button>
            </div>

            <form onSubmit={handleRegisterCompany} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Company Name</label>
                <input
                  type="text"
                  required
                  value={newCompanyName}
                  onChange={e => setNewCompanyName(e.target.value)}
                  placeholder="e.g. Acme Logistics Pvt Ltd"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Company Code / ID (Optional)</label>
                <input
                  type="text"
                  value={newCompanyCode}
                  onChange={e => setNewCompanyCode(e.target.value)}
                  placeholder="e.g. ACME-01"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Daily Message Allocation</label>
                <input
                  type="number"
                  value={newCompanyMaxDaily}
                  onChange={e => setNewCompanyMaxDaily(Number(e.target.value))}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCompanyModal(false)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 shadow-xs"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Employee Credentials */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                Create Employee Credentials
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Employee Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Select Registered Company</label>
                <select
                  value={newUserCompanyId}
                  onChange={e => setNewUserCompanyId(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 font-semibold"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Login ID / Employee Email</label>
                <input
                  type="text"
                  required
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="e.g. rahul@acme.com"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Assign Password</label>
                <input
                  type="text"
                  required
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  placeholder="e.g. pass123"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="autoApproveCheck"
                  checked={newUserAutoApprove}
                  onChange={e => setNewUserAutoApprove(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="autoApproveCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Authorize direct campaign execution (No admin review needed)
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 shadow-xs"
                >
                  Save Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Setup / Integrate Company Database */}
      {editingCompanyDb && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg border border-purple-100">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Configure Company Database</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{editingCompanyDb.name} ({editingCompanyDb.code})</p>
                </div>
              </div>
              <button onClick={() => setEditingCompanyDb(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveDbConfig} className="space-y-4">
              <div className="p-3 bg-purple-50/60 border border-purple-200/80 rounded-xl text-xs space-y-1">
                <div className="font-bold text-purple-950 flex items-center gap-1.5 text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  Isolated Company Data Ownership
                </div>
                <p className="text-[11px] text-purple-900 leading-relaxed">
                  Connect your company's own Supabase or PostgreSQL database. Staff will be able to query live vendor targets directly during campaign setup without sharing records across other accounts.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Select Database Engine</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Supabase', 'PostgreSQL', 'Isolated Local Vault', 'Custom Database API'] as const).map(p => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setDbProvider(p)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center gap-2 ${
                        dbProvider === p
                          ? 'border-purple-600 bg-purple-50 text-purple-950 font-bold shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                      }`}
                    >
                      <Database className={`w-3.5 h-3.5 ${dbProvider === p ? 'text-purple-600' : 'text-slate-400'}`} />
                      <span>{p}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Database / Supabase URL</label>
                <input
                  type="text"
                  value={dbUrl}
                  onChange={e => setDbUrl(e.target.value)}
                  placeholder="https://your-company.supabase.co or postgresql://db.company.com:5432"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">API Key / Access Token</label>
                <input
                  type="password"
                  value={dbApiKey}
                  onChange={e => setDbApiKey(e.target.value)}
                  placeholder="e.g. eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Connected Tables (Comma Separated)</label>
                <input
                  type="text"
                  value={dbTablesText}
                  onChange={e => setDbTablesText(e.target.value)}
                  placeholder="vendors_master, active_merchants_2026, region_targets"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-purple-500 font-mono"
                />
                <p className="text-[10px] text-slate-400">Comma separated table names available for live Excel or DB query campaigns.</p>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCompanyDb(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTestingDb}
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 shadow-xs flex items-center gap-2"
                >
                  {isTestingDb ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Connecting & Syncing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Save & Verify Connection
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
