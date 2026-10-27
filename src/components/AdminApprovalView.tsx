import React, { useState } from 'react';
import { 
  Check, 
  X, 
  ShieldCheck, 
  Eye, 
  Users, 
  Phone, 
  ArrowRight, 
  Search, 
  AlertTriangle, 
  FileSpreadsheet, 
  Clock, 
  MessageSquare 
} from 'lucide-react';
import { Campaign } from '../types';

interface AdminApprovalViewProps {
  campaigns: Campaign[];
  onApproveCampaign: (campaignId: string) => void;
  onRejectCampaign: (campaignId: string) => void;
}

export default function AdminApprovalView({
  campaigns,
  onApproveCampaign,
  onRejectCampaign
}: AdminApprovalViewProps) {
  const pendingCampaigns = campaigns.filter(c => c.status === 'Pending Approval');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    pendingCampaigns.length > 0 ? pendingCampaigns[0].id : null
  );
  const [searchQuery, setSearchQuery] = useState('');

  // If the selected campaign is no longer pending, reset selection
  const activeSelectedCampaign = pendingCampaigns.find(c => c.id === selectedCampaignId) || 
    (pendingCampaigns.length > 0 ? pendingCampaigns[0] : null);

  const handleApprove = (id: string) => {
    onApproveCampaign(id);
    setSelectedCampaignId(null);
  };

  const handleReject = (id: string) => {
    onRejectCampaign(id);
    setSelectedCampaignId(null);
  };

  return (
    <div className="space-y-6">
      {/* Informational Header banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-400 font-mono text-[10px] font-bold tracking-wider uppercase">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            SECURE MANAGEMENT GATEWAY
          </div>
          <h2 className="text-sm font-bold text-white">Review & Approval Console</h2>
          <p className="text-[11px] text-slate-300 max-w-xl">
            Authorize outbound message queues before they are dispatched. Review personalized template rendering and verify vendor recipient phone records for strict compliance.
          </p>
        </div>
        <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 font-mono text-center shrink-0">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Pending Review</div>
          <div className="text-sm font-bold text-amber-400">{pendingCampaigns.length} Queues</div>
        </div>
      </div>

      {pendingCampaigns.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xs font-bold text-slate-800">Clear Review Queue</h3>
          <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
            All submitted campaigns are authorized, active, or complete. There are no pending items requiring administrator approval at this time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: list of pending queues */}
          <div className="space-y-3 lg:col-span-1">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Campaigns Awaiting Review</h3>
            <div className="space-y-2">
              {pendingCampaigns.map(camp => {
                const isSelected = activeSelectedCampaign?.id === camp.id;
                return (
                  <button
                    key={camp.id}
                    onClick={() => setSelectedCampaignId(camp.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-blue-50/10 border-blue-600 shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-xs font-bold text-slate-800 truncate">{camp.name}</span>
                      <span className="text-[8px] bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">
                        REVIEW
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {camp.vendorCount} vendors
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {camp.schedule}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel: Active selected review details */}
          {activeSelectedCampaign && (
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5 shadow-2xs">
                {/* Header section of specific campaign */}
                <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 font-mono uppercase">Analyzing Campaign: {activeSelectedCampaign.name}</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Uploaded from <strong className="font-mono">{activeSelectedCampaign.excelFileName}</strong> by Staff Operator.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReject(activeSelectedCampaign.id)}
                      className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject Queue
                    </button>
                    <button
                      onClick={() => handleApprove(activeSelectedCampaign.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Authorize & Deploy
                    </button>
                  </div>
                </div>

                {/* Details layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-400 font-mono uppercase">Template Blueprint</h4>
                    <p className="text-[10px] font-mono text-slate-600 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
                      {activeSelectedCampaign.templateText}
                    </p>
                  </div>

                  <div className="space-y-3 text-[11px]">
                    <h4 className="text-[10px] font-bold text-slate-400 font-mono uppercase">Distribution Metadata</h4>
                    <div className="divide-y divide-slate-100 space-y-1.5">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-500 font-medium">Recipient Count</span>
                        <span className="font-bold text-slate-800">{activeSelectedCampaign.vendorCount} Vendors</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-500 font-medium">Type / Category</span>
                        <span className="font-bold text-slate-800">{activeSelectedCampaign.type}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-500 font-medium">Target Schedule</span>
                        <span className="font-bold text-blue-600 font-mono">{activeSelectedCampaign.scheduleDetails}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-500 font-medium">Duplicate Filter</span>
                        <span className="font-bold text-emerald-600">Strictly Guarded</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recipient Messages Table with search */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <h4 className="text-[10px] font-bold text-slate-400 font-mono uppercase flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                      Personalized Recipient Messages Preview
                    </h4>
                    
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search vendor..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full sm:w-48 text-[11px] border border-slate-200 rounded-lg pl-7 pr-3 py-1 focus:border-blue-500 focus:outline-none"
                      />
                      <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2" />
                    </div>
                  </div>

                  {/* Message rows */}
                  <div className="border border-slate-100 rounded-lg overflow-hidden divide-y divide-slate-100 max-h-64 overflow-y-auto bg-slate-50/50">
                    {activeSelectedCampaign.vendors && activeSelectedCampaign.vendors.filter(v => 
                      v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      v.phone.includes(searchQuery)
                    ).length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs italic">
                        No recipient vendors match your query.
                      </div>
                    ) : (
                      activeSelectedCampaign.vendors?.filter(v => 
                        v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        v.phone.includes(searchQuery)
                      ).map(vendorProg => (
                        <div key={vendorProg.vendorId} className="p-3 bg-white flex flex-col md:flex-row gap-3">
                          <div className="md:w-1/4 shrink-0">
                            <div className="font-bold text-slate-800 text-[11px] truncate">{vendorProg.name}</div>
                            <div className="text-[9px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                              <Phone className="w-2.5 h-2.5" />
                              {vendorProg.phone}
                            </div>
                          </div>
                          <div className="flex-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <p className="text-[10px] font-sans text-slate-600 whitespace-pre-wrap leading-normal">
                              {vendorProg.generatedMessage}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
