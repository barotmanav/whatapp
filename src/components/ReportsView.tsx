import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  TrendingUp,
  FileSpreadsheet,
  HelpCircle
} from 'lucide-react';
import { Campaign, Vendor } from '../types';

interface ReportsViewProps {
  campaigns: Campaign[];
  vendors: Vendor[];
  addSystemLog: (action: string, details: string) => void;
  addNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

type ReportType = 
  | 'campaign_summary'
  | 'vendor_summary'
  | 'delivery_summary'
  | 'failure_summary'
  | 'skipped_vendors'
  | 'duplicate_prevention_report'
  | 'historical_campaign_report';

export default function ReportsView({ campaigns, vendors, addSystemLog, addNotification }: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'duplicates' | 'performance'>('overview');
  const [selectedReport, setSelectedReport] = useState<ReportType>('campaign_summary');

  // Calculate metrics
  const totalVendors = vendors.length;
  const activeCampaigns = campaigns.length;
  const totalSent = campaigns.reduce((acc, c) => acc + c.stats.sent, 0);
  const totalFailed = campaigns.reduce((acc, c) => acc + c.stats.failed, 0);
  const totalAlreadySent = campaigns.reduce((acc, c) => acc + c.stats.alreadySent, 0);

  // Regional metrics calculation
  const regions = ['North', 'East', 'West', 'South'];
  const regionalMetrics = regions.map(reg => {
    const regionalVendors = vendors.filter(v => v.region === reg);
    const totalTarget = regionalVendors.reduce((acc, v) => acc + v.target, 0);
    const totalAchieved = regionalVendors.reduce((acc, v) => acc + v.achievement, 0);
    const pct = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;
    return { name: reg, target: totalTarget, achieved: totalAchieved, percentage: pct };
  });

  // Export report script
  const triggerReportCompilation = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = '';

    switch (selectedReport) {
      case 'campaign_summary':
        headers = ['Campaign Name', 'Type', 'Schedule', 'Status', 'Total Recipient', 'Successful Msg', 'Failed Msg', 'Skipped (Duplicate)'];
        rows = campaigns.map(c => [
          `"${c.name}"`, `"${c.type}"`, `"${c.schedule}"`, `"${c.status}"`, c.vendorCount, c.stats.sent, c.stats.failed, c.stats.alreadySent
        ]);
        filename = 'campaign_performance_summary';
        break;

      case 'vendor_summary':
        headers = ['Vendor Name', 'WhatsApp Contact', 'Q2 Target', 'Achievement', 'Remaining', 'Bonus', 'Region', 'Manager', 'Status'];
        rows = vendors.map(v => [
          `"${v.name}"`, `"${v.phone}"`, v.target, v.achievement, v.remaining, v.bonus, `"${v.region}"`, `"${v.manager}"`, `"${v.status}"`
        ]);
        filename = 'vendor_business_achievements';
        break;

      case 'delivery_summary':
        headers = ['Campaign ID', 'Campaign Name', 'Vendor ID', 'Vendor Name', 'Recipient Phone', 'Delivery Status', 'Timestamp'];
        campaigns.forEach(c => {
          if (c.vendors) {
            c.vendors.forEach(v => {
              rows.push([
                `"${c.id}"`, `"${c.name}"`, `"${v.vendorId}"`, `"${v.name}"`, `"${v.phone}"`, `"${v.status}"`, `"${v.sentAt || ''}"`
              ]);
            });
          }
        });
        filename = 'delivery_transmission_logs';
        break;

      case 'failure_summary':
        headers = ['Campaign Name', 'Vendor Name', 'Recipient Phone', 'Error Message Code', 'Time occurred'];
        campaigns.forEach(c => {
          if (c.vendors) {
            c.vendors.filter(v => v.status === 'Failed').forEach(v => {
              rows.push([
                `"${c.name}"`, `"${v.name}"`, `"${v.phone}"`, `"${v.errorReason || 'Dynamic routing gateway error'}"`, `"${v.sentAt || ''}"`
              ]);
            });
          }
        });
        filename = 'delivery_transmission_failures';
        break;

      case 'skipped_vendors':
      case 'duplicate_prevention_report':
        headers = ['Campaign Name', 'Vendor Name', 'Recipient Phone', 'Safety Trigger Reason', 'Bypass Status', 'Timestamp'];
        campaigns.forEach(c => {
          if (c.vendors) {
            c.vendors.filter(v => v.status === 'Already Sent').forEach(v => {
              rows.push([
                `"${c.name}"`, `"${v.name}"`, `"${v.phone}"`, '"Vendor already notified in weekly interval window"', '"BLOCKED - Safe skip applied"', `"${v.sentAt || ''}"`
              ]);
            });
          }
        });
        filename = 'duplicate_prevention_metrics';
        break;

      default:
        headers = ['Report ID', 'Timestamp', 'Operator', 'Status'];
        rows = [[`"REP-${Date.now()}"`, `"${new Date().toISOString()}"`, '"Manav Barot"', '"Validated"']];
        filename = 'audit_general_performance';
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(",")].concat(rows.map(e => e.join(","))).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addSystemLog('Compiled Report', `Generated and compiled report spreadsheet: ${selectedReport}`);
    addNotification('Report Compiled', 'Corporate report generated and downloaded successfully.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Upper Navigation and layout */}
      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/40 w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'overview'
              ? 'bg-white text-blue-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Delivery Overview
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'performance'
              ? 'bg-white text-blue-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Regional Achievements
        </button>
        <button
          onClick={() => setActiveTab('duplicates')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'duplicates'
              ? 'bg-white text-blue-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Duplicate Prevention Audit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Selected Tabs charts */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-100 p-5 space-y-4">
          
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="space-y-1 pb-3 border-b border-slate-50">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide font-mono">Total Delivery Summary Metrics</h4>
                <p className="text-[11px] text-slate-500">Comparing message outputs across dispatched campaigns.</p>
              </div>

              {/* Delivery Stats Bar Charts */}
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Successful Dispatches</span>
                    <span className="font-mono text-emerald-600">{totalSent} Messages</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: `${(totalSent / (totalSent + totalFailed + totalAlreadySent || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Duplicates Prevented (Safe Bypass)</span>
                    <span className="font-mono text-violet-600">{totalAlreadySent} Blocked</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-violet-500 h-full"
                      style={{ width: `${(totalAlreadySent / (totalSent + totalFailed + totalAlreadySent || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Network Gateway Failures</span>
                    <span className="font-mono text-rose-600">{totalFailed} Failures</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full"
                      style={{ width: `${(totalFailed / (totalSent + totalFailed + totalAlreadySent || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/40 rounded-xl grid grid-cols-3 gap-4 text-center mt-4">
                <div>
                  <div className="text-xs text-slate-500">Average Success Ratio</div>
                  <div className="text-sm font-black text-emerald-600">
                    {totalSent > 0 ? ((totalSent / (totalSent + totalFailed)) * 100).toFixed(1) : '100.0'}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Contact Duplication Rate</div>
                  <div className="text-sm font-black text-violet-600">
                    {totalSent > 0 ? ((totalAlreadySent / (totalSent + totalAlreadySent)) * 100).toFixed(1) : '0.0'}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Total Audit Log points</div>
                  <div className="text-sm font-black text-slate-700">{campaigns.length} Active Campaigns</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-4">
              <div className="space-y-1 pb-3 border-b border-slate-50">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide font-mono">Regional Performance Target metrics</h4>
                <p className="text-[11px] text-slate-500">Comparing vendor achievements percentages divided by geographical regions.</p>
              </div>

              {/* Regional Grid metrics SVG mock bars */}
              <div className="space-y-4 pt-2">
                {regionalMetrics.map(reg => (
                  <div key={reg.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{reg.name} Region (Goal: \${reg.target.toLocaleString()})</span>
                      <span className="font-mono text-blue-600">{reg.percentage}% Met (\${reg.achieved.toLocaleString()})</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${reg.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'duplicates' && (
            <div className="space-y-4">
              <div className="space-y-1 pb-3 border-b border-slate-50">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide font-mono">Deduplication Prevention logs</h4>
                <p className="text-[11px] text-slate-500">Active monitoring safe bypass events. Safekeeping vendor communication margins.</p>
              </div>

              {/* Print safe bypass list items */}
              <div className="space-y-3 max-h-64 overflow-y-auto divide-y divide-slate-50">
                {campaigns.flatMap(c => 
                  c.vendors ? c.vendors.filter(v => v.status === 'Already Sent').map((v, i) => (
                    <div key={i} className="pt-2.5 first:pt-0 flex justify-between items-start text-xs gap-3">
                      <div>
                        <div className="font-bold text-slate-800">{v.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{v.phone}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] bg-violet-50 text-violet-600 border border-violet-100 px-2 py-0.5 rounded-full font-bold">
                          Safe Skip Applied
                        </span>
                        <div className="text-[9px] text-slate-400 mt-0.5 font-mono">Blocked redundant Q2 campaign</div>
                      </div>
                    </div>
                  )) : []
                ).slice(0, 5)}

                {totalAlreadySent === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-12">No duplication bypasses have been triggered in the active campaigns.</p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right 1 Column: Download Corporate Report Suite widget */}
        <div className="bg-white rounded-lg border border-slate-100 p-5 space-y-4 shadow-xs h-fit">
          <div className="space-y-1 pb-2 border-b border-slate-50">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide font-mono">Corporate Report Suite</h4>
            <p className="text-[11px] text-slate-400">Compile operational spreadsheets dynamically.</p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700">Select Report Profile</label>
            <select
              value={selectedReport}
              onChange={e => setSelectedReport(e.target.value as ReportType)}
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:border-blue-500 focus:outline-none"
            >
              <option value="campaign_summary">Campaign Summary Performance</option>
              <option value="vendor_summary">Vendor Business Target Overview</option>
              <option value="delivery_summary">Full Transmission Log Table</option>
              <option value="failure_summary">Delivery Failure Outages</option>
              <option value="skipped_vendors">Bypassed Vendors List</option>
              <option value="duplicate_prevention_report">Duplicate Prevention Metrics</option>
            </select>

            <button
              onClick={triggerReportCompilation}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs shadow-blue-600/10 mt-3"
            >
              <Download className="w-4 h-4 text-blue-200" />
              Compile & Download CSV
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
