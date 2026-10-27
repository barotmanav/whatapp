import React, { useState } from 'react';
import {
  History,
  Search,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Download,
  Eye,
  Trash2,
  Calendar,
  Layers,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Campaign } from '../types';

interface HistoryViewProps {
  campaigns: Campaign[];
  addSystemLog: (action: string, details: string) => void;
  addNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export default function HistoryView({ campaigns, addSystemLog, addNotification }: HistoryViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);

  const getFilteredCampaigns = () => {
    const list = campaigns.filter(c => c.status === 'Completed' || c.status === 'Cancelled' || c.status === 'Failed' || c.status === 'Scheduled');
    if (!searchTerm.trim()) return list;
    return list.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.createdBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.excelFileName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const toggleExpand = (id: string) => {
    setExpandedCampaignId(prev => (prev === id ? null : id));
  };

  const handleDownloadCampaignLog = (camp: Campaign) => {
    const headers = ['Vendor Name', 'Phone Number', 'Dispatch Status', 'Generated Message', 'Dispatched At', 'Error Code'];
    
    // Fallback rows if campaign has no parsed individuals
    const rows = camp.vendors ? camp.vendors.map(v => [
      `"${v.name}"`,
      `"${v.phone}"`,
      `"${v.status}"`,
      `"${(v.generatedMessage || '').replace(/"/g, '""')}"`,
      `"${v.sentAt || ''}"`,
      `"${v.errorReason || ''}"`
    ]) : [];

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(",")].concat(rows.map(e => e.join(","))).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `campaign_report_${camp.id}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addSystemLog('Log Download', `Exported run log report for campaign ${camp.name}`);
    addNotification('Report Downloaded', `Successfully compiled CSV dispatch metrics for campaign "${camp.name}".`, 'success');
  };

  const filtered = getFilteredCampaigns();

  return (
    <div className="bg-white rounded-lg border border-slate-100 shadow-xs p-5 space-y-4">
      {/* Header bar and search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50 pb-4">
        <div className="space-y-0.5">
          <h3 className="font-extrabold text-slate-800 text-sm">Campaign Auditing & Dispatch Archive</h3>
          <p className="text-[11px] text-slate-500">View complete structural execution properties of past messaging dispatches.</p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-1.8 text-xs border border-slate-200 rounded-xl w-64 focus:outline-blue-500 bg-slate-50/50"
            placeholder="Search campaign runs..."
          />
        </div>
      </div>

      {/* Main Campaign Timeline Table */}
      <div className="divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 italic">
            No archived campaign logs matches your search.
          </div>
        ) : (
          filtered.map(camp => {
            const isExpanded = expandedCampaignId === camp.id;
            const successPct = camp.vendorCount > 0 
              ? ((camp.stats.sent / camp.vendorCount) * 100).toFixed(0) 
              : '0';

            return (
              <div key={camp.id} className="py-4 first:pt-0">
                <div
                  onClick={() => toggleExpand(camp.id)}
                  className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer hover:bg-slate-50/40 p-2 rounded-xl transition-all"
                >
                  {/* Title and stats summary */}
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {camp.status === 'Completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {camp.status === 'Cancelled' && <XCircle className="w-4 h-4 text-rose-500" />}
                      {camp.status === 'Scheduled' && <Calendar className="w-4 h-4 text-blue-500" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        {camp.name}
                        <span className={`text-[9px] px-2 py-0.2 rounded-full font-bold ${
                          camp.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          camp.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                          'bg-blue-50 text-blue-600 border border-blue-100'
                        }`}>
                          {camp.status}
                        </span>
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-400 font-mono mt-1 font-semibold">
                        <span>By: {camp.createdBy}</span>
                        <span>•</span>
                        <span>File: {camp.excelFileName}</span>
                        <span>•</span>
                        <span>Date: {new Date(camp.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right hand figures */}
                  <div className="flex items-center gap-6">
                    <div className="flex gap-4 text-center">
                      <div>
                        <div className="text-xs font-black text-slate-700">{camp.vendorCount}</div>
                        <div className="text-[8px] text-slate-400 font-bold uppercase font-mono">Vendors</div>
                      </div>
                      <div>
                        <div className="text-xs font-black text-emerald-600">{camp.stats.sent}</div>
                        <div className="text-[8px] text-slate-400 font-bold uppercase font-mono text-emerald-600/70">Sent</div>
                      </div>
                      <div>
                        <div className="text-xs font-black text-violet-600">{camp.stats.alreadySent}</div>
                        <div className="text-[8px] text-slate-400 font-bold uppercase font-mono text-violet-600/70">Skipped</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownloadCampaignLog(camp); }}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-all"
                        title="Export run metrics to CSV"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>
                </div>

                {/* Expanded parameters sheet */}
                {isExpanded && (
                  <div className="mt-3 ml-7 p-4 bg-slate-50/70 rounded-xl border border-slate-100 space-y-4 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                    
                    {/* Params details */}
                    <div className="space-y-3 text-xs">
                      <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider uppercase">Execution parameters</span>
                      
                      <div className="space-y-2 font-semibold">
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Initiated At</span>
                          <span className="text-slate-700">{camp.startedAt ? new Date(camp.startedAt).toLocaleString() : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Completed At</span>
                          <span className="text-slate-700">{camp.completedAt ? new Date(camp.completedAt).toLocaleString() : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Scheduled Trigger</span>
                          <span className="text-blue-600">{camp.scheduleDetails || camp.schedule}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-500">Platform Category</span>
                          <span className="text-slate-700">{camp.type}</span>
                        </div>
                      </div>
                    </div>

                    {/* Template Review */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-bold text-slate-400 font-mono tracking-wider uppercase">Template active copy</span>
                      <p className="text-[10px] text-slate-600 leading-relaxed font-mono whitespace-pre-wrap p-2.5 bg-white border border-slate-150 rounded-lg max-h-36 overflow-y-auto">
                        {camp.templateText}
                      </p>
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
