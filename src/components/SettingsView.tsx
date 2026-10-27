import React, { useState } from 'react';
import { Settings, ShieldAlert, Save, RefreshCw, Sliders, Clock, HelpCircle, Building, Send, ExternalLink } from 'lucide-react';
import { SystemSettings } from '../types';

interface SettingsViewProps {
  settings: SystemSettings;
  onUpdateSettings: (settings: SystemSettings) => void;
  userRole: 'Administrator' | 'Staff User';
  addSystemLog: (action: string, details: string) => void;
  addNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export default function SettingsView({
  settings,
  onUpdateSettings,
  userRole,
  addSystemLog,
  addNotification
}: SettingsViewProps) {
  const isLocked = userRole !== 'Administrator';

  // Form states
  const [excelName, setExcelName] = useState(settings.defaultExcelFileName);
  const [template, setTemplate] = useState(settings.defaultTemplate);
  const [hoursStart, setHoursStart] = useState(settings.workingHoursStart);
  const [hoursEnd, setHoursEnd] = useState(settings.workingHoursEnd);
  const [limit, setLimit] = useState(settings.campaignLimitsPerDay);
  const [delay, setDelay] = useState(settings.messageDelaySeconds);
  const [org, setOrg] = useState(settings.orgName);
  const [phone, setPhone] = useState(settings.orgWhatsAppNumber);

  // Gateway states
  const [gatewayEnabled, setGatewayEnabled] = useState(settings.gatewayEnabled ?? true);
  const [gatewayType, setGatewayType] = useState(settings.gatewayType ?? 'custom-api');
  const [gatewayUrl, setGatewayUrl] = useState(settings.gatewayUrl ?? 'https://graph.facebook.com/v19.0/1178965715308814/messages');
  const [gatewayMethod, setGatewayMethod] = useState(settings.gatewayMethod ?? 'POST');
  const [gatewayHeaders, setGatewayHeaders] = useState(settings.gatewayHeaders ?? `{\n  "Content-Type": "application/json",\n  "Authorization": "Bearer EAAZAIakPCWfQBSOnhVTRiWK82fnwQX359PRSjbRAKGt05D3H8bZBE08AZBqETZBDDJCAKe58hppyOZAZADDpDoyAMHnWDtnOZAuWtSc6FggX7g7CGcc21BQfrbcunZBb6adJvfsurvmML7cg5sXOPV8NeRMOFpCFirxkdEG9JwHQlZAzrcO8gZAOpkxEk6lYAaUKqaEYVdSqe39IdXgNOeZBVFVSM6ttVg39NA3hZCluc7RxoC5tcr9nIeZBTFuBE5WqSChtn9Msv2HqzZBeLPsZAyfo4ZCnYgZDZD"\n}`);
  const [gatewayBodyTemplate, setGatewayBodyTemplate] = useState(settings.gatewayBodyTemplate ?? '{\n  "messaging_product": "whatsapp",\n  "to": "{{phone}}",\n  "type": "text",\n  "text": {\n    "body": "{{message}}"\n  }\n}');

  // Meta API Live Test State
  const [testPhone, setTestPhone] = useState('917990711567');
  const [isTestingMetaApi, setIsTestingMetaApi] = useState(false);
  const [testMetaResult, setTestMetaResult] = useState<{ success: boolean; status?: number; data?: any; error?: string } | null>(null);

  const applyPreset = (type: 'universal' | 'twilio' | 'meta' | 'meta-template') => {
    if (isLocked) return;
    const metaToken = 'EAAZAIakPCWfQBSOnhVTRiWK82fnwQX359PRSjbRAKGt05D3H8bZBE08AZBqETZBDDJCAKe58hppyOZAZADDpDoyAMHnWDtnOZAuWtSc6FggX7g7CGcc21BQfrbcunZBb6adJvfsurvmML7cg5sXOPV8NeRMOFpCFirxkdEG9JwHQlZAzrcO8gZAOpkxEk6lYAaUKqaEYVdSqe39IdXgNOeZBVFVSM6ttVg39NA3hZCluc7RxoC5tcr9nIeZBTFuBE5WqSChtn9Msv2HqzZBeLPsZAyfo4ZCnYgZDZD';

    if (type === 'universal') {
      setGatewayUrl('https://api.whatsapp-gateway.com/send');
      setGatewayMethod('POST');
      setGatewayHeaders('{\n  "Content-Type": "application/json",\n  "Authorization": "Bearer YOUR_API_TOKEN_HERE"\n}');
      setGatewayBodyTemplate('{\n  "phone": "{{phone}}",\n  "message": "{{message}}"\n}');
      addNotification('Preset Loaded', 'Universal HTTP POST API Gateway template loaded.', 'info');
    } else if (type === 'twilio') {
      setGatewayUrl('https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json');
      setGatewayMethod('POST');
      setGatewayHeaders('{\n  "Content-Type": "application/x-www-form-urlencoded",\n  "Authorization": "Basic YOUR_BASE64_SID_AND_AUTH_TOKEN"\n}');
      setGatewayBodyTemplate('To=whatsapp%3A%2B{{phone}}&From=whatsapp%3A%2B14155238886&Body={{message}}');
      addNotification('Preset Loaded', 'Twilio WhatsApp API Gateway template loaded.', 'info');
    } else if (type === 'meta') {
      setGatewayUrl('https://graph.facebook.com/v19.0/1178965715308814/messages');
      setGatewayMethod('POST');
      setGatewayHeaders(`{\n  "Content-Type": "application/json",\n  "Authorization": "Bearer ${metaToken}"\n}`);
      setGatewayBodyTemplate('{\n  "messaging_product": "whatsapp",\n  "to": "{{phone}}",\n  "type": "text",\n  "text": {\n    "body": "{{message}}"\n  }\n}');
      addNotification('Preset Loaded', 'Meta WhatsApp Cloud API (Free-Form Text) loaded.', 'info');
    } else if (type === 'meta-template') {
      setGatewayUrl('https://graph.facebook.com/v19.0/1178965715308814/messages');
      setGatewayMethod('POST');
      setGatewayHeaders(`{\n  "Content-Type": "application/json",\n  "Authorization": "Bearer ${metaToken}"\n}`);
      setGatewayBodyTemplate('{\n  "messaging_product": "whatsapp",\n  "to": "{{phone}}",\n  "type": "template",\n  "template": {\n    "name": "hello_world",\n    "language": {\n      "code": "en_US"\n    }\n  }\n}');
      addNotification('Preset Loaded', 'Meta Template Message (hello_world) loaded.', 'info');
    }
  };

  const handleTestMetaApi = async () => {
    setIsTestingMetaApi(true);
    setTestMetaResult(null);

    let formatted = testPhone.replace(/[^0-9]/g, '');
    if (formatted.startsWith('0')) formatted = formatted.substring(1);
    if (formatted.length === 10) formatted = '91' + formatted;

    try {
      const res = await fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formatted,
          message: 'Test message from GOLEAP 360 WhatsApp Automation Platform',
          gatewayEnabled: true,
          gatewayType,
          gatewayUrl,
          gatewayMethod,
          gatewayHeaders,
          gatewayBodyTemplate
        })
      });

      const data = await res.json();
      setIsTestingMetaApi(false);
      setTestMetaResult({
        success: res.ok && data.success,
        status: res.status,
        data: data.data ? (typeof data.data === 'string' ? JSON.parse(data.data) : data.data) : data,
        error: data.error
      });

      if (res.ok && data.success) {
        addNotification('Meta API Success', `Message dispatched to ${formatted}! Check Meta response details below.`, 'success');
        addSystemLog('Meta API Test', `Dispatched Meta API request to ${formatted}. Status: ${res.status}`);
      } else {
        addNotification('Meta API Error', data.error || 'Meta API returned error', 'error');
        addSystemLog('Meta API Test Failed', `Meta API test to ${formatted} failed: ${data.error}`);
      }
    } catch (err: any) {
      setIsTestingMetaApi(false);
      setTestMetaResult({
        success: false,
        error: err.message || 'Network exception'
      });
      addNotification('Test Request Exception', err.message || 'Connection failed', 'error');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    // Validate headers are correct JSON if configured
    if (gatewayType === 'custom-api' && gatewayHeaders.trim()) {
      try {
        JSON.parse(gatewayHeaders);
      } catch (err) {
        addNotification('Validation Error', 'Custom Headers must be a valid JSON format.', 'error');
        return;
      }
    }

    const updated: SystemSettings = {
      defaultExcelFileName: excelName,
      defaultTemplate: template,
      workingHoursStart: hoursStart,
      workingHoursEnd: hoursEnd,
      campaignLimitsPerDay: Number(limit) || 500,
      messageDelaySeconds: Number(delay) || 2,
      orgName: org,
      orgWhatsAppNumber: phone,
      gatewayEnabled,
      gatewayType,
      gatewayUrl,
      gatewayMethod,
      gatewayHeaders,
      gatewayBodyTemplate
    };

    onUpdateSettings(updated);
    addSystemLog('Settings Modified', 'Adjusted global system parameters and dispatch delays.');
    addNotification('Settings Saved', 'System configurations saved successfully.', 'success');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Locked message for Staff */}
      {isLocked && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg flex gap-3.5 animate-fadeIn shadow-2xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold">Permissions Locked</h4>
            <p className="text-[10px] text-amber-800 leading-relaxed mt-0.5">
              You are currently viewing settings under the <strong>Staff User</strong> credentials. Making operational or delay alterations is restricted to <strong>Administrators</strong>. You can simulate role modifications via the toggle button inside the top panel.
            </p>
          </div>
        </div>
      )}

      {/* Main Settings board */}
      <div className="bg-white rounded-lg border border-slate-100 shadow-xs p-6 space-y-6">
        <div className="space-y-1 border-b border-slate-50 pb-3">
          <h3 className="font-extrabold text-slate-800 text-sm">Corporate Preferences & Delay SafeBounds</h3>
          <p className="text-[11px] text-slate-500">Configure corporate WhatsApp parameters, sending intervals, and validation fallbacks.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Org details section */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <Building className="w-4 h-4 text-slate-400" />
              Corporate Profile Details
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold">Corporate Legal Name</label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={org}
                  onChange={e => setOrg(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/20 focus:outline-blue-500 disabled:opacity-75"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold">Dispatch WhatsApp Phone Number</label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/20 focus:outline-blue-500 font-mono disabled:opacity-75"
                />
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-[10px] text-slate-400">Configure your number to send tests or alerts.</span>
                  <a
                    href={`https://api.whatsapp.com/send?phone=${phone.replace(/[^0-9]/g, '')}&text=${encodeURIComponent('Hello! This is a test message from your Vendor Performance WhatsApp Dispatcher platform to verify that your sender/receiver number configuration works correctly.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                    title="Open WhatsApp with a test message to this number"
                  >
                    <Send className="w-2.5 h-2.5" />
                    <span>Send Test Message</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Boundaries configuration */}
          <div className="space-y-3.5 pt-4 border-t border-slate-50">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-slate-400" />
              Limits & Delays
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold">Max Daily Campaigns Limit</label>
                <input
                  type="number"
                  disabled={isLocked}
                  value={limit}
                  onChange={e => setLimit(Number(e.target.value))}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/20 focus:outline-blue-500 disabled:opacity-75"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold">Delay Between Dispatches (seconds)</label>
                <input
                  type="number"
                  disabled={isLocked}
                  value={delay}
                  onChange={e => setDelay(Number(e.target.value))}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/20 focus:outline-blue-500 disabled:opacity-75"
                />
              </div>
            </div>
          </div>

          {/* Time controls hours */}
          <div className="space-y-3.5 pt-4 border-t border-slate-50">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Anti-Spam Time Window Controls (Sleep hours protection)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold">Earliest Dispatch Hour (Start window)</label>
                <input
                  type="time"
                  disabled={isLocked}
                  value={hoursStart}
                  onChange={e => setHoursStart(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/20 focus:outline-blue-500 disabled:opacity-75"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-semibold">Latest Dispatch Hour (Stop window)</label>
                <input
                  type="time"
                  disabled={isLocked}
                  value={hoursEnd}
                  onChange={e => setHoursEnd(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/20 focus:outline-blue-500 disabled:opacity-75"
                />
              </div>
            </div>
          </div>

          {/* Automated WhatsApp Gateway */}
          <div className="space-y-4 pt-4 border-t border-slate-50">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-600 animate-pulse" />
                  Automated Background WhatsApp Dispatcher Gateway
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Configure 100% automated background sending with zero manual tabs or clicking</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">API Gateway Mode</span>
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => {
                    setGatewayEnabled(!gatewayEnabled);
                    if (!gatewayEnabled) {
                      setGatewayType('custom-api');
                    } else {
                      setGatewayType('whatsapp-web');
                    }
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    gatewayEnabled ? 'bg-emerald-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      gatewayEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100/50">
              By default, this application uses standard <strong>WhatsApp Web Links</strong> to open individual chat tabs for manual clicking. 
              Turn on <strong>Background API Gateway Mode</strong> to seamlessly send automated alerts directly in the background 
              to all your vendors at once without opening any browser tabs!
            </p>

            {gatewayEnabled && (
              <div className="space-y-4 p-4 border border-slate-100 rounded-xl bg-slate-50/20 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 font-semibold">Gateway Integration Type</label>
                    <select
                      disabled={isLocked}
                      value={gatewayType}
                      onChange={e => setGatewayType(e.target.value as any)}
                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-blue-500"
                    >
                      <option value="whatsapp-web">WhatsApp Web (Manual tab sequence - Free)</option>
                      <option value="custom-api">Custom HTTP API Gateway (Fully automated background sending)</option>
                    </select>
                  </div>

                  {gatewayType === 'custom-api' && (
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-500 font-semibold">Load API Presets (Auto-configure)</label>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => applyPreset('universal')}
                          className="bg-white hover:bg-slate-50 border border-slate-200 text-[10px] font-bold px-2 py-1.5 rounded-lg text-slate-700 grow cursor-pointer"
                        >
                          Universal POST
                        </button>
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => applyPreset('twilio')}
                          className="bg-white hover:bg-slate-50 border border-slate-200 text-[10px] font-bold px-2 py-1.5 rounded-lg text-slate-700 grow cursor-pointer"
                        >
                          Twilio API
                        </button>
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => applyPreset('meta')}
                          className="bg-white hover:bg-slate-50 border border-slate-200 text-[10px] font-bold px-2 py-1.5 rounded-lg text-slate-700 grow cursor-pointer"
                        >
                          Meta Text
                        </button>
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => applyPreset('meta-template')}
                          className="bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[10px] font-bold px-2 py-1.5 rounded-lg text-purple-900 grow cursor-pointer"
                        >
                          Meta Template (hello_world)
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {gatewayType === 'custom-api' && (
                  <div className="space-y-3.5 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-1 space-y-1">
                        <label className="text-[11px] text-slate-500 font-semibold">HTTP Method</label>
                        <select
                          disabled={isLocked}
                          value={gatewayMethod}
                          onChange={e => setGatewayMethod(e.target.value as any)}
                          className="w-full text-xs border border-slate-200 rounded-xl px-2 py-2 bg-white focus:outline-blue-500"
                        >
                          <option value="POST">POST</option>
                          <option value="GET">GET</option>
                        </select>
                      </div>

                      <div className="md:col-span-3 space-y-1">
                        <label className="text-[11px] text-slate-500 font-semibold">API Gateway HTTP URL</label>
                        <input
                          type="text"
                          disabled={isLocked}
                          value={gatewayUrl}
                          onChange={e => setGatewayUrl(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-blue-500 font-mono"
                          placeholder="https://api.my-gateway.com/send"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-500 font-semibold flex items-center justify-between">
                          <span>Custom HTTP Headers (JSON format)</span>
                          <span className="text-[9px] text-slate-400">Valid JSON</span>
                        </label>
                        <textarea
                          disabled={isLocked}
                          value={gatewayHeaders}
                          onChange={e => setGatewayHeaders(e.target.value)}
                          className="w-full h-24 text-[11px] border border-slate-200 rounded-xl p-2.5 bg-white focus:outline-blue-500 font-mono"
                          placeholder='{"Content-Type": "application/json"}'
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-slate-500 font-semibold flex items-center justify-between">
                          <span>HTTP Body Template (Placeholders: {"{{phone}}"}, {"{{message}}"})</span>
                          <span className="text-[9px] text-emerald-600 font-bold">Safe Dynamic Variables</span>
                        </label>
                        <textarea
                          disabled={isLocked}
                          value={gatewayBodyTemplate}
                          onChange={e => setGatewayBodyTemplate(e.target.value)}
                          className="w-full h-24 text-[11px] border border-slate-200 rounded-xl p-2.5 bg-white focus:outline-blue-500 font-mono"
                          placeholder='{"phone": "{{phone}}", "text": "{{message}}"}'
                        />
                      </div>
                    </div>

                    {/* Meta API Live Dispatch Tester & Troubleshooting Guide */}
                    <div className="mt-4 p-4 rounded-xl bg-purple-950 text-white space-y-4 border border-purple-800/60 shadow-lg">
                      <div className="flex items-center justify-between border-b border-purple-800/80 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                          <h5 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                            Meta Cloud API Live Test & Diagnostic Tool
                          </h5>
                        </div>
                        <span className="text-[10px] font-mono bg-purple-900 text-purple-200 px-2 py-0.5 rounded border border-purple-700">
                          GOLEAP 360 (ID: 1178965715308814)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[10px] text-purple-200 font-bold uppercase font-mono">
                            Recipient Test Phone Number (With Country Code)
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={testPhone}
                              onChange={e => setTestPhone(e.target.value)}
                              placeholder="e.g. 917990711567"
                              className="w-full text-xs bg-purple-900/80 border border-purple-700 rounded-xl px-3 py-2 text-white placeholder-purple-400 font-mono focus:outline-none focus:border-purple-400"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleTestMetaApi}
                          disabled={isTestingMetaApi}
                          className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-purple-950 text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {isTestingMetaApi ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Ping Meta Server...
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              Send Live Test Message
                            </>
                          )}
                        </button>
                      </div>

                      {/* Live Test Response Result Output Box */}
                      {testMetaResult && (
                        <div className={`p-3 rounded-xl border text-xs font-mono space-y-1.5 ${
                          testMetaResult.success
                            ? 'bg-emerald-950/90 border-emerald-500/80 text-emerald-200'
                            : 'bg-rose-950/90 border-rose-500/80 text-rose-200'
                        }`}>
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span>
                              {testMetaResult.success ? '✅ Meta API Response: HTTP 200 OK' : `❌ Meta API Error: HTTP ${testMetaResult.status || 'Failed'}`}
                            </span>
                            <span className="text-[9px] text-slate-300">
                              {testMetaResult.success ? 'Message Accepted by Meta' : 'Action Required'}
                            </span>
                          </div>

                          <pre className="text-[10px] bg-black/50 p-2.5 rounded-lg overflow-x-auto text-slate-200 leading-relaxed border border-white/10 max-h-36">
                            {JSON.stringify(testMetaResult.data || testMetaResult.error, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Meta Developer Requirement Explanation Note */}
                      <div className="p-3 bg-purple-900/60 rounded-xl border border-purple-700/60 text-[11px] text-purple-200 space-y-2">
                        <div className="font-bold text-amber-300 flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                          Why Didn't the Message Arrive on Your Phone? Check These 2 Meta Requirements:
                        </div>
                        <ol className="list-decimal list-inside space-y-1.5 text-[10px] text-purple-100 leading-relaxed font-sans">
                          <li>
                            <strong>Meta Sandbox Test Recipient Requirement:</strong> Because your Meta Test Number (<code className="bg-purple-950 px-1 py-0.5 rounded font-mono text-purple-300">+1 555 188-5763</code>) is in Sandbox mode, Meta <u>strictly blocks delivery</u> to any phone number until you manually add it in Meta Developer Console under <strong>WhatsApp → API Setup → "To" Phone Number dropdown → Add phone number</strong> and verify the OTP.
                          </li>
                          <li>
                            <strong>24-Hour Customer Window Rule:</strong> To send free-form text messages without an approved Template, you must first send 1 WhatsApp message from your phone to <code className="bg-purple-950 px-1 py-0.5 rounded font-mono text-purple-300">+1 555 188-5763</code>. Or switch to <strong>Meta Template Mode (<code className="bg-purple-950 px-1 py-0.5 rounded font-mono text-purple-300">hello_world</code>)</strong> above!
                          </li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reusable templates */}
          <div className="space-y-1.5 pt-4 border-t border-slate-50">
            <label className="text-xs font-bold text-slate-800">Global Fallback Message Template</label>
            <textarea
              disabled={isLocked}
              value={template}
              onChange={e => setTemplate(e.target.value)}
              className="w-full h-44 text-xs border border-slate-200 rounded-xl p-3 bg-slate-50/20 focus:outline-blue-500 font-mono disabled:opacity-75"
            />
          </div>

          {/* Save button */}
          {!isLocked && (
            <div className="flex justify-end pt-3 border-t border-slate-50">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shadow-blue-600/15"
              >
                <Save className="w-4 h-4" />
                Commit system modifications
              </button>
            </div>
          )}
        </form>
      </div>

    </div>
  );
}
