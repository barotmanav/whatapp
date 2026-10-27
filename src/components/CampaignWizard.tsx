import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Settings,
  Eye,
  Info,
  Calendar,
  Sparkles,
  ClipboardCheck,
  Phone,
  HelpCircle,
  Save,
  History,
  ChevronDown,
  FileText,
  Database
} from 'lucide-react';
import { Campaign, Vendor, UserAccount, Company } from '../types';
import { DEFAULT_VENDORS, DEFAULT_TEMPLATE, validateVendorExcel } from '../data/defaultVendors';

interface TemplateVersion {
  id: string;
  timestamp: string;
  label: string;
  text: string;
}

const SEED_VERSION_HISTORY: TemplateVersion[] = [
  {
    id: 'v-seed-1',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    label: 'Initial Incentive Draft',
    text: `Hello {{Vendor Name}}! 👋

We are thrilled to share your outstanding progress for this period under the supervision of {{Manager Name}} in the {{Region}} region!

🎯 Your target was: {{Target}}
🚀 Your achievements: {{Achievement}}
🔥 Remaining: {{Remaining}}

Keep up the incredible momentum!
Best regards,
Enterprise Team`
  },
  {
    id: 'v-seed-2',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    label: 'Urgent Reminder Draft',
    text: `Urgent Performance Alert! 🚨

Hello {{Vendor Name}}, we noticed that you have {{Remaining}} remaining on your target of {{Target}}. Under {{Manager Name}}'s guidance, we want to help you cross the finish line!

Please review your performance and reach out to your region manager.

Let's win this together! 🏆`
  },
  {
    id: 'v-seed-3',
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
    label: 'General Announcement Template',
    text: `Dear Partner,

We want to express our gratitude for your continued partnership with Enterprise Logistics.

This is a general announcement regarding system-wide updates and upcoming operational optimizations.

Thank you,
Manav Barot`
  }
];

interface CampaignWizardProps {
  onCampaignCreated: (campaign: Campaign, validatedVendors: Vendor[]) => void;
  userRole: 'Administrator' | 'Company Employee' | 'Staff User';
  currentUser?: UserAccount;
  companies?: Company[];
  vendors?: Vendor[];
  addSystemLog: (action: string, details: string) => void;
  addNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export default function CampaignWizard({
  onCampaignCreated,
  userRole,
  currentUser,
  companies = [],
  vendors = [],
  addSystemLog,
  addNotification
}: CampaignWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Data Source State
  const [dataSourceType, setDataSourceType] = useState<'uploaded' | 'database'>('uploaded');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [excelDataList, setExcelDataList] = useState<any[]>([]);
  const [validationReport, setValidationReport] = useState<any>(validateVendorExcel([]));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userCompany = companies.find(c => c.id === currentUser?.companyId) || companies[0];
  const [selectedDbTable, setSelectedDbTable] = useState<string>(userCompany?.dbConnectedTables?.[0] || 'vendors_master');

  const selectStoredDatabase = (tableName?: string) => {
    const tableToUse = tableName || selectedDbTable;
    setSelectedDbTable(tableToUse);
    const recordsToUse = (vendors && vendors.length > 0) ? vendors : DEFAULT_VENDORS;
    setDataSourceType('database');
    setUploadedFileName(`DB Table: ${tableToUse}`);
    const report = validateVendorExcel(recordsToUse);
    setValidationReport(report);
    addNotification('Company Database Selected', `Loaded records from table "${tableToUse}" (${userCompany?.dbProvider || 'Supabase'}).`, 'info');
    addSystemLog('Data Source Selected', `Switched campaign target source to Company Database (${userCompany?.dbProvider || 'Supabase'}) Table: "${tableToUse}".`);
  };

  // Step 2: Campaign Config State
  const [campaignName, setCampaignName] = useState('Vendor Performance Celebration - Q2');
  const [campaignType, setCampaignType] = useState('Target Incentive Progress');
  const [scheduleType, setScheduleType] = useState<'Immediate' | 'Daily' | 'Weekly' | 'Monthly' | 'Specific Date' | 'Custom'>('Immediate');
  const [scheduleTime, setScheduleTime] = useState('09:30');
  const [scheduleDate, setScheduleDate] = useState('2026-07-20');

  // Step 3: Template Editor State
  const [templateText, setTemplateText] = useState<string>(() => {
    const savedDraft = localStorage.getItem('v_automation_current_draft');
    return savedDraft || DEFAULT_TEMPLATE;
  });
  const [previewVendorIndex, setPreviewVendorIndex] = useState(0);

  const [versionHistory, setVersionHistory] = useState<TemplateVersion[]>(() => {
    const savedHistory = localStorage.getItem('v_automation_template_history');
    if (savedHistory) {
      try {
        return JSON.parse(savedHistory);
      } catch (e) {
        console.error('Error parsing stored version history', e);
      }
    }
    return SEED_VERSION_HISTORY;
  });
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);

