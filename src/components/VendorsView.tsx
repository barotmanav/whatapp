import React, { useState } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Plus,
  Edit2,
  Trash2,
  X,
  Phone,
  User,
  ShieldAlert,
  Save,
  CheckCircle2,
  History,
  FileSpreadsheet,
  Send,
  ExternalLink
} from 'lucide-react';
import { Vendor, CommunicationHistory } from '../types';

export function formatPhoneForWhatsApp(phone: string): string {
  let digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }
  if (digits.length === 10) {
    return '91' + digits;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  return digits;
}

interface VendorsViewProps {
  vendors: Vendor[];
  onAddVendor: (vendor: Vendor) => void;
  onUpdateVendor: (vendor: Vendor) => void;
  onDeleteVendor: (id: string) => void;
  onClearAllVendors: () => void;
  userRole: 'Administrator' | 'Staff User';
  addSystemLog: (action: string, details: string) => void;
  addNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export default function VendorsView({
  vendors,
  onAddVendor,
  onUpdateVendor,
  onDeleteVendor,
  onClearAllVendors,
  userRole,
  addSystemLog,
  addNotification
}: VendorsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'target' | 'achievement' | 'remaining' | 'bonus'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Drawer / Modal states
  const [activeVendorDrawer, setActiveVendorDrawer] = useState<Vendor | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Vendor | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Form states
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formTarget, setFormTarget] = useState(50000);
  const [formAchievement, setFormAchievement] = useState(0);
  const [formBonus, setFormBonus] = useState(1500);
  const [formRegion, setFormRegion] = useState('North');
  const [formManager, setFormManager] = useState('Sarah Jenkins');
  const [formNotes, setFormNotes] = useState('');

