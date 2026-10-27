import React, { useEffect, useState } from 'react';
import {
  Radio,
  Play,
  Pause,
  XCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  UserX,
  History,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Search,
  CheckSquare,
  Volume2,
  Send,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { Campaign, CampaignVendorProgress, CampaignStatus, Vendor, SystemSettings } from '../types';

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

interface LiveMonitorViewProps {
  activeCampaign: Campaign | undefined;
  onCampaignStatusChange: (status: CampaignStatus, updatedStats?: any, updatedVendors?: CampaignVendorProgress[]) => void;
  addSystemLog: (action: string, details: string) => void;
  addNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  onCampaignComplete: (completedCampaign: Campaign) => void;
  allVendors: Vendor[];
  settings: SystemSettings;
}

export default function LiveMonitorView({
  activeCampaign,
  onCampaignStatusChange,
  addSystemLog,
  addNotification,
  onCampaignComplete,
  allVendors,
  settings
}: LiveMonitorViewProps) {
  const [feedLogs, setFeedLogs] = useState<{ id: string; time: string; text: string; type: 'info' | 'success' | 'error' | 'skip' }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [dispatchMode, setDispatchMode] = useState<'backend-auto' | 'popup-manual' | 'simulation'>('backend-auto');

  const dispatchModeRef = React.useRef(dispatchMode);
  useEffect(() => {
    dispatchModeRef.current = dispatchMode;
  }, [dispatchMode]);

  // Core Simulation Effect
  useEffect(() => {
    if (!activeCampaign || activeCampaign.status !== 'Running' || !activeCampaign.vendors) return;

    const intervalTime = (settings.messageDelaySeconds || 2) * 1000;
    
    const timer = setInterval(() => {
      // Find the first pending item in the queue
      const nextPendingIndex = activeCampaign.vendors!.findIndex(v => v.status === 'Pending');

      if (nextPendingIndex === -1) {
        // Queue is finished! Complete the campaign.
        clearInterval(timer);
        const finalCampaign: Campaign = {
          ...activeCampaign,
          status: 'Completed',
          completedAt: new Date().toISOString()
        };
        onCampaignComplete(finalCampaign);
        addSystemLog('Campaign Completed', `Campaign "${activeCampaign.name}" completed successfully with ${activeCampaign.stats.sent} sent and ${activeCampaign.stats.failed} failed messages.`);
        addNotification('Campaign Finished', `Transmission for "${activeCampaign.name}" successfully finalized.`, 'success');
        
        setFeedLogs(prev => [
          {
            id: String(Date.now()),
            time: new Date().toLocaleTimeString(),
            text: '🎉 Campaign Execution completed. Queue flushed successfully.',
            type: 'success'
          },
          ...prev
        ]);
        return;
      }

      // We have a pending vendor. Process them!
      const currentVendorProgress = activeCampaign.vendors![nextPendingIndex];
      const updatedVendors = [...activeCampaign.vendors!];

      // Mark as Sending first
      updatedVendors[nextPendingIndex] = {
        ...currentVendorProgress,
        status: 'Sending'
      };
      
      onCampaignStatusChange('Running', undefined, updatedVendors);

      // Timeout to simulate API call latency
      setTimeout(() => {
        const isDuplicate = checkIsDuplicate(currentVendorProgress.vendorId, allVendors);
        let finalStatus: 'Sent' | 'Failed' | 'Skipped' | 'Already Sent' = 'Sent';
        let logText = '';
        let logType: 'info' | 'success' | 'error' | 'skip' = 'success';
        let errorMsg = '';

        const formattedPhone = formatPhoneForWhatsApp(currentVendorProgress.phone);

        if (isDuplicate) {
          finalStatus = 'Already Sent';
          logText = `⚠️ Contact duplicate detected for [${currentVendorProgress.name}]. Message blocked for period protections.`;
          logType = 'skip';

          // Apply final status to row
          updatedVendors[nextPendingIndex] = {
            ...currentVendorProgress,
            status: finalStatus,
            sentAt: new Date().toISOString(),
            errorReason: errorMsg || undefined
          };

          const stats = {
            pending: updatedVendors.filter(v => v.status === 'Pending').length,
            sending: 0,
            sent: updatedVendors.filter(v => v.status === 'Sent').length,
            failed: updatedVendors.filter(v => v.status === 'Failed').length,
            skipped: updatedVendors.filter(v => v.status === 'Skipped').length,
            alreadySent: updatedVendors.filter(v => v.status === 'Already Sent').length
          };

          onCampaignStatusChange('Running', stats, updatedVendors);
          setFeedLogs(prev => [
            {
              id: String(Date.now() + Math.random()),
              time: new Date().toLocaleTimeString(),
              text: logText,
              type: logType
            },
            ...prev
          ]);
        } else if (currentVendorProgress.phone === 'Invalid-Phone-Number' || currentVendorProgress.phone.includes('Letter')) {
          finalStatus = 'Failed';
          errorMsg = 'E.164 verification rejected format';
          logText = `❌ Format rejection on [${currentVendorProgress.name}] - Number is invalid: ${currentVendorProgress.phone}`;
          logType = 'error';

          // Apply final status to row
          updatedVendors[nextPendingIndex] = {
            ...currentVendorProgress,
            status: finalStatus,
            sentAt: new Date().toISOString(),
            errorReason: errorMsg || undefined
          };

          const stats = {
            pending: updatedVendors.filter(v => v.status === 'Pending').length,
            sending: 0,
            sent: updatedVendors.filter(v => v.status === 'Sent').length,
            failed: updatedVendors.filter(v => v.status === 'Failed').length,
            skipped: updatedVendors.filter(v => v.status === 'Skipped').length,
            alreadySent: updatedVendors.filter(v => v.status === 'Already Sent').length
          };

          onCampaignStatusChange('Running', stats, updatedVendors);
          setFeedLogs(prev => [
            {
              id: String(Date.now() + Math.random()),
              time: new Date().toLocaleTimeString(),
              text: logText,
              type: logType
            },
            ...prev
          ]);
        } else if (dispatchModeRef.current === 'backend-auto') {
          // 🚀 100% AUTOMATED BACKEND AUTO-SEND (ZERO POPUPS / ZERO MANUAL CLICKS!)
          const triggerBackendAutoDispatch = async () => {
            let finalStatus: 'Sent' | 'Failed' | 'Skipped' | 'Already Sent' = 'Sent';
            let logText = '';
            let logType: 'info' | 'success' | 'error' | 'skip' = 'success';
            let errorMsg = '';

            try {
              const res = await fetch('/api/send-whatsapp', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  phone: formattedPhone,
                  message: currentVendorProgress.generatedMessage,
                  gatewayEnabled: settings.gatewayEnabled,
                  gatewayType: settings.gatewayType,
                  gatewayUrl: settings.gatewayUrl,
                  gatewayMethod: settings.gatewayMethod,
                  gatewayHeaders: settings.gatewayHeaders,
                  gatewayBodyTemplate: settings.gatewayBodyTemplate
                })
              });

              const data = await res.json();

              if (res.ok && data.success) {
                if (data.gateway === 'external') {
                  finalStatus = 'Sent';
                  logText = `🚀 [Backend Gateway] Successfully dispatched message to ${currentVendorProgress.name} (${formattedPhone}) via external API!`;
                  logType = 'success';
                } else {
                  // Simulated run since no background API gateway is active
                  finalStatus = 'Sent';
                  logText = `🧪 [Simulation Mode] Draft prepared for ${currentVendorProgress.name} (${formattedPhone}). (Setup real API Gateway in Settings to send for real!)`;
                  logType = 'info';
                }
              } else {
                finalStatus = 'Failed';
                errorMsg = data.error || `Server error (HTTP ${res.status})`;
                logText = `❌ [Background Auto-Send] Server failed to send to ${currentVendorProgress.name}: ${errorMsg}`;
                logType = 'error';
              }
            } catch (err: any) {
              finalStatus = 'Failed';
              errorMsg = err.message || 'Connection lost';
              logText = `⚠️ [Background Connection] Server-side dispatch exception for ${currentVendorProgress.name}: ${errorMsg}`;
              logType = 'error';
            }

            // Apply final status to row
            const postProcessVendors = [...updatedVendors];
            postProcessVendors[nextPendingIndex] = {
              ...currentVendorProgress,
              status: finalStatus,
              sentAt: new Date().toISOString(),
              errorReason: errorMsg || undefined
            };

            const stats = {
              pending: postProcessVendors.filter(v => v.status === 'Pending').length,
              sending: 0,
              sent: postProcessVendors.filter(v => v.status === 'Sent').length,
              failed: postProcessVendors.filter(v => v.status === 'Failed').length,
              skipped: postProcessVendors.filter(v => v.status === 'Skipped').length,
              alreadySent: postProcessVendors.filter(v => v.status === 'Already Sent').length
            };

            onCampaignStatusChange('Running', stats, postProcessVendors);
            setFeedLogs(prev => [
              {
                id: String(Date.now() + Math.random()),
                time: new Date().toLocaleTimeString(),
                text: logText,
                type: logType
              },
              ...prev
            ]);
            addSystemLog('Background Auto-Send', `Backend dispatched message to ${currentVendorProgress.name} (${formattedPhone}). Status: ${finalStatus}`);
          };

          triggerBackendAutoDispatch();
        } else if (dispatchModeRef.current === 'popup-manual') {
          // 💬 Standard WhatsApp Web sequence mode (Requires manual click)
          finalStatus = 'Sent';
          const waUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(currentVendorProgress.generatedMessage)}`;
          window.open(waUrl, '_blank');
          logText = `✅ Opened WhatsApp Web popup tab to send to [${currentVendorProgress.name}] | ${formattedPhone}. Please click Send inside WhatsApp Web.`;
          logType = 'success';

          // Apply final status to row
          updatedVendors[nextPendingIndex] = {
            ...currentVendorProgress,
            status: finalStatus,
            sentAt: new Date().toISOString(),
            errorReason: errorMsg || undefined
          };

          // Recalculate quick counts
          const stats = {
            pending: updatedVendors.filter(v => v.status === 'Pending').length,
            sending: 0,
            sent: updatedVendors.filter(v => v.status === 'Sent').length,
            failed: updatedVendors.filter(v => v.status === 'Failed').length,
            skipped: updatedVendors.filter(v => v.status === 'Skipped').length,
            alreadySent: updatedVendors.filter(v => v.status === 'Already Sent').length
          };

          onCampaignStatusChange('Running', stats, updatedVendors);

          setFeedLogs(prev => [
            {
              id: String(Date.now() + Math.random()),
              time: new Date().toLocaleTimeString(),
              text: logText,
              type: logType
            },
            ...prev
          ]);
        } else {
          // 🧪 Local Simulation Mode (Offline Sandboxed run)
          finalStatus = 'Sent';
          logText = `🧪 [Simulation] Message successfully prepared for [${currentVendorProgress.name}] | ${currentVendorProgress.phone} (No dispatch)`;
          logType = 'success';

          // Apply final status to row
          updatedVendors[nextPendingIndex] = {
            ...currentVendorProgress,
            status: finalStatus,
            sentAt: new Date().toISOString(),
            errorReason: errorMsg || undefined
          };

          // Recalculate quick counts
          const stats = {
            pending: updatedVendors.filter(v => v.status === 'Pending').length,
            sending: 0,
            sent: updatedVendors.filter(v => v.status === 'Sent').length,
            failed: updatedVendors.filter(v => v.status === 'Failed').length,
            skipped: updatedVendors.filter(v => v.status === 'Skipped').length,
            alreadySent: updatedVendors.filter(v => v.status === 'Already Sent').length
          };

          onCampaignStatusChange('Running', stats, updatedVendors);

          setFeedLogs(prev => [
            {
              id: String(Date.now() + Math.random()),
              time: new Date().toLocaleTimeString(),
              text: logText,
              type: logType
            },
            ...prev
          ]);
        }

        if (soundEnabled && finalStatus === 'Sent') {
          try {
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = context.createOscillator();
            const gain = context.createGain();
            osc.connect(gain);
            gain.connect(context.destination);
            osc.frequency.setValueAtTime(650, context.currentTime);
            gain.gain.setValueAtTime(0.01, context.currentTime);
            osc.start();
            osc.stop(context.currentTime + 0.06);
          } catch (e) {}
        }

      }, 400);

    }, intervalTime);

    return () => clearInterval(timer);
  }, [activeCampaign, onCampaignStatusChange, allVendors, soundEnabled, settings]);

  // Check duplicate rules
  const checkIsDuplicate = (vendorId: string, vendorsList: Vendor[]) => {
    const targetVendor = vendorsList.find(v => v.id === vendorId);
    if (!targetVendor || !targetVendor.lastMessageDate) return false;
    
    // Check if they received any message within the last 7 days (weekly safeguard check)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const lastSentTime = new Date(targetVendor.lastMessageDate).getTime();
    return lastSentTime > sevenDaysAgo;
  };

  const handlePause = () => {
    if (!activeCampaign) return;
    onCampaignStatusChange('Paused');
    addSystemLog('Campaign Paused', `Transmission queue paused for "${activeCampaign.name}".`);
    addNotification('Campaign Paused', `Transmission for "${activeCampaign.name}" has been paused.`, 'warning');
  };

  const handleResume = () => {
    if (!activeCampaign) return;
    onCampaignStatusChange('Running');
    addSystemLog('Campaign Resumed', `Transmission queue resumed for "${activeCampaign.name}".`);
    addNotification('Campaign Resumed', `Dispatching resumed for "${activeCampaign.name}".`, 'info');
  };

  const handleStop = () => {
    if (!activeCampaign) return;
    if (confirm('Are you absolutely certain you want to cancel this campaign? Pending messages will be discarded.')) {
      onCampaignStatusChange('Cancelled');
      addSystemLog('Campaign Cancelled', `Campaign "${activeCampaign.name}" was cancelled by operator.`);
      addNotification('Campaign Cancelled', `Campaign queue discarded for "${activeCampaign.name}".`, 'error');
    }
  };

  // Filter vendor list
  const getFilteredVendors = () => {
    if (!activeCampaign || !activeCampaign.vendors) return [];
    return activeCampaign.vendors.filter(v => 
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.phone.includes(searchTerm) ||
      v.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Calc remaining estimate
  const getEstimatedRemainingMinutes = () => {
    if (!activeCampaign || activeCampaign.status !== 'Running') return 0;
    const pendingCount = activeCampaign.stats.pending;
    return Math.ceil((pendingCount * 2.4) / 60);
  };

  const filteredQueue = getFilteredVendors();

  return (
    <div className="space-y-6">
      {/* Upper Active Header Status bar */}
      <div className="bg-white rounded-lg border border-slate-100 shadow-xs p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className={`w-3.5 h-3.5 rounded-full block border-2 border-white ${
              activeCampaign?.status === 'Running' ? 'bg-emerald-500 animate-pulse' :
              activeCampaign?.status === 'Paused' ? 'bg-amber-500' : 'bg-slate-300'
            }`}></span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase">Active Dispatch Control</span>
            <h3 className="font-extrabold text-slate-800 text-sm truncate max-w-[280px]">
              {activeCampaign ? activeCampaign.name : 'System Idle (No active campaign)'}
            </h3>
          </div>
        </div>

        {activeCampaign && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                soundEnabled ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title="Toggle audio feedback"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{soundEnabled ? 'Audio On' : 'Audio Off'}</span>
            </button>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl">
              <span className="text-[10px] font-bold text-slate-400 font-mono px-2 uppercase">Engine:</span>
              <select
                value={dispatchMode}
                onChange={(e) => {
                  const newMode = e.target.value as any;
                  setDispatchMode(newMode);
                  addSystemLog('Dispatch Mode Updated', `Switched active campaign dispatcher engine to: ${newMode}`);
                  addNotification('Dispatch Mode Changed', `System will now run campaigns in "${newMode === 'backend-auto' ? 'Meta Cloud API (Automated)' : newMode === 'popup-manual' ? 'WhatsApp Web (Direct Demo Mode)' : 'Local Offline Simulation'}" mode.`, 'info');
                }}
                className="bg-white border border-slate-200 text-xs font-bold rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-slate-700 font-mono"
              >
                <option value="popup-manual">⚡ WhatsApp Web (Direct Demo Mode)</option>
                <option value="backend-auto">🤖 Meta Cloud API (Automated Gateway)</option>
                <option value="simulation">🧪 Local Simulation (Offline Demo)</option>
              </select>
            </div>

            {activeCampaign.status === 'Running' && (
              <button
                onClick={handlePause}
                className="bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100/75 text-xs font-bold px-3.5 py-1.8 rounded-xl flex items-center gap-1 transition-all"
              >
                <Pause className="w-3.5 h-3.5" />
                Pause Queue
              </button>
            )}

            {activeCampaign.status === 'Paused' && (
              <button
                onClick={handleResume}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-1.8 rounded-xl flex items-center gap-1 transition-all"
              >
                <Play className="w-3.5 h-3.5" />
                Resume Queue
              </button>
            )}

            {(activeCampaign.status === 'Running' || activeCampaign.status === 'Paused') && (
              <button
                onClick={handleStop}
                className="bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100/75 text-xs font-bold px-3.5 py-1.8 rounded-xl flex items-center gap-1 transition-all"
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancel Session
              </button>
            )}
          </div>
        )}
      </div>

      {activeCampaign && activeCampaign.status === 'Pending Approval' ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs max-w-2xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto border border-amber-100">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-extrabold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Awaiting Administrator Authorization
            </span>
            <h3 className="text-sm font-bold text-slate-800 pt-1">Campaign Queue Held</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-md mx-auto">
              The campaign <strong className="font-mono text-slate-700">"{activeCampaign.name}"</strong> has been successfully staged and is currently held in security validation mode.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed text-left max-w-md mx-auto space-y-2">
            <div className="font-bold text-[10px] uppercase font-mono tracking-wider text-slate-700">Required Next Steps:</div>
            <div>• An authorized administrator must log in using the secure key icon in the navigation bar footer.</div>
            <div>• Open the <strong>Review Queue</strong> panel that appears in the sidebar.</div>
            <div>• Review recipient messages and click <strong>Authorize & Deploy</strong> to initiate transmission.</div>
          </div>
          <p className="text-[10px] text-slate-400 italic">
            This security safeguard prevents accidental bulk dispatches and protects account reputation.
          </p>
        </div>
      ) : activeCampaign ? (
        <>
          {/* WhatsApp Transmission Guard Informational Banner */}
          {dispatchMode === 'backend-auto' && !settings.gatewayEnabled ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-950 flex gap-4 shadow-sm animate-pulse">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0 border border-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h4 className="font-extrabold text-xs text-amber-900 flex items-center gap-1.5 uppercase tracking-wide font-mono">
                  ⚠️ Background Send in Simulation Mode (No Real WhatsApp Delivered Yet!)
                </h4>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  You are currently running the campaign with <strong>Background Auto-Send (No Tabs)</strong> mode, but you have <strong>not turned on a real API Gateway</strong>. To protect your dashboard, the system is performing a <strong>Sandbox Test Run</strong>.
                </p>
                <div className="pt-2 border-t border-amber-200/40 text-[11px] space-y-1 text-amber-850">
                  <div className="font-bold text-[10px] uppercase font-mono tracking-wider text-amber-900">How to send real messages:</div>
                  <div className="flex items-start gap-1">
                    <span className="font-bold text-amber-950 mr-1">•</span>
                    <span><strong>Option A (Free & Easiest):</strong> Switch the Mode selector above to <strong>"💬 WhatsApp Web Popups (Manual)"</strong>. This opens real browser tabs so you can send using your logged-in WhatsApp session instantly for free.</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="font-bold text-amber-950 mr-1">•</span>
                    <span><strong>Option B (100% Automated Background):</strong> Go to the <strong>Settings tab</strong>, turn on the <strong>Automated Background WhatsApp Dispatcher Gateway</strong>, and enter your WhatsApp API keys (e.g. Twilio, Green-API, UltraMsg, or a self-hosted client).</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={`${
              dispatchMode === 'backend-auto' ? 'bg-blue-50 border-blue-200/50 text-blue-950' :
              dispatchMode === 'popup-manual' ? 'bg-amber-50 border-amber-200/50 text-amber-950' :
              'bg-slate-50 border-slate-200/50 text-slate-950'
            } rounded-xl p-4 flex gap-3 shadow-xs`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                dispatchMode === 'backend-auto' ? 'bg-blue-100' :
                dispatchMode === 'popup-manual' ? 'bg-amber-100' :
                'bg-slate-100'
              }`}>
                <Send className={`w-4 h-4 ${
                  dispatchMode === 'backend-auto' ? 'text-blue-600 animate-pulse' :
                  dispatchMode === 'popup-manual' ? 'text-amber-600' :
                  'text-slate-600'
                }`} />
              </div>
              <div className="space-y-1">
                <h4 className={`font-bold text-xs ${
                  dispatchMode === 'backend-auto' ? 'text-blue-900' :
                  dispatchMode === 'popup-manual' ? 'text-amber-900' :
                  'text-slate-900'
                } flex items-center gap-1.5`}>
                  {dispatchMode === 'backend-auto' && '🚀 Background Auto-Send (100% Automated, Tabs Closed ✅)'}
                  {dispatchMode === 'popup-manual' && '💬 WhatsApp Web Popups (Requires Manual Clicks ⚠️)'}
                  {dispatchMode === 'simulation' && '🧪 Local Campaign Simulation (Offline Sandbox 🧪)'}
                </h4>
                <p className={`text-[11px] leading-relaxed ${
                  dispatchMode === 'backend-auto' ? 'text-blue-800' :
                  dispatchMode === 'popup-manual' ? 'text-amber-800' :
                  'text-slate-800'
                }`}>
                  {dispatchMode === 'backend-auto' && (
                    <>
                      Messages are processed and sent <span className="font-extrabold">completely in the background</span> without opening any tabs or browser popups! This uses your active background microservice integration (Url: <span className="font-mono text-xs">{settings.gatewayUrl}</span>).
                    </>
                  )}
                  {dispatchMode === 'popup-manual' && (
                    <>
                      The platform opens a secure WhatsApp Web window in a separate tab for each vendor with prepopulated messages. <span className="font-extrabold">You will need to click 'Send' inside WhatsApp for each message.</span>
                    </>
                  )}
                  {dispatchMode === 'simulation' && (
                    <>
                      A dry-run test mode that processes the entire queue inside the local sandbox. It tests duplicates, validates formats, and records histories without dispatching real messages.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Dashboard Progress Panel */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-white border border-slate-100 rounded-xl p-4 text-center">
              <div className="text-xl font-black text-slate-800">{activeCampaign.vendorCount}</div>
              <div className="text-[9px] text-slate-400 font-bold uppercase font-mono">Total Vendors</div>
            </div>
            <div className="bg-white border border-slate-100 rounded-xl p-4 text-center">
              <div className="text-xl font-black text-slate-500 flex items-center justify-center gap-1">
                {activeCampaign.status === 'Running' && <Loader2 className="w-4 h-4 animate-spin text-slate-400 shrink-0" />}
                {activeCampaign.stats.pending}
              </div>
              <div className="text-[9px] text-slate-400 font-bold uppercase font-mono">Pending</div>
            </div>
            <div className="bg-white border border-slate-100 rounded-xl p-4 text-center">
              <div className="text-xl font-black text-blue-600 animate-pulse">{activeCampaign.stats.sending}</div>
              <div className="text-[9px] text-slate-400 font-bold uppercase font-mono">Sending</div>
            </div>
            <div className="bg-white border border-slate-100 rounded-xl p-4 text-center bg-emerald-50/10">
              <div className="text-xl font-black text-emerald-600">{activeCampaign.stats.sent}</div>
              <div className="text-[9px] text-slate-400 font-bold uppercase font-mono text-emerald-600/70">Sent</div>
            </div>
            <div className="bg-white border border-slate-100 rounded-xl p-4 text-center bg-rose-50/10">
              <div className="text-xl font-black text-rose-600">{activeCampaign.stats.failed}</div>
              <div className="text-[9px] text-slate-400 font-bold uppercase font-mono text-rose-600/70 font-semibold">Failed</div>
            </div>
            <div className="bg-white border border-slate-100 rounded-xl p-4 text-center bg-violet-50/10">
              <div className="text-xl font-black text-violet-600">{activeCampaign.stats.alreadySent}</div>
              <div className="text-[9px] text-slate-400 font-bold uppercase font-mono text-violet-600/70">Already Sent</div>
            </div>
            <div className="bg-white border border-slate-100 rounded-xl p-4 text-center bg-amber-50/10">
              <div className="text-xl font-black text-amber-600">
                {(((activeCampaign.stats.sent) / (activeCampaign.vendorCount - activeCampaign.stats.alreadySent || 1)) * 100).toFixed(0)}%
              </div>
              <div className="text-[9px] text-slate-400 font-bold uppercase font-mono text-amber-600/70 font-semibold">Success rate</div>
            </div>
          </div>

          {/* Fluid Progress Indicators */}
          <div className="bg-white border border-slate-100 rounded-lg p-5 space-y-3.5 shadow-2xs">
            <div className="flex justify-between items-center text-xs text-slate-600 font-bold font-mono">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>Estimated Queue Duration: ~{getEstimatedRemainingMinutes()} mins remaining</span>
              </div>
              <span>
                Progress: {(((activeCampaign.vendorCount - activeCampaign.stats.pending) / activeCampaign.vendorCount) * 100).toFixed(0)}% Complete
              </span>
            </div>

            <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex">
              {/* Sent width */}
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${(activeCampaign.stats.sent / activeCampaign.vendorCount) * 100}%` }}
                title="Sent successfully"
              ></div>
              {/* Already Sent width */}
              <div
                className="bg-violet-500 h-full transition-all duration-300"
                style={{ width: `${(activeCampaign.stats.alreadySent / activeCampaign.vendorCount) * 100}%` }}
                title="Duplicate Skips"
              ></div>
              {/* Failed width */}
              <div
                className="bg-rose-500 h-full transition-all duration-300"
                style={{ width: `${(activeCampaign.stats.failed / activeCampaign.vendorCount) * 100}%` }}
                title="Failures"
              ></div>
            </div>

            <div className="flex flex-wrap gap-4 pt-1 text-[10px] text-slate-500 font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 block"></span>
                <span>Sent ({activeCampaign.stats.sent})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-violet-500 block"></span>
                <span>Duplicates Safe ({activeCampaign.stats.alreadySent})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-rose-500 block"></span>
                <span>Transmission Failures ({activeCampaign.stats.failed})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-200 block"></span>
                <span>Queued ({activeCampaign.stats.pending})</span>
              </div>
            </div>
          </div>

          {/* Lower layout grids: Logs & Recipient tables */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Terminal Live logs */}
            <div className="lg:col-span-1 bg-slate-950 text-slate-200 p-4 rounded-lg font-mono text-xs flex flex-col justify-between h-[500px]">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <div className="flex items-center gap-1.5 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>Interactive Terminal feed</span>
                </div>
                <button
                  onClick={() => setFeedLogs([])}
                  className="text-[9px] text-slate-500 hover:text-white"
                >
                  Clear Feed
                </button>
              </div>

              {/* Feed logs container */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 select-none">
                {feedLogs.length === 0 ? (
                  <p className="text-slate-600 italic text-center pt-24 text-[11px]">Awaiting feed triggers...</p>
                ) : (
                  feedLogs.map(log => (
                    <div key={log.id} className="leading-relaxed">
                      <span className="text-slate-500">[{log.time}]</span>{' '}
                      <span className={
                        log.type === 'success' ? 'text-emerald-400' :
                        log.type === 'error' ? 'text-rose-400' :
                        log.type === 'skip' ? 'text-violet-400 font-semibold' : 'text-slate-300'
                      }>
                        {log.text}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recipient queue data-grid */}
            <div className="lg:col-span-2 bg-white rounded-lg border border-slate-100 p-5 space-y-4 flex flex-col justify-between h-[500px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide font-mono">Active Recipient Queue Grid</h4>
                  <button
                    type="button"
                    onClick={() => {
                      const nextPending = filteredQueue.find(q => q.status === 'Pending' || q.status === 'Failed');
                      if (nextPending) {
                        const formatted = formatPhoneForWhatsApp(nextPending.phone);
                        const waUrl = `https://api.whatsapp.com/send?phone=${formatted}&text=${encodeURIComponent(nextPending.generatedMessage)}`;
                        window.open(waUrl, '_blank');
                        addNotification('Demo Dispatch', `Opened WhatsApp Web window for ${nextPending.name}`, 'success');
                      } else {
                        addNotification('Queue Complete', 'All current recipients have already been dispatched.', 'info');
                      }
                    }}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold font-mono transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                    title="Opens WhatsApp Web pre-filled tab for the next recipient (Best for live demos!)"
                  >
                    <ExternalLink className="w-3 h-3 text-emerald-600" />
                    <span>⚡ Demo 1-Click Send Next</span>
                  </button>
                </div>
                
                {/* Search bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 w-full sm:w-48 text-[11px] border border-slate-200 rounded-lg focus:outline-blue-500 bg-slate-50/50"
                    placeholder="Search queue records..."
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase font-mono text-[9px] border-b border-slate-100">
                      <th className="py-2.5 px-3">Vendor Name</th>
                      <th className="py-2.5 px-3">Contact</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3 text-right">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredQueue.map(vq => {
                      const formattedPhone = formatPhoneForWhatsApp(vq.phone);
                      const waUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(vq.generatedMessage)}`;

                      return (
                        <tr key={vq.vendorId} className="hover:bg-slate-50/40">
                          <td className="py-2.5 px-3 font-semibold text-slate-800 truncate max-w-[150px]">{vq.name}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-500 text-[10px]">{vq.phone}</td>
                          <td className="py-2.5 px-3">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              vq.status === 'Sent' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                              vq.status === 'Failed' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                              vq.status === 'Already Sent' ? 'bg-violet-50 text-violet-600 border border-violet-100' :
                              vq.status === 'Sending' ? 'bg-blue-50 text-blue-600 border border-blue-100 animate-pulse' :
                              'bg-slate-50 text-slate-500 border'
                            }`}>
                              {vq.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.04] text-white font-extrabold px-2.5 py-1 rounded-lg text-[10px] transition-all duration-200 select-none shadow-xs border border-emerald-500/10"
                              title="Actually load and dispatch this personalized notification via WhatsApp"
                            >
                              <Send className="w-2.5 h-2.5 text-emerald-100" />
                              <span>Send</span>
                              <ExternalLink className="w-2.5 h-2.5 text-emerald-200" />
                            </a>
                          </td>
                          <td className="py-2.5 px-3 text-right text-[10px] font-mono text-rose-600 truncate max-w-[120px]">
                            {vq.errorReason || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg border border-slate-100 shadow-xs p-12 text-center space-y-3">
          <History className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-800 text-sm">No Active Transmission Currently Running</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            There are no campaigns executing at the moment. Return to the deployment wizard to upload a spreadsheet, draft a message template, and launch a campaign session.
          </p>
        </div>
      )}
    </div>
  );
}