  useEffect(() => {
    const savedDraft = localStorage.getItem('v_automation_current_draft');
    if (savedDraft && savedDraft !== DEFAULT_TEMPLATE) {
      addNotification('Draft Template Loaded', 'Resumed editing your previously saved partial template.', 'info');
      addSystemLog('Template Draft Loaded', 'Resumed editing saved partial message template draft.');
    }
  }, []);

  const handleSaveDraft = () => {
    localStorage.setItem('v_automation_current_draft', templateText);
    
    const now = new Date();
    const newVersion: TemplateVersion = {
      id: `v-${Date.now()}`,
      timestamp: now.toISOString(),
      label: `Draft Saved (${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      text: templateText
    };

    // Filter out duplicate text so the history is kept diverse
    const updatedHistory = [
      newVersion,
      ...versionHistory.filter(v => v.text.trim() !== templateText.trim())
    ].slice(0, 3);

    setVersionHistory(updatedHistory);
    localStorage.setItem('v_automation_template_history', JSON.stringify(updatedHistory));

    addNotification('Draft Saved', 'Template progress saved as draft and added to version history.', 'success');
    addSystemLog('Template Draft Saved', `Stored template draft containing ${templateText.length} characters.`);
  };

  const handleRevertToVersion = (version: TemplateVersion) => {
    const currentText = templateText;
    const now = new Date();
    
    setTemplateText(version.text);
    setShowHistoryDropdown(false);

    // Save as draft to storage
    localStorage.setItem('v_automation_current_draft', version.text);

    // Back up current edit if it differs so user doesn't lose progress!
    if (currentText.trim() && currentText.trim() !== version.text.trim()) {
      const backupVersion: TemplateVersion = {
        id: `v-backup-${Date.now()}`,
        timestamp: now.toISOString(),
        label: `Replaced Edit (${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        text: currentText
      };
      const updatedHistory = [
        backupVersion,
        ...versionHistory.filter(v => v.id !== version.id && v.text.trim() !== currentText.trim())
      ].slice(0, 3);
      setVersionHistory(updatedHistory);
      localStorage.setItem('v_automation_template_history', JSON.stringify(updatedHistory));
    }

    addNotification('Template Reverted', `Restored template to: ${version.label}`, 'success');
    addSystemLog('Template Reverted', `Reverted template text to "${version.label}".`);
  };

  // Utility to parse uploaded file using SheetJS (XLSX) to capture actual spreadsheet data
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const parseUploadedFile = (file: File) => {
    addSystemLog('File Upload', `Processing uploaded spreadsheet file: ${file.name} (${file.size} bytes)`);
    setUploadedFileName(file.name);
    setDataSourceType('uploaded');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error('No data received from file reader.');
        }

        // Read workbook using XLSX
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        if (!worksheet) {
          throw new Error('Spreadsheet has no worksheets or is blank.');
        }

        // Convert worksheet rows to a raw JSON array of objects
        const rawRows = XLSX.utils.sheet_to_json<any>(worksheet);

        if (!rawRows || rawRows.length === 0) {
          addNotification('Empty File', 'The uploaded spreadsheet contains no rows or readable records.', 'error');
          addSystemLog('Excel Parsing Failed', 'Spreadsheet was empty.');
          return;
        }

        // Normalize columns based on common names with fuzzy fallback
        const normalizedRows = rawRows.map((row: any, i: number) => {
          const keys = Object.keys(row);
          const findVal = (possibleHeaders: string[], defaultVal: any = '') => {
            // 1. Exact case-insensitive match
            let foundKey = keys.find(k => 
              possibleHeaders.some(ph => k.trim().toLowerCase() === ph.toLowerCase())
            );
            // 2. Fuzzy substring match if exact fails
            if (!foundKey) {
              foundKey = keys.find(k =>
                possibleHeaders.some(ph => k.trim().toLowerCase().includes(ph.toLowerCase()))
              );
            }
            return foundKey !== undefined ? row[foundKey] : defaultVal;
          };

          // Map values using user's exact Excel column formats
          const name = String(findVal(['retailer name', 'vendor name', 'vendor', 'retailer', 'store name', 'shop name', 'party name', 'customer name', 'name', 'company', 'client'], '')).trim();
          const phone = String(findVal(['phone number', 'phone', 'phone_number', 'mobile number', 'mobile', 'contact no', 'contact', 'whatsapp', 'tel', 'telephone', 'ds mobile', 'retailer mobile', 'number'], '')).trim();
          const targetRaw = findVal(['july tgt', 'aug tgt', 'tgt', 'target', 'q2 target', 'q3 target', 'campaign target', 'goal', 'limit'], 0);
          const achievementRaw = findVal(['achived', 'achieved', 'achievement', 'current achievement', 'sales', 'progress', 'ach'], 0);
          const remainingRaw = findVal(['remaining', 'remaining target', 'balance', 'pending'], null);
          const bonusRaw = findVal(['est. payout', 'est payout', 'payout', 'q3 mahotsav', 'mahotsav', 'reward bonus', 'bonus', 'bonus incentive', 'bonus amount', 'cash bonus', 'reward'], 0);
          const lastSentDateRaw = findVal(['last sent date', 'last sent', 'last message date', 'sent date', 'date', 'last_sent_date'], undefined);
          const region = String(findVal(['region', 'area', 'territory', 'zone'], 'General')).trim();
          const manager = String(findVal(['ds name', 'ds', 'manager', 'manager name', 'regional manager', 'supervisor', 'sales rep', 'executive'], 'Operations Manager')).trim();
          
          const retailerCode = String(findVal(['retailer code', 'code', 'customer code', 'party code', 'id'], '')).trim();
          const q3Mahotsav = findVal(['q3 mahotsav', 'mahotsav'], '');
          let customNotes = String(findVal(['custom notes', 'notes', 'comment', 'comments', 'custom_notes', 'desc'], '')).trim();
          if (retailerCode || q3Mahotsav) {
            const extraDetails = [
              retailerCode ? `Retailer Code: ${retailerCode}` : '',
              q3Mahotsav ? `Q3 Mahotsav: ${q3Mahotsav}` : ''
            ].filter(Boolean).join(' | ');
            customNotes = customNotes ? `${customNotes} (${extraDetails})` : extraDetails;
          }

          const target = typeof targetRaw === 'number' ? targetRaw : (parseFloat(String(targetRaw).replace(/[^0-9.]/g, '')) || 0);
          const achievement = typeof achievementRaw === 'number' ? achievementRaw : (parseFloat(String(achievementRaw).replace(/[^0-9.]/g, '')) || 0);
          const remaining = remainingRaw !== null ? (typeof remainingRaw === 'number' ? remainingRaw : (parseFloat(String(remainingRaw).replace(/[^0-9.]/g, '')) || 0)) : Math.max(0, target - achievement);
          const bonus = typeof bonusRaw === 'number' ? bonusRaw : (parseFloat(String(bonusRaw).replace(/[^0-9.]/g, '')) || 0);

          return {
            id: retailerCode || row.id || `vnd-up-${Math.floor(1000 + Math.random() * 9000)}-${i}`,
            name: name || (retailerCode ? `Retailer ${retailerCode}` : `Vendor Row #${i + 1}`),
            phone,
            target,
            achievement,
            remaining,
            bonus,
            region,
            manager,
            customNotes,
            status: 'Active',
            lastMessageDate: lastSentDateRaw ? String(lastSentDateRaw) : undefined,
            history: []
          };
        });

        // Run validation report on the parsed rows
        const report = validateVendorExcel(normalizedRows);
        setExcelDataList(normalizedRows);
        setValidationReport(report);

        if (report.isValid) {
          addNotification('Spreadsheet captured successfully', `Parsed ${report.validRows} valid vendors from "${file.name}". Ready for campaign stage.`, 'success');
          addSystemLog('Excel Captured', `Successfully imported and parsed ${report.validRows} rows from ${file.name}.`);
        } else {
          addNotification('File imported with warnings', `Spreadsheet captured with ${report.errors.length} validation warnings. Check log list below.`, 'warning');
          addSystemLog('Excel Captured with Warnings', `Imported ${file.name} with ${report.errors.length} warning items.`);
        }
      } catch (err: any) {
        console.error('Spreadsheet read error:', err);
        addNotification('Upload Capture Failed', `Unable to read or parse file: ${err.message || err}`, 'error');
        addSystemLog('Excel Import Error', `Error parsing file: ${err.message || 'unknown file corrupt error'}`);
      }
    };

    reader.onerror = () => {
      addNotification('Read Error', 'Failed to read spreadsheet file from disk.', 'error');
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      parseUploadedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      parseUploadedFile(file);
    }
  };

  const handleDownloadSampleExcel = () => {
    const sampleHeaders = ['Vendor Name', 'Phone Number', 'Target', 'Achievement', 'Remaining', 'Reward Bonus', 'Region', 'Manager', 'Custom Notes'];
    const sampleRows = [
      ['Apex Enterprises', '+917990711567', 10000, 8500, 1500, 500, 'North', 'Sarah Jenkins', 'Quarterly top performer'],
      ['Beacon Logistics', '+918983855958', 15000, 15000, 0, 1000, 'West', 'David Miller', 'Goal achieved early'],
      ['Crestline Supplies', '+918605297777', 8000, 4000, 4000, 250, 'South', 'Elena Rostova', 'Follow-up requested']
    ];
    const csvContent = "data:text/csv;charset=utf-8," 
      + [sampleHeaders.join(",")].concat(sampleRows.map(r => r.map(cell => `"${cell}"`).join(","))).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "custom_vendor_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification('Sample Downloaded', 'Downloaded custom vendor spreadsheet template.', 'success');
  };

  const handleInsertPlaceholder = (placeholder: string) => {
    // Insert into current cursor position or append
    setTemplateText(prev => prev + ' ' + placeholder);
  };

  // Generate parsed preview for currently selected sample vendor
  const renderMessagePreview = (vendor: Vendor) => {
    if (!vendor) return '';
    let preview = templateText;
    preview = preview.replace(/\{\{Vendor Name\}\}/g, vendor.name || '💡 [Empty Vendor Name]');
    preview = preview.replace(/\{\{Name\}\}/g, vendor.name || '💡 [Empty Name]');
    preview = preview.replace(/\{\{Phone Number\}\}/g, vendor.phone || '');
    preview = preview.replace(/\{\{Phone\}\}/g, vendor.phone || '');
    preview = preview.replace(/\{\{Target\}\}/g, String(vendor.target));
    preview = preview.replace(/\{\{Achievement\}\}/g, String(vendor.achievement));
    preview = preview.replace(/\{\{Achieved\}\}/g, String(vendor.achievement));
    preview = preview.replace(/\{\{Remaining\}\}/g, String(vendor.remaining));
    preview = preview.replace(/\{\{Bonus\}\}/g, String(vendor.bonus));
    preview = preview.replace(/\{\{Reward Bonus\}\}/g, String(vendor.bonus));
    preview = preview.replace(/\{\{Manager Name\}\}/g, vendor.manager || '');
    preview = preview.replace(/\{\{Region\}\}/g, vendor.region || '');
    preview = preview.replace(/\{\{Custom Notes\}\}/g, vendor.customNotes || 'N/A');
    return preview;
  };

  const triggerDownloadErrorReport = () => {
    if (!validationReport.errors || validationReport.errors.length === 0) return;
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Row,Field,Value,Reason"].join(",") + "\n"
      + validationReport.errors.map((e: any) => `${e.row},"${e.field}","${e.value}","${e.reason}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `validation_error_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addSystemLog('Report Download', 'Downloaded spreadsheet validation error log.');
  };

  // Next steps guards
  const handleNextStep1 = () => {
    if (validationReport.validRows === 0) {
      addNotification('Upload Denied', 'You cannot proceed with zero valid vendor rows.', 'error');
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!campaignName.trim()) {
      addNotification('Input Error', 'Please supply a campaign name.', 'error');
      return;
    }
    setStep(3);
  };

  const handleNextStep3 = () => {
    if (!templateText.trim()) {
      addNotification('Template Empty', 'Please provide message template text.', 'error');
      return;
    }
    setStep(4);
  };

  const handleSubmitCampaign = () => {
    // Generate initial queued items based on sanitized valid vendors
    const validVendors: Vendor[] = validationReport.sanitizedVendors;
    
    const isAuthorizedDirectRun = currentUser ? currentUser.autoApproveCampaigns : true;
    const initialStatus = !isAuthorizedDirectRun 
      ? 'Pending Approval' 
      : (scheduleType === 'Immediate' ? 'Running' : 'Scheduled');

    const newCampaign: Campaign = {
      id: `cmp-${Math.floor(100 + Math.random() * 900)}`,
      name: campaignName,
      type: campaignType,
      schedule: scheduleType,
      scheduleDetails: scheduleType === 'Immediate' ? 'Execute Now' : `${scheduleType} at ${scheduleTime} (${scheduleDate})`,
      status: initialStatus,
      templateText,
      createdAt: new Date().toISOString(),
      createdBy: currentUser ? `${currentUser.name} (${currentUser.companyName || 'Admin'})` : 'Authorized Employee',
      excelFileName: dataSourceType === 'default' ? 'custom_uploaded_vendors.xlsx' : uploadedFileName,
      vendorCount: validVendors.length,
      stats: {
        pending: validVendors.length,
        sending: 0,
        sent: 0,
        failed: 0,
        skipped: 0,
        alreadySent: 0
      },
      vendors: validVendors.map(v => ({
        vendorId: v.id,
        name: v.name,
        phone: v.phone,
        status: 'Pending',
        generatedMessage: renderMessagePreview(v)
      }))
    };

    onCampaignCreated(newCampaign, validVendors);
    addSystemLog('Campaign Launch', `Campaign ${campaignName} initialized with ${validVendors.length} target records.`);
    addNotification('Campaign Launched', `Deployment queue created for ${validVendors.length} vendors.`, 'success');
  };

  const currentPreviewVendor = validationReport.sanitizedVendors[previewVendorIndex];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wizard Header Progress Bar */}
      <div className="bg-white rounded-lg border border-slate-100 shadow-xs p-5">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">DEPLOYMENT PIPELINE</span>
            <h3 className="font-bold text-slate-800 text-sm">Campaign Setup Progress</h3>
          </div>
          <span className="text-xs font-bold text-blue-600 font-mono">Step {step} of 4</span>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {[
            { num: 1, label: 'Data Source' },
            { num: 2, label: 'Schedule' },
            { num: 3, label: 'Template' },
            { num: 4, label: 'Approval' }
          ].map(s => (
            <div key={s.num} className="space-y-1.5">
              <div className={`h-1.5 rounded-full transition-all duration-300 ${
                step >= s.num ? 'bg-blue-600' : 'bg-slate-100'
              }`}></div>
              <span className={`text-[10px] font-semibold hidden md:block text-center ${
                step === s.num ? 'text-blue-600 font-bold' : 'text-slate-400'
              }`}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: Select Data Source */}
      {step === 1 && (
        <div className="bg-white rounded-lg border border-slate-100 shadow-xs p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50 pb-4">
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                Select Campaign Data Source
              </h4>
              <p className="text-xs text-slate-500">
                Choose to upload a fresh real-time Excel spreadsheet or use your saved Master Vendor Database.
              </p>
            </div>
            <button
              onClick={handleDownloadSampleExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              Download Sample Template
            </button>
          </div>

          {/* Dual Source Selector Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => {
                setDataSourceType('uploaded');
                fileInputRef.current?.click();
              }}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                dataSourceType === 'uploaded' && uploadedFileName && uploadedFileName !== 'Stored Master Vendor Database'
                  ? 'border-blue-600 bg-blue-50/20 shadow-xs'
                  : 'border-slate-200 hover:border-blue-300 bg-white'
              }`}
            >
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 shrink-0 mt-0.5">
                <Upload className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h5 className="text-xs font-bold text-slate-900">1. Upload Real-Time Excel Sheet</h5>
                  <span className="text-[9px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200/60">Recommended for Live Updates</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Best when daily/weekly targets change in real time across multiple sheets. Drag & drop or browse .xlsx, .csv files.
                </p>
              </div>
            </div>

            <div
              onClick={selectStoredDatabase}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                dataSourceType === 'database' || uploadedFileName === 'Stored Master Vendor Database'
                  ? 'border-blue-600 bg-blue-50/20 shadow-xs'
                  : 'border-slate-200 hover:border-blue-300 bg-white'
              }`}
            >
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg border border-purple-100 shrink-0 mt-0.5">
                <Database className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h5 className="text-xs font-bold text-slate-900">2. Use Saved Vendor Master Database</h5>
                  <span className="text-[9px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-200/60">Saved Records</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Reuse pre-stored active vendors from previous uploads or master vendor catalog directly from local database.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Drag & Drop Area */}
          {dataSourceType === 'uploaded' && (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 rounded-xl border-2 border-dashed text-center transition-all cursor-pointer ${
                uploadedFileName && uploadedFileName !== 'Stored Master Vendor Database'
                  ? 'border-emerald-500 bg-emerald-50/20'
                  : 'border-blue-200 bg-blue-50/10 hover:border-blue-500 hover:bg-blue-50/20'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              {uploadedFileName && uploadedFileName !== 'Stored Master Vendor Database' ? (
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-wider bg-emerald-100/60 px-2.5 py-0.5 rounded-full">
                      Excel Sheet Loaded
                    </span>
                    <h5 className="text-sm font-bold text-slate-900 mt-1">{uploadedFileName}</h5>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {validationReport.validRows} valid records parsed and validated.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold underline inline-block"
                  >
                    Upload different Excel sheet
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto border border-blue-100">
                    <Upload className="w-6 h-6 animate-bounce" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">Drag & Drop your Excel file here</h5>
                    <p className="text-xs text-slate-500 mt-1">
                      or <span className="text-blue-600 font-bold underline">click to browse</span> your computer (.xlsx, .xls, .csv)
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Expected columns: Vendor Name, Phone Number, Target, Achievement, Remaining, Reward Bonus, Manager, Region
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Database active indicator */}
          {dataSourceType === 'database' && (
            <div className="p-6 bg-purple-50/50 rounded-xl border border-purple-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-purple-200/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center border border-purple-200 shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-purple-700 uppercase tracking-wider bg-purple-100 px-2 py-0.5 rounded-full">
                        {userCompany?.dbProvider || 'Supabase'} Integrated
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">{userCompany?.name || 'Company Database'}</span>
                    </div>
                    <h5 className="text-sm font-bold text-slate-900 mt-0.5">Connected Company Vendor Database</h5>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-purple-900 bg-purple-100/80 px-3 py-1 rounded-lg border border-purple-200">
                    {validationReport.validRows} Records Synced
                  </span>
                </div>
              </div>

              {/* Table Selection Pills */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase font-mono">Select Connected Table to Query</label>
                <div className="flex flex-wrap gap-2">
                  {(userCompany?.dbConnectedTables && userCompany.dbConnectedTables.length > 0
                    ? userCompany.dbConnectedTables
                    : ['vendors_master', 'active_merchants_2026', 'q2_targets']
                  ).map(tableName => (
                    <button
                      type="button"
                      key={tableName}
                      onClick={() => selectStoredDatabase(tableName)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                        selectedDbTable === tableName
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-white hover:bg-purple-100/50 text-purple-900 border border-purple-200'
                      }`}
                    >
                      <Database className="w-3 h-3" />
                      {tableName}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Validation Results Overview */}
          {validationReport.totalRows > 0 ? (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/50 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase font-mono tracking-wide">Excel Parse Validation Report</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  validationReport.isValid
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                }`}>
                  {validationReport.isValid ? 'Schema Validated' : 'Warnings Detected'}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-3 rounded-lg border border-slate-100 text-center">
                  <div className="text-sm font-black text-slate-800">{validationReport.totalRows}</div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase font-mono">Total Rows</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-100 text-center">
                  <div className="text-sm font-black text-emerald-600">{validationReport.validRows}</div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase font-mono text-emerald-600/70">Ready for send</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-100 text-center">
                  <div className="text-sm font-black text-rose-600">{validationReport.invalidRows}</div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase font-mono text-rose-600/70">Format Errors</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-100 text-center">
                  <div className="text-sm font-black text-amber-600">{validationReport.duplicateCount}</div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase font-mono text-amber-600/70">Duplicates</div>
                </div>
              </div>

              {/* Print list of warnings */}
              {validationReport.errors && validationReport.errors.length > 0 && (
                <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-rose-950 uppercase font-mono flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      Validation error detail logs (first {Math.min(validationReport.errors.length, 3)})
                    </span>
                    <button
                      onClick={triggerDownloadErrorReport}
                      className="text-[9px] text-rose-700 hover:text-rose-900 font-bold underline font-mono"
                    >
                      Download complete Errors CSV
                    </button>
                  </div>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {validationReport.errors.slice(0, 3).map((err: any, i: number) => (
                      <div key={i} className="text-[10px] text-rose-800 leading-tight">
                        • Row <span className="font-bold">{err.row}</span> | Field: <span className="font-mono font-bold bg-white px-1 border">{err.field}</span> | Value: "{err.value}" → <span className="font-semibold">{err.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/80 text-amber-800 text-xs flex items-center gap-3">
              <Info className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <strong className="font-bold">No Excel file loaded:</strong> Please upload your customized Excel sheet above to populate vendor targets and proceed to campaign scheduling.
              </div>
            </div>
          )}

          {/* Quick buttons */}
          <div className="flex justify-end pt-4 border-t border-slate-50">
            <button
              onClick={handleNextStep1}
              disabled={validationReport.validRows === 0}
              className={`text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs ${
                validationReport.validRows === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              Proceed to schedule configuration
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Campaign Configuration */}
      {step === 2 && (
        <div className="bg-white rounded-lg border border-slate-100 shadow-xs p-6 space-y-6">
          <div className="space-y-1 border-b border-slate-50 pb-3">
            <h4 className="text-base font-bold text-slate-900">Configure Campaign Settings & Schedules</h4>
            <p className="text-xs text-slate-500">Provide basic indexing parameters and set message dispatch intervals.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Campaign Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Campaign Name</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={e => setCampaignName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. Q2 Performance Celebration"
                />
              </div>

              {/* Campaign Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Campaign Template Category</label>
                <select
                  value={campaignType}
                  onChange={e => setCampaignType(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3.5 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="Target Incentive Progress">Target Incentive Progress</option>
                  <option value="Urgent Reminders">Urgent Reminders</option>
                  <option value="General Announcements">General Announcements</option>
                  <option value="Direct Management Outreaches">Direct Management Outreaches</option>
                </select>
              </div>
            </div>

            {/* Schedules Selection */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Choose sending Interval</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 'Immediate', label: 'Send Immediately' },
                    { val: 'Daily', label: 'Daily Recurrence' },
                    { val: 'Weekly', label: 'Weekly Runs' },
                    { val: 'Monthly', label: 'Monthly Target Check' },
                    { val: 'Specific Date', label: 'Specific Calendar Date' },
                    { val: 'Custom', label: 'Custom Automation' }
                  ].map(sc => (
                    <button
                      key={sc.val}
                      type="button"
                      onClick={() => setScheduleType(sc.val as any)}
                      className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                        scheduleType === sc.val
                          ? 'border-blue-600 bg-blue-50/15 text-blue-700 font-bold'
                          : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {sc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date/Time picker based on schedule choice */}
              {scheduleType !== 'Immediate' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 animate-fadeIn">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Send Time</span>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={e => setScheduleTime(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
                    />
                  </div>
                  {scheduleType === 'Specific Date' && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Send Date</span>
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={e => setScheduleDate(e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-3.5 bg-blue-50/20 border border-blue-100 rounded-xl flex items-center gap-3">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <p className="text-[10px] text-blue-900 leading-relaxed">
              <strong>SCHEDULE NOTE:</strong> The system automatically coordinates scheduled runs with our designated company sending hours. If transmission exceeds active working hours, messages are automatically paused and safely resumed the next business day.
            </p>
          </div>

          {/* Action Footer */}
          <div className="flex justify-between pt-4 border-t border-slate-50">
            <button
              onClick={() => setStep(1)}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to data source
            </button>
            <button
              onClick={handleNextStep2}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
            >
              Define message template
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Message Template Editor & Live Preview */}
      {step === 3 && (
        <div className="bg-white rounded-lg border border-slate-100 shadow-xs p-6 space-y-6">
          <div className="space-y-1 border-b border-slate-50 pb-3">
            <h4 className="text-base font-bold text-slate-900">Define Reusable Campaign Message Template</h4>
            <p className="text-xs text-slate-500">Insert custom placeholder variables. Placeholders automatically resolve to vendor-specific values upon campaign launch.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Template input box */}
            <div className="space-y-0 flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-slate-200 bg-slate-50/50 p-2.5 rounded-t-xl shrink-0 select-none">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold text-slate-700">Write Message Template</span>
                </div>
                
                <div className="flex items-center gap-1.5 relative">
                  {/* Save Draft Action */}
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="inline-flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase px-2.5 py-1.5 rounded border border-slate-200 transition-all cursor-pointer select-none"
                    title="Save current template as draft"
                  >
                    <Save className="w-3 h-3 text-slate-500" />
                    Save Draft
                  </button>

                  {/* Version History Trigger */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                      className="inline-flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase px-2.5 py-1.5 rounded border border-slate-200 transition-all cursor-pointer select-none"
                      title="View template version history"
                    >
                      <History className="w-3 h-3 text-slate-500" />
                      Versions ({versionHistory.length})
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    {/* Floating Dropdown with Backdrop */}
                    {showHistoryDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowHistoryDropdown(false)}
                        />
                        <div className="absolute right-0 mt-1 w-72 bg-white border border-slate-200 rounded shadow-lg z-50 overflow-hidden text-left animate-fadeIn">
                          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">Template Versions (Last 3)</span>
                          </div>
                          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                            {versionHistory.length === 0 ? (
                              <div className="p-3 text-center text-[10px] text-slate-400 italic">No previous versions.</div>
                            ) : (
                              versionHistory.map(v => (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => handleRevertToVersion(v)}
                                  className="w-full p-2.5 text-left hover:bg-slate-50 transition-all block focus:outline-none cursor-pointer"
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-blue-900 truncate max-w-[150px]">{v.label}</span>
                                    <span className="text-[8px] font-mono text-slate-400">
                                      {new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-[9px] text-slate-500 mt-1 font-mono truncate max-w-[250px] whitespace-nowrap leading-none">
                                    {v.text.replace(/\s+/g, ' ')}
                                  </p>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <textarea
                value={templateText}
                onChange={e => {
                  setTemplateText(e.target.value);
                  localStorage.setItem('v_automation_current_draft', e.target.value);
                }}
                className="w-full h-80 text-xs border border-slate-200 border-t-0 rounded-b-xl rounded-t-none p-3.5 focus:border-blue-500 focus:outline-none font-mono leading-relaxed"
                placeholder="Insert message content here..."
              />

              {/* Variable Injector buttons */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-extrabold text-slate-400 font-mono uppercase">Click to Insert Dynamic Placeholders:</div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Retailer Name', ph: '{{Retailer Name}}' },
                    { label: 'DS Name', ph: '{{DS Name}}' },
                    { label: 'Target', ph: '{{Target}}' },
                    { label: 'Achieved', ph: '{{Achieved}}' },
                    { label: 'Est. Payout', ph: '{{Est. Payout}}' },
                    { label: 'Remaining', ph: '{{Remaining}}' },
                    { label: 'Vendor Name', ph: '{{Vendor Name}}' },
                    { label: 'Custom Notes', ph: '{{Custom Notes}}' }
                  ].map(v => (
                    <button
                      key={v.ph}
                      type="button"
                      onClick={() => handleInsertPlaceholder(v.ph)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold px-2 py-1 rounded-lg border border-slate-200/40 transition-all"
                    >
                      + {v.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Template Previewer card */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Eye className="w-4 h-4 text-slate-400" />
                  <span>Real-time Personalized Preview</span>
                </div>
                
                {/* Sample Selector pagination */}
                {validationReport.sanitizedVendors.length > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={previewVendorIndex === 0}
                      onClick={() => setPreviewVendorIndex(prev => Math.max(0, prev - 1))}
                      className="p-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-40 text-xs font-bold"
                    >
                      ◀
                    </button>
                    <span className="text-[10px] font-mono text-slate-500">
                      Sample {previewVendorIndex + 1} of {validationReport.sanitizedVendors.length}
                    </span>
                    <button
                      type="button"
                      disabled={previewVendorIndex === validationReport.sanitizedVendors.length - 1}
                      onClick={() => setPreviewVendorIndex(prev => Math.min(validationReport.sanitizedVendors.length - 1, prev + 1))}
                      className="p-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-40 text-xs font-bold"
                    >
                      ▶
                    </button>
                  </div>
                )}
              </div>

              {/* Simulated Mobile Mock UI */}
              <div className="border border-slate-100 bg-slate-100/55 rounded-lg p-4 flex flex-col justify-between h-[400px]">
                {/* Header of mobile */}
                <div className="bg-white border border-slate-150 rounded-xl p-2.5 flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center justify-center">
                      {currentPreviewVendor?.name ? currentPreviewVendor.name.charAt(0) : 'V'}
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-800 truncate max-w-[150px]">
                        {currentPreviewVendor?.name || 'Sample Vendor'}
                      </div>
                      <div className="text-[8px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                        <Phone className="w-2 h-2" />
                        {currentPreviewVendor?.phone || 'No phone'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[8px] bg-emerald-50 text-emerald-600 font-mono font-bold px-2 py-0.5 rounded border border-emerald-100">
                    PREVIEWING
                  </span>
                </div>

                {/* Message body block */}
                <div className="flex-1 bg-white border border-slate-100 rounded-xl p-3.5 overflow-y-auto shadow-2xs">
                  <div className="text-[11px] whitespace-pre-wrap text-slate-700 leading-relaxed font-sans">
                    {currentPreviewVendor ? (
                      renderMessagePreview(currentPreviewVendor)
                    ) : (
                      <span className="text-slate-400 italic">No vendor records available for previewing.</span>
                    )}
                  </div>
                </div>

                {/* Simulated estimated cost */}
                <div className="mt-3 p-2 bg-blue-50/50 border border-blue-100 rounded-lg flex justify-between items-center text-[10px] text-blue-900 font-semibold font-mono">
                  <span>Chars: {currentPreviewVendor ? renderMessagePreview(currentPreviewVendor).length : 0}</span>
                  <span>Estimated: 1 Segment Message</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex justify-between pt-4 border-t border-slate-50">
            <button
              onClick={() => setStep(2)}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to scheduling
            </button>
            <button
              onClick={handleNextStep3}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
            >
              Proceed to final approval
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Campaign Approval */}
      {step === 4 && (
        <div className="bg-white rounded-lg border border-slate-100 shadow-xs p-6 space-y-6">
          <div className="space-y-1 border-b border-slate-50 pb-3">
            <h4 className="text-base font-bold text-slate-900">Final Verification & Campaign Approval</h4>
            <p className="text-xs text-slate-500">Please review transmission statistics before confirming launch. Approved queues begin immediate delivery attempts.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Deployment details list */}
            <div className="space-y-4">
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide font-mono">Deployment Summary</h5>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-xs text-slate-500 font-medium">Campaign Name</span>
                  <span className="text-xs font-bold text-slate-800">{campaignName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-xs text-slate-500 font-medium">Data Source</span>
                  <span className="text-xs font-mono font-bold text-slate-800">
                    {dataSourceType === 'default' ? 'Default excel spreadsheet' : uploadedFileName}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-xs text-slate-500 font-medium">Recipient Queue Group</span>
                  <span className="text-xs font-bold text-blue-600">
                    {validationReport.validRows} vendors matched
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-xs text-slate-500 font-medium">Target Schedule</span>
                  <span className="text-xs font-bold text-slate-800">
                    {scheduleType === 'Immediate' ? 'Execute immediately' : `${scheduleType} at ${scheduleTime}`}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-xs text-slate-500 font-medium">Duplicate Prevention</span>
                  <span className="text-xs font-bold text-emerald-600">Strictly Active</span>
                </div>
              </div>

              {/* Warning warning warning block */}
              <div className="p-3.5 bg-amber-50 border border-amber-200/60 rounded-xl text-amber-900 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h6 className="text-xs font-bold">Launch Confirmation Policy</h6>
                  <p className="text-[10px] text-amber-800 leading-relaxed mt-0.5">
                    Clicking the approval action will initiate transmission. Ensure template variables are aligned and your spreadsheet data is verified. This process CANNOT be reversed once execution has begun.
                  </p>
                </div>
              </div>
            </div>

            {/* Template sample review segment */}
            <div className="bg-slate-50/50 rounded-lg border border-slate-200/40 p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase">Active Template Snippet</span>
                <p className="text-[11px] text-slate-600 leading-relaxed font-mono whitespace-pre-wrap max-h-64 overflow-y-auto p-3 bg-white border rounded-xl">
                  {templateText}
                </p>
              </div>

              <div className="p-3 bg-blue-50/20 border border-blue-100 rounded-xl flex items-center justify-between text-[11px] text-blue-950 font-semibold font-mono">
                <span>EST. MESSAGES: {validationReport.validRows}</span>
                <span>EST. TIME: ~{Math.ceil(validationReport.validRows * 3 / 60)} mins</span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex justify-between pt-4 border-t border-slate-50">
            <button
              onClick={() => setStep(3)}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Adjust template
            </button>
            <button
              onClick={handleSubmitCampaign}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm shadow-blue-600/15"
            >
              <ClipboardCheck className="w-4 h-4 text-blue-200" />
              Approve & Deploy Queue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