  const triggerSort = (column: 'name' | 'target' | 'achievement' | 'remaining' | 'bonus') => {
    if (sortBy === column) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Vendor Name', 'Phone', 'Target', 'Achievement', 'Remaining', 'Bonus', 'Region', 'Manager', 'Status', 'Custom Notes'];
    const rows = filteredAndSortedVendors().map(v => [
      `"${v.name}"`,
      `"${v.phone}"`,
      v.target,
      v.achievement,
      v.remaining,
      v.bonus,
      `"${v.region}"`,
      `"${v.manager}"`,
      `"${v.status}"`,
      `"${v.customNotes || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(",")].concat(rows.map(e => e.join(","))).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vendor_master_database_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addSystemLog('CSV Export', 'Exported full vendor database CSV.');
    addNotification('Export Successful', 'Vendor database exported to CSV successfully.', 'success');
  };

  const handleAddVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      addNotification('Input Error', 'Name and Phone are mandatory.', 'error');
      return;
    }

    const newVnd: Vendor = {
      id: `vnd-${Math.floor(1000 + Math.random() * 9000)}`,
      name: formName,
      phone: formPhone,
      target: Number(formTarget) || 0,
      achievement: Number(formAchievement) || 0,
      remaining: Math.max(0, (Number(formTarget) || 0) - (Number(formAchievement) || 0)),
      bonus: Number(formBonus) || 0,
      region: formRegion,
      manager: formManager,
      status: 'Active',
      customNotes: formNotes,
      history: []
    };

    onAddVendor(newVnd);
    setShowAddModal(false);
    resetForm();
    addSystemLog('Vendor Added', `Registered new vendor record: ${formName}`);
    addNotification('Vendor Registered', `Successfully added "${formName}" to master records.`, 'success');
  };

  const handleEditVendorClick = (v: Vendor) => {
    if (userRole !== 'Administrator') {
      addNotification('Access Denied', 'Staff Users are locked out from updating vendor records.', 'warning');
      return;
    }
    setShowEditModal(v);
    setFormName(v.name);
    setFormPhone(v.phone);
    setFormTarget(v.target);
    setFormAchievement(v.achievement);
    setFormBonus(v.bonus);
    setFormRegion(v.region);
    setFormManager(v.manager);
    setFormNotes(v.customNotes || '');
  };

  const handleEditVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;

    const updated: Vendor = {
      ...showEditModal,
      name: formName,
      phone: formPhone,
      target: Number(formTarget) || 0,
      achievement: Number(formAchievement) || 0,
      remaining: Math.max(0, (Number(formTarget) || 0) - (Number(formAchievement) || 0)),
      bonus: Number(formBonus) || 0,
      region: formRegion,
      manager: formManager,
      customNotes: formNotes
    };

    onUpdateVendor(updated);
    setShowEditModal(null);
    resetForm();
    addSystemLog('Vendor Updated', `Modified vendor details for: ${formName}`);
    addNotification('Vendor Modified', `Updates saved for "${formName}".`, 'success');
  };

  const handleDeleteVendorClick = (id: string, name: string) => {
    if (userRole !== 'Administrator') {
      addNotification('Access Denied', 'Staff Users are locked out from deleting database records.', 'warning');
      return;
    }
    if (confirm(`Are you absolutely certain you want to remove "${name}"? This operation cannot be undone.`)) {
      onDeleteVendor(id);
      addSystemLog('Vendor Deleted', `Removed vendor record: ${name}`);
      addNotification('Vendor Deleted', `Removed "${name}" from master database.`, 'error');
    }
  };

  const handleClearAllVendors = () => {
    if (userRole !== 'Administrator') {
      addNotification('Access Denied', 'Staff Users are locked out from clearing database records.', 'warning');
      return;
    }
    if (confirm('Are you absolutely sure you want to clear the entire vendor master database? This will remove all stored vendor records.')) {
      onClearAllVendors();
      addSystemLog('Database Cleared', 'Cleared all vendor records from the master database.');
      addNotification('Database Cleared', 'All vendor records have been removed from the master database.', 'success');
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormPhone('');
    setFormTarget(50000);
    setFormAchievement(0);
    setFormBonus(1500);
    setFormRegion('North');
    setFormManager('Sarah Jenkins');
    setFormNotes('');
  };

  // Processing Query Logic
  const filteredAndSortedVendors = () => {
    let list = [...vendors];

    // Filter search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.phone.includes(q) ||
        v.manager.toLowerCase().includes(q) ||
        v.region.toLowerCase().includes(q)
      );
    }

    // Filter Region
    if (selectedRegion !== 'All') {
      list = list.filter(v => v.region === selectedRegion);
    }

    // Filter Status
    if (selectedStatus !== 'All') {
      list = list.filter(v => v.status === selectedStatus);
    }

    // Sorting
    list.sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  };

  const items = filteredAndSortedVendors();
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const paginatedItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex gap-6 relative">
      
      {/* Primary Data Table Block */}
      <div className="flex-1 bg-white rounded-lg border border-slate-100 shadow-xs p-5 space-y-4 overflow-hidden">
        
        {/* Filters and Controls header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-50 pb-4">
          
          {/* Left search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl w-full focus:outline-blue-500 bg-slate-50/50"
              placeholder="Search by vendor, phone, region, or manager..."
            />
          </div>

          {/* Center Filters dropdowns */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600 font-bold">
              <Filter className="w-3.5 h-3.5" />
              <span>Region:</span>
              <select
                value={selectedRegion}
                onChange={e => { setSelectedRegion(e.target.value); setCurrentPage(1); }}
                className="border rounded-lg p-1.5 bg-white text-[11px] font-semibold"
              >
                <option value="All">All Regions</option>
                <option value="North">North</option>
                <option value="East">East</option>
                <option value="West">West</option>
                <option value="South">South</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600 font-bold">
              <span>Status:</span>
              <select
                value={selectedStatus}
                onChange={e => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                className="border rounded-lg p-1.5 bg-white text-[11px] font-semibold"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <button
              onClick={handleExportCSV}
              className="bg-white hover:bg-slate-50 border text-slate-700 px-3 py-2 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              Export Database
            </button>

            {userRole === 'Administrator' && vendors.length > 0 && (
              <button
                onClick={handleClearAllVendors}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-2 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1 transition-all"
                title="Remove all vendor records"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                Clear All
              </button>
            )}

            {userRole === 'Administrator' && (
              <button
                onClick={() => { resetForm(); setShowAddModal(true); }}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Vendor
              </button>
            )}
          </div>
        </div>

        {/* The Main Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase font-mono text-[9px] border-b border-slate-150 select-none">
                <th className="py-3 px-3 cursor-pointer" onClick={() => triggerSort('name')}>
                  <span className="flex items-center gap-1">Vendor Name <ArrowUpDown className="w-3 h-3 text-slate-400" /></span>
                </th>
                <th className="py-3 px-3">Region / Manager</th>
                <th className="py-3 px-3 cursor-pointer" onClick={() => triggerSort('target')}>
                  <span className="flex items-center gap-1">Target <ArrowUpDown className="w-3 h-3 text-slate-400" /></span>
                </th>
                <th className="py-3 px-3 cursor-pointer" onClick={() => triggerSort('achievement')}>
                  <span className="flex items-center gap-1">Achievement <ArrowUpDown className="w-3 h-3 text-slate-400" /></span>
                </th>
                <th className="py-3 px-3 cursor-pointer" onClick={() => triggerSort('bonus')}>
                  <span className="flex items-center gap-1">Bonus <ArrowUpDown className="w-3 h-3 text-slate-400" /></span>
                </th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedItems.map(v => (
                <tr
                  key={v.id}
                  onClick={() => setActiveVendorDrawer(v)}
                  className={`hover:bg-blue-50/10 cursor-pointer transition-all ${
                    activeVendorDrawer?.id === v.id ? 'bg-blue-50/20' : ''
                  }`}
                >
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-slate-800 text-xs truncate max-w-[180px]">{v.name || '💡 (Corrupted Field)'}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{v.phone}</div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="text-xs font-semibold text-slate-700">{v.region} Region</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{v.manager}</div>
                  </td>
                  <td className="py-3.5 px-3 font-mono text-xs text-slate-600 font-semibold">\${v.target.toLocaleString()}</td>
                  <td className="py-3.5 px-3">
                    <div className="font-mono text-xs text-emerald-600 font-bold">\${v.achievement.toLocaleString()}</div>
                    <div className="w-16 bg-slate-100 h-1 rounded-full overflow-hidden mt-1">
                      <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(100, (v.achievement / (v.target || 1)) * 100)}%` }}></div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 font-mono text-xs text-blue-600 font-bold">\${v.bonus.toLocaleString()}</td>
                  <td className="py-3.5 px-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {/* WhatsApp Direct Send */}
                      {(() => {
                        const formattedPhone = formatPhoneForWhatsApp(v.phone);
                        const defaultMsg = `Hello ${v.name},\n\nThis is an update from our operations team. Your performance target is $${v.target.toLocaleString()}, and your achieved amount is $${v.achievement.toLocaleString()}.\n\nRemaining Balance: $${v.remaining.toLocaleString()}\nBonus Incentive: $${v.bonus.toLocaleString()}\nManager: ${v.manager}\n\nPlease reach out if you have any questions.`;
                        const waUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(defaultMsg)}`;

                        return (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-emerald-50 rounded text-emerald-600 hover:text-emerald-700 transition-all flex items-center justify-center"
                            title="Directly send individual target performance alert via WhatsApp"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </a>
                        );
                      })()}

                      <button
                        onClick={() => handleEditVendorClick(v)}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition-all"
                        title="Edit vendor profile"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteVendorClick(v.id, v.name)}
                        className="p-1.5 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-all"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400 italic">
                    No vendor matched your active criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-50">
            <span className="text-[10px] text-slate-500 font-mono font-bold">
              Showing page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white disabled:opacity-40"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`px-2.5 py-1.5 border rounded-lg text-xs font-semibold transition-all ${
                    currentPage === idx + 1
                      ? 'bg-blue-600 text-white border-blue-600 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Side-Drawer */}
      {activeVendorDrawer && (
        <div className="w-80 shrink-0 bg-white border border-slate-100 rounded-lg shadow-xl p-5 space-y-5 flex flex-col justify-between h-[600px] animate-slideIn">
          <div className="space-y-4 flex-1 overflow-y-auto">
            {/* Drawer header */}
            <div className="flex justify-between items-start border-b border-slate-50 pb-3">
              <div className="space-y-0.5">
                <span className="text-[9px] text-slate-400 font-mono uppercase font-bold">Vendor File Sheet</span>
                <h4 className="text-sm font-extrabold text-slate-800 truncate max-w-[180px]">{activeVendorDrawer.name || 'Corrupted Record'}</h4>
              </div>
              <button
                onClick={() => setActiveVendorDrawer(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* General parameters */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-xs">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono text-slate-600">{activeVendorDrawer.phone}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-600">Region manager: <strong className="text-slate-800">{activeVendorDrawer.manager}</strong> ({activeVendorDrawer.region})</span>
              </div>
            </div>

            {/* Metrics cards inside drawer */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <span className="text-[8px] text-slate-400 font-mono uppercase">Total Goal</span>
                <div className="text-xs font-mono font-extrabold text-slate-800">\${activeVendorDrawer.target.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-[8px] text-slate-400 font-mono uppercase">Achievement</span>
                <div className="text-xs font-mono font-extrabold text-emerald-600">\${activeVendorDrawer.achievement.toLocaleString()}</div>
              </div>
            </div>

            {/* Notes segment */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">Business Log Notes</span>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                {activeVendorDrawer.customNotes || 'No custom administrative remarks provided.'}
              </p>
            </div>

            {/* Timeline communications records */}
            <div className="space-y-2 pt-2 border-t border-slate-50">
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase flex items-center gap-1">
                <History className="w-3.5 h-3.5 text-blue-500" />
                Communication Logs History
              </span>

              {(!activeVendorDrawer.history || activeVendorDrawer.history.length === 0) ? (
                <p className="text-[11px] text-slate-400 italic">No historical dispatches found.</p>
              ) : (
                <div className="space-y-2.5 max-h-48 overflow-y-auto">
                  {activeVendorDrawer.history.map(item => (
                    <div key={item.id} className="p-2.5 bg-slate-50/30 border border-slate-100 rounded-lg space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-mono font-bold">
                        <span className="text-blue-600 truncate max-w-[120px]">{item.campaignName}</span>
                        <span className="text-slate-400">{new Date(item.sentAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-relaxed italic">"{item.message}"</p>
                      <div className="flex justify-between items-center text-[8px] pt-1">
                        <span className={`px-1.5 py-0.2 rounded font-bold ${
                          item.status === 'Sent' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {item.status}
                        </span>
                        {item.errorReason && <span className="text-rose-500 truncate max-w-[140px]">{item.errorReason}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick manual dispatch simulation trigger */}
          <div className="pt-3 border-t border-slate-50">
            <p className="text-[10px] text-slate-400 italic leading-tight text-center">
              Historical timeline synchronizes automatically after campaign executions.
            </p>
          </div>
        </div>
      )}

      {/* ADD VENDOR MODAL OVERLAY */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-slate-100 w-full max-w-md p-6 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3 mb-4">
              <h4 className="font-bold text-slate-900 text-sm">Add Vendor Profile</h4>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVendorSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Vendor Corporate Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-blue-500 bg-slate-50/50"
                  placeholder="e.g. Acme Industrial"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">WhatsApp Phone Number *</label>
                <input
                  type="text"
                  required
                  value={formPhone}
                  onChange={e => setFormPhone(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-blue-500 bg-slate-50/50 font-mono"
                  placeholder="E.164, e.g. +15550198274"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Campaign Target ($)</label>
                  <input
                    type="number"
                    value={formTarget}
                    onChange={e => setFormTarget(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-blue-500 bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Bonus Incentive ($)</label>
                  <input
                    type="number"
                    value={formBonus}
                    onChange={e => setFormBonus(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-blue-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Operational Region</label>
                  <select
                    value={formRegion}
                    onChange={e => setFormRegion(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-blue-500 bg-slate-50/50"
                  >
                    <option value="North">North</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                    <option value="South">South</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Responsible Manager</label>
                  <input
                    type="text"
                    value={formManager}
                    onChange={e => setFormManager(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-blue-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Custom Remarks</label>
                <textarea
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full h-16 text-xs border border-slate-200 rounded-xl p-2 focus:outline-blue-500 bg-slate-50/50"
                  placeholder="Optional logistical comments..."
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 border rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT VENDOR MODAL OVERLAY */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-slate-100 w-full max-w-md p-6 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3 mb-4">
              <h4 className="font-bold text-slate-900 text-sm">Modify Vendor Profile</h4>
              <button onClick={() => setShowEditModal(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditVendorSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Vendor Corporate Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-blue-500 bg-slate-50/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">WhatsApp Phone Number *</label>
                <input
                  type="text"
                  required
                  value={formPhone}
                  onChange={e => setFormPhone(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-blue-500 bg-slate-50/50 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Campaign Target ($)</label>
                  <input
                    type="number"
                    value={formTarget}
                    onChange={e => setFormTarget(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-blue-500 bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Incentive Bonus ($)</label>
                  <input
                    type="number"
                    value={formBonus}
                    onChange={e => setFormBonus(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-blue-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Achievement Progress ($)</label>
                  <input
                    type="number"
                    value={formAchievement}
                    onChange={e => setFormAchievement(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-blue-500 bg-slate-50/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Responsible Manager</label>
                  <input
                    type="text"
                    value={formManager}
                    onChange={e => setFormManager(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-blue-500 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Custom Log Notes</label>
                <textarea
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full h-16 text-xs border border-slate-200 rounded-xl p-2 focus:outline-blue-500 bg-slate-50/50"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="px-3.5 py-2 border rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
