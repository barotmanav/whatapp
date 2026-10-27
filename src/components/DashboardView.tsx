import React from 'react';
import {
  Send,
  AlertTriangle,
  UserCheck,
  Calendar,
  FileSpreadsheet,
  Activity,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Users
} from 'lucide-react';
import { Campaign, AuditLog, Notification } from '../types';

interface DashboardViewProps {
  campaigns: Campaign[];
  auditLogs: AuditLog[];
  notifications: Notification[];
  lastExcelFileName: string;
  lastExcelStats: { total: number; valid: number; invalid: number };
  onCreateCampaignClick: () => void;
  onViewMonitorClick: () => void;
  onViewReportsClick: () => void;
  userRole: 'Administrator' | 'Staff User';
}

export default function DashboardView({
  campaigns,
  auditLogs,
  notifications,
  lastExcelFileName,
  lastExcelStats,
  onCreateCampaignClick,
  onViewMonitorClick,
  onViewReportsClick,
  userRole
}: DashboardViewProps) {
  
  // Calculate stats
  const activeCampaign = campaigns.find(c => c.status === 'Running');
  const scheduledCampaigns = campaigns.filter(c => c.status === 'Scheduled');
  const completedCampaigns = campaigns.filter(c => c.status === 'Completed');

  const totalSent = campaigns.reduce((acc, c) => acc + c.stats.sent, 0);
  const totalFailed = campaigns.reduce((acc, c) => acc + c.stats.failed, 0);
  const totalSkippedDuplicates = campaigns.reduce((acc, c) => acc + c.stats.alreadySent + c.stats.skipped, 0);
  const successRate = totalSent > 0 ? ((totalSent / (totalSent + totalFailed)) * 100).toFixed(1) : '100.0';

  return (
    <div className="space-y-4">
      {/* Upper action greeting */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-gradient-to-r from-slate-900 via-slate-950 to-blue-950 p-4 rounded border border-slate-800 text-white shadow-xs">
        <div className="space-y-0.5">
          <h2 className="text-sm font-bold tracking-tight">Welcome to WhatsApp Dispatcher</h2>
          <p className="text-[11px] text-slate-300 leading-relaxed max-w-xl">
            You are operating under the <span className="font-bold text-emerald-400 font-mono uppercase">{userRole}</span> session. Use this panel to import vendor spreadsheets, manage your sending queues, and review delivery metrics.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onCreateCampaignClick}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Send className="w-3 h-3" />
            Create New Campaign
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Sent */}
        <div className="bg-white p-3 rounded border border-slate-200 flex items-center justify-between shadow-2xs">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-500 font-mono tracking-wider uppercase">Messages Dispatched</span>
            <div className="text-lg font-bold text-slate-800 leading-tight">{totalSent}</div>
            <p className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
              99.8% Core Delivery
            </p>
          </div>
          <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Send className="w-4 h-4" />
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white p-3 rounded border border-slate-200 flex items-center justify-between shadow-2xs">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-500 font-mono tracking-wider uppercase">Average Success Rate</span>
            <div className="text-lg font-bold text-emerald-600 leading-tight">{successRate}%</div>
            <p className="text-[9px] text-slate-500 font-medium">
              {totalFailed} delivery failures
            </p>
          </div>
          <div className="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Duplicates Filtered */}
        <div className="bg-white p-3 rounded border border-slate-200 flex items-center justify-between shadow-2xs">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-500 font-mono tracking-wider uppercase">Duplicates Blocked</span>
            <div className="text-lg font-bold text-slate-800 leading-tight">{totalSkippedDuplicates}</div>
            <p className="text-[9px] text-blue-600 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-blue-500" />
              100% Protection Rating
            </p>
          </div>
          <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>

        {/* System Limits status */}
        <div className="bg-white p-3 rounded border border-slate-200 flex items-center justify-between shadow-2xs">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-slate-500 font-mono tracking-wider uppercase">Daily Limit Safeguard</span>
            <div className="text-lg font-bold text-slate-800 leading-tight">75 / 500</div>
            <p className="text-[9px] text-slate-500 font-medium">
              Resets at midnight UTC
            </p>
          </div>
          <div className="w-8 h-8 rounded bg-slate-50 flex items-center justify-center text-slate-600 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left 2 Columns: Active Campaign, Excel summary, Upcoming queues */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Active / Last Campaign Card */}
          <div className="bg-white rounded border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Active Transmission Status</h3>
              </div>
              {activeCampaign ? (
                <button
                  onClick={onViewMonitorClick}
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-0.5"
                >
                  Go to live feed
                  <ArrowRight className="w-3 h-3" />
                </button>
              ) : (
                <span className="text-[10px] text-slate-400 font-bold uppercase">Idle - No campaign active</span>
              )}
            </div>

            {activeCampaign ? (
              <div className="p-3 bg-blue-50/20 rounded border border-blue-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <h4 className="text-[11px] font-bold text-blue-950 font-mono">{activeCampaign.name}</h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-blue-700 mt-0.5 font-bold">
                    <span>Type: {activeCampaign.type}</span>
                    <span>•</span>
                    <span>Schedule: {activeCampaign.schedule}</span>
                  </div>
                </div>

                <div className="w-full md:w-48 space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-blue-950 font-bold">
                    <span>Progress:</span>
                    <span>
                      {((activeCampaign.stats.sent / activeCampaign.vendorCount) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200/60 h-1.5 rounded overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded transition-all duration-300"
                      style={{ width: `${(activeCampaign.stats.sent / activeCampaign.vendorCount) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[9px] text-blue-900/60 font-mono">
                    <span>Sent: {activeCampaign.stats.sent}</span>
                    <span>Skipped: {activeCampaign.stats.alreadySent}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center border border-dashed border-slate-200 rounded bg-slate-50/50">
                <p className="text-[11px] text-slate-500 font-medium">No campaign is currently dispatching.</p>
                <button
                  onClick={onCreateCampaignClick}
                  className="mt-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1 rounded text-[11px] font-bold shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3 text-slate-400" />
                  Launch a session now
                </button>
              </div>
            )}
          </div>

          {/* Last Uploaded Excel file info */}
          <div className="bg-white rounded border border-slate-200 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Last Uploaded Excel Source</h3>
            </div>

            <div className="p-3 bg-emerald-50/15 border border-emerald-500/10 rounded flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="space-y-0.5">
                <div className="text-[11px] font-bold text-emerald-950 font-mono break-all">{lastExcelFileName}</div>
                <div className="text-[10px] text-slate-500 leading-tight">
                  Automatically loaded as the fallback data source if no new document is provided.
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <div className="text-center bg-white border border-slate-200 rounded px-2.5 py-1 shadow-2xs min-w-[65px]">
                  <div className="text-xs font-bold text-emerald-700">{lastExcelStats.total}</div>
                  <div className="text-[8px] text-slate-400 uppercase font-mono font-bold leading-none">Total Rows</div>
                </div>
                <div className="text-center bg-white border border-slate-200 rounded px-2.5 py-1 shadow-2xs min-w-[65px]">
                  <div className="text-xs font-bold text-emerald-700">{lastExcelStats.valid}</div>
                  <div className="text-[8px] text-slate-400 uppercase font-mono font-bold leading-none">Valid</div>
                </div>
                <div className="text-center bg-white border border-slate-200 rounded px-2.5 py-1 shadow-2xs min-w-[65px]">
                  <div className="text-xs font-bold text-rose-600">{lastExcelStats.invalid}</div>
                  <div className="text-[8px] text-slate-400 uppercase font-mono font-bold leading-none">Errors</div>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming scheduled Campaigns */}
          <div className="bg-white rounded border border-slate-200 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-600" />
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Upcoming Scheduled Campaigns</h3>
            </div>

            {scheduledCampaigns.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">No future campaigns are currently scheduled.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {scheduledCampaigns.map(camp => (
                  <div key={camp.id} className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-slate-800 truncate">{camp.name}</div>
                      <div className="text-[9px] text-blue-600 font-mono mt-0.5 font-bold">
                        {camp.scheduleDetails || camp.schedule}
                      </div>
                    </div>
                    <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded font-bold shrink-0">
                      {camp.vendorCount} vendors
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: System health window & System feed logs */}
        <div className="space-y-4">
          
          {/* Active Sending Safeguards */}
          <div className="bg-white rounded border border-slate-200 p-4 space-y-3">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Active Sending Safeguards</h3>
            
            <div className="p-3 bg-emerald-50/20 border border-emerald-500/10 rounded flex items-center gap-2.5">
              <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
              <div>
                <div className="text-[11px] font-bold text-emerald-950">Duplicate Safe Active</div>
                <p className="text-[9px] text-emerald-900/60 leading-none mt-0.5">Vendors blocked from redundant contacts.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center gap-2.5">
              <Clock className="w-4.5 h-4.5 text-blue-600 shrink-0" />
              <div>
                <div className="text-[11px] font-bold text-slate-800">Operational Window</div>
                <p className="text-[9px] text-slate-500 leading-none mt-0.5">Campaigns run only during 09:00 - 18:00 window.</p>
              </div>
            </div>
          </div>

          {/* System Recent Activity (Audit logs segment) */}
          <div className="bg-white rounded border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Audit & System Activity</h3>
              </div>
              <button
                onClick={onViewReportsClick}
                className="text-[9px] text-slate-500 hover:text-slate-900 font-bold font-mono uppercase cursor-pointer"
              >
                Analytics
              </button>
            </div>

            <div className="space-y-2.5 max-h-[260px] overflow-y-auto divide-y divide-slate-100">
              {auditLogs.slice(0, 5).map(log => (
                <div key={log.id} className="pt-2 first:pt-0 flex gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 mt-1.5"></span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-[11px] font-bold text-slate-700 truncate">{log.action}</span>
                      <span className="text-[8px] text-slate-400 font-mono shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug truncate">{log.details}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[8px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-mono">
                        {log.user}
                      </span>
                      <span className="text-[8px] bg-blue-50 text-blue-600 px-1 py-0.2 rounded font-mono uppercase font-bold">
                        {log.module}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
