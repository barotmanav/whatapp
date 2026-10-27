import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import CampaignWizard from './components/CampaignWizard';
import LiveMonitorView from './components/LiveMonitorView';
import VendorsView from './components/VendorsView';
import HistoryView from './components/HistoryView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import AdminApprovalView from './components/AdminApprovalView';
import AuthLoginView from './components/AuthLoginView';
import CompanyManagementView from './components/CompanyManagementView';

import { Vendor, Campaign, AuditLog, SystemSettings, Notification, CampaignVendorProgress, CampaignStatus, Company, UserAccount } from './types';
import { DEFAULT_VENDORS, DEFAULT_TEMPLATE } from './data/defaultVendors';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('dashboard');

  // Registered Companies state
  const [companies, setCompanies] = useState<Company[]>(() => {
    const saved = localStorage.getItem('v_automation_companies');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'comp-01',
        name: 'Enterprise Logistics Corp',
        code: 'ENT-01',
        registeredAt: '2026-01-10T00:00:00Z',
        status: 'Active',
        maxDailyMessages: 10000
      },
      {
        id: 'comp-02',
        name: 'Apex Manufacturing Solutions',
        code: 'APX-02',
        registeredAt: '2026-02-15T00:00:00Z',
        status: 'Active',
        maxDailyMessages: 5000
      }
    ];
  });

  // User Accounts state
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('v_automation_users');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'usr-emp-1',
        name: 'Rajesh Verma',
        emailOrUsername: 'employee@enterprise.com',
        password: 'emp123',
        role: 'Company Employee',
        companyId: 'comp-01',
        companyName: 'Enterprise Logistics Corp',
        autoApproveCampaigns: true,
        status: 'Active',
        createdAt: '2026-01-12T00:00:00Z'
      },
      {
        id: 'usr-admin-1',
        name: 'System Administrator',
        emailOrUsername: 'admin',
        password: 'admin123',
        role: 'Administrator',
        autoApproveCampaigns: true,
        status: 'Active',
        createdAt: '2026-01-01T00:00:00Z'
      }
    ];
  });

  // Current Logged In User State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('v_automation_current_user');
    if (saved) {
      try {
        return JSON.parse(saved) as UserAccount;
      } catch (e) {
        return null;
      }
    }
    // Default logged in as demo employee for immediate access
    return {
      id: 'usr-emp-1',
      name: 'Rajesh Verma',
      emailOrUsername: 'employee@enterprise.com',
      password: 'emp123',
      role: 'Company Employee',
      companyId: 'comp-01',
      companyName: 'Enterprise Logistics Corp',
      autoApproveCampaigns: true,
      status: 'Active',
      createdAt: '2026-01-12T00:00:00Z'
    };
  });

  const isAdmin = currentUser?.role === 'Administrator';
  const userRole = currentUser?.role || 'Company Employee';

  // Persistence State
  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const saved = localStorage.getItem('v_automation_vendors');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Vendor[];
        if (parsed.some(v => v.id === 'vnd-001' || v.id === 'vnd-002' || v.name === 'Apex Logistics Solutions')) {
          localStorage.setItem('v_automation_vendors', JSON.stringify([]));
          return [];
        }
        return parsed;
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    const saved = localStorage.getItem('v_automation_campaigns');
    if (saved) {
      const parsed = JSON.parse(saved) as Campaign[];
      if (parsed.some(c => c.name === 'Q1 Performance Outreaches' || c.excelFileName === 'q1_master_performance.xlsx')) {
        localStorage.removeItem('v_automation_campaigns');
        return [];
      }
      return parsed;
    }
    return [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('v_automation_audit');
    if (saved) return JSON.parse(saved);

    return [
      {
        id: 'log-1',
        timestamp: '2026-07-18T08:50:00Z',
        user: 'System Process',
        role: 'Administrator',
        action: 'Database Bootstrap',
        module: 'System',
        details: 'Initial vendor spreadsheet catalog loaded with real master profiles.'
      }
    ];
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('v_automation_notif');
    if (saved) return JSON.parse(saved);

    return [
      {
        id: 'n-1',
        title: 'Platform Operational',
        message: 'WhatsApp automated dispatch microservices verified active and synchronized.',
        type: 'success',
        timestamp: new Date().toISOString(),
        read: false
      }
    ];
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('v_automation_settings');
    let finalSettings: SystemSettings;
    if (saved) {
      const parsed = JSON.parse(saved) as SystemSettings;
      // Auto-migrate standard sender number to user's requested number if it's the old default
      if (parsed.orgWhatsAppNumber === '+15551982736' || !parsed.orgWhatsAppNumber) {
        parsed.orgWhatsAppNumber = '917990711567';
      }
      finalSettings = parsed;
    } else {
      finalSettings = {
        defaultExcelFileName: 'vendor_performance_master.xlsx',
        defaultTemplate: DEFAULT_TEMPLATE,
        workingHoursStart: '09:00',
        workingHoursEnd: '18:00',
        campaignLimitsPerDay: 500,
        messageDelaySeconds: 2,
        orgName: 'Enterprise Logistics Corp',
        orgWhatsAppNumber: '917990711567'
      };
    }

    // Ensure Meta WhatsApp Cloud API gateway settings are configured with user's Meta credentials
    const metaToken = 'EAAZAIakPCWfQBSOnhVTRiWK82fnwQX359PRSjbRAKGt05D3H8bZBE08AZBqETZBDDJCAKe58hppyOZAZADDpDoyAMHnWDtnOZAuWtSc6FggX7g7CGcc21BQfrbcunZBb6adJvfsurvmML7cg5sXOPV8NeRMOFpCFirxkdEG9JwHQlZAzrcO8gZAOpkxEk6lYAaUKqaEYVdSqe39IdXgNOeZBVFVSM6ttVg39NA3hZCluc7RxoC5tcr9nIeZBTFuBE5WqSChtn9Msv2HqzZBeLPsZAyfo4ZCnYgZDZD';
    const metaPhoneId = '1178965715308814';
    const metaGatewayUrl = `https://graph.facebook.com/v19.0/${metaPhoneId}/messages`;

    // Force enable Meta Cloud API gateway if not explicitly configured
    if (!finalSettings.gatewayUrl || finalSettings.gatewayUrl.includes('api.whatsapp-gateway.com') || finalSettings.gatewayUrl.includes('YOUR_PHONE_NUMBER_ID')) {
      finalSettings.gatewayEnabled = true;
      finalSettings.gatewayType = 'custom-api';
      finalSettings.gatewayUrl = metaGatewayUrl;
      finalSettings.gatewayMethod = 'POST';
      finalSettings.gatewayHeaders = JSON.stringify({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${metaToken}`
      }, null, 2);
      finalSettings.gatewayBodyTemplate = JSON.stringify({
        messaging_product: 'whatsapp',
        to: '{{phone}}',
        type: 'text',
        text: {
          body: '{{message}}'
        }
      }, null, 2);
    }

    localStorage.setItem('v_automation_settings', JSON.stringify(finalSettings));
    return finalSettings;
  });

  const [lastExcelFileName, setLastExcelFileName] = useState<string>('No Excel Sheet Uploaded');
  const [lastExcelStats, setLastExcelStats] = useState<{ total: number; valid: number; invalid: number }>({
    total: 0,
    valid: 0,
    invalid: 0
  });

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('v_automation_companies', JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem('v_automation_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('v_automation_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('v_automation_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('v_automation_vendors', JSON.stringify(vendors));
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem('v_automation_campaigns', JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    localStorage.setItem('v_automation_audit', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('v_automation_notif', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('v_automation_settings', JSON.stringify(settings));
  }, [settings]);

  // Logging helpers
  const addSystemLog = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now() + Math.random()}`,
      timestamp: new Date().toISOString(),
      user: currentUser ? currentUser.name : 'System Process',
      role: userRole,
      action,
      module: getModuleFromAction(action),
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const getModuleFromAction = (action: string): string => {
    const act = action.toLowerCase();
    if (act.includes('company') || act.includes('user') || act.includes('credential') || act.includes('login') || act.includes('security')) return 'Security';
    if (act.includes('excel') || act.includes('upload') || act.includes('parse')) return 'Excel';
    if (act.includes('campaign') || act.includes('launch') || act.includes('pause') || act.includes('approv') || act.includes('reject')) return 'Campaign';
    if (act.includes('template')) return 'Template';
    if (act.includes('vendor')) return 'Vendor';
    return 'System';
  };

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    const newNotif: Notification = {
      id: `n-${Date.now() + Math.random()}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    addSystemLog('Clear Alerts', 'Cleared notification inbox alerts.');
  };

  // User & Company Handlers
  const handleAddCompany = (newCompany: Company) => {
    setCompanies(prev => [...prev, newCompany]);
  };

  const handleUpdateCompany = (updatedCompany: Company) => {
    setCompanies(prev => prev.map(c => c.id === updatedCompany.id ? updatedCompany : c));
  };

  const handleAddUser = (newUser: UserAccount) => {
    setUsers(prev => [...prev, newUser]);
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'Active' ? 'Locked' : 'Active';
        addSystemLog('Account Status Change', `Changed user "${u.name}" account status to ${nextStatus}.`);
        addNotification('User Status Updated', `User account ${u.name} is now ${nextStatus}.`, 'info');
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const handleDeleteUser = (userId: string) => {
    const u = users.find(x => x.id === userId);
    if (u) {
      setUsers(prev => prev.filter(x => x.id !== userId));
      addSystemLog('User Deleted', `Deleted credentials for "${u.name}" (${u.emailOrUsername}).`);
      addNotification('User Deleted', `Removed credentials for ${u.name}.`, 'warning');
    }
  };

  const handleUserLogout = () => {
    addSystemLog('User Sign Out', `User "${currentUser?.name}" signed out.`);
    setCurrentUser(null);
    addNotification('Signed Out', 'You have been safely signed out from the portal.', 'info');
  };

  // Vendor handlers
  const handleAddVendor = (vnd: Vendor) => {
    setVendors(prev => [vnd, ...prev]);
  };

  const handleUpdateVendor = (vnd: Vendor) => {
    setVendors(prev => prev.map(v => v.id === vnd.id ? vnd : v));
  };

  const handleDeleteVendor = (id: string) => {
    setVendors(prev => prev.filter(v => v.id !== id));
  };

  const handleClearAllVendors = () => {
    setVendors([]);
  };

  // Campaign management triggers
  const handleCampaignCreated = (newCampaign: Campaign, validatedVendors: Vendor[]) => {
    setCampaigns(prev => [newCampaign, ...prev]);
    
    // Update last spreadsheet stats
    setLastExcelFileName(newCampaign.excelFileName);
    setLastExcelStats({
      total: validatedVendors.length,
      valid: validatedVendors.length,
      invalid: 0
    });

    // Jump directly to live monitoring screen!
    setCurrentView('monitor');

    if (newCampaign.status === 'Pending Approval') {
      addNotification(
        'Campaign Queue Held', 
        'Campaign is awaiting administrator authorization.', 
        'warning'
      );
      addSystemLog('Campaign Review Required', `Campaign "${newCampaign.name}" queued for Administrator authorization.`);
    } else {
      addNotification('Campaign Launched', `Deployment queue initialized for ${validatedVendors.length} vendors.`, 'success');
    }
  };

  const handleCampaignStatusChange = (status: CampaignStatus, updatedStats?: any, updatedVendors?: CampaignVendorProgress[]) => {
    setCampaigns(prev => prev.map(c => {
      if (c.status === 'Running' || c.status === 'Paused' || c.status === 'Draft' || c.status === 'Scheduled' || c.status === 'Pending Approval') {
        return {
          ...c,
          status,
          stats: updatedStats ? { ...c.stats, ...updatedStats } : c.stats,
          vendors: updatedVendors || c.vendors,
          startedAt: status === 'Running' && !c.startedAt ? new Date().toISOString() : c.startedAt
        };
      }
      return c;
    }));
  };

  const handleCampaignComplete = (completedCampaign: Campaign) => {
    setCampaigns(prev => prev.map(c => c.id === completedCampaign.id ? completedCampaign : c));

    if (completedCampaign.vendors) {
      setVendors(prevVendors => prevVendors.map(v => {
        const completedVendorProg = completedCampaign.vendors!.find(vp => vp.vendorId === v.id);
        
        if (completedVendorProg && completedVendorProg.status !== 'Pending' && completedVendorProg.status !== 'Sending') {
          const newHistItem = {
            id: `hist-auto-${Date.now() + Math.random()}`,
            campaignId: completedCampaign.id,
            campaignName: completedCampaign.name,
            sentAt: new Date().toISOString(),
            status: completedVendorProg.status,
            message: completedVendorProg.generatedMessage,
            errorReason: completedVendorProg.errorReason
          };

          return {
            ...v,
            lastMessageDate: new Date().toISOString(),
            history: [newHistItem, ...(v.history || [])]
          };
        }
        return v;
      }));
    }
  };

  // Admin approval console triggers
  const handleApproveCampaign = (campaignId: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id === campaignId) {
        addSystemLog('Campaign Authorized', `Campaign "${c.name}" was approved and initialized by Administrator.`);
        addNotification('Campaign Approved', `Campaign "${c.name}" is now approved and active.`, 'success');
        return {
          ...c,
          status: c.schedule === 'Immediate' ? 'Running' : 'Scheduled',
          scheduleDetails: c.schedule === 'Immediate' ? 'Execute Now' : c.scheduleDetails?.replace('Awaiting Approval (', '').replace(')', '')
        };
      }
      return c;
    }));
    setCurrentView('monitor');
  };

  const handleRejectCampaign = (campaignId: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id === campaignId) {
        addSystemLog('Campaign Rejected', `Campaign "${c.name}" was rejected and cancelled by Administrator.`);
        addNotification('Campaign Rejected', `Campaign "${c.name}" was declined.`, 'error');
        return {
          ...c,
          status: 'Cancelled'
        };
      }
      return c;
    }));
  };

  // If no user is logged in, show the Secure Auth Login Portal
  if (!currentUser) {
    return (
      <AuthLoginView
        companies={companies}
        users={users}
        onLoginSuccess={(user) => setCurrentUser(user)}
        addSystemLog={addSystemLog}
        addNotification={addNotification}
      />
    );
  }

  const activeCampaign = campaigns.find(c => c.status === 'Running' || c.status === 'Paused' || c.status === 'Pending Approval');

  return (
    <div className="flex bg-slate-50 min-h-screen text-slate-800 antialiased font-sans">
      
      {/* Dynamic Navigation Rail */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        activeCampaignStatus={activeCampaign?.status}
        currentUser={currentUser}
        onLogout={handleUserLogout}
      />

      {/* Main Panel pane */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Dynamic Header */}
        <Header
          currentView={currentView}
          currentUser={currentUser}
          notifications={notifications}
          markNotificationAsRead={markNotificationAsRead}
          clearAllNotifications={clearAllNotifications}
          onLogout={handleUserLogout}
          addSystemLog={addSystemLog}
        />

        {/* Dynamic View container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {currentView === 'dashboard' && (
            <DashboardView
              campaigns={campaigns}
              auditLogs={auditLogs}
              notifications={notifications}
              lastExcelFileName={lastExcelFileName}
              lastExcelStats={lastExcelStats}
              onCreateCampaignClick={() => setCurrentView('wizard')}
              onViewMonitorClick={() => setCurrentView('monitor')}
              onViewReportsClick={() => setCurrentView('reports')}
              userRole={userRole}
            />
          )}

          {currentView === 'wizard' && (
            <CampaignWizard
              onCampaignCreated={handleCampaignCreated}
              userRole={userRole}
              currentUser={currentUser}
              companies={companies}
              vendors={vendors}
              addSystemLog={addSystemLog}
              addNotification={addNotification}
            />
          )}

          {currentView === 'monitor' && (
            <LiveMonitorView
              activeCampaign={activeCampaign}
              onCampaignStatusChange={handleCampaignStatusChange}
              addSystemLog={addSystemLog}
              addNotification={addNotification}
              onCampaignComplete={handleCampaignComplete}
              allVendors={vendors}
              settings={settings}
            />
          )}

          {currentView === 'companies' && (
            <CompanyManagementView
              companies={companies}
              users={users}
              currentUser={currentUser}
              onAddCompany={handleAddCompany}
              onUpdateCompany={handleUpdateCompany}
              onAddUser={handleAddUser}
              onToggleUserStatus={handleToggleUserStatus}
              onDeleteUser={handleDeleteUser}
              addSystemLog={addSystemLog}
              addNotification={addNotification}
            />
          )}

          {currentView === 'admin-approval' && (
            <AdminApprovalView
              campaigns={campaigns}
              onApproveCampaign={handleApproveCampaign}
              onRejectCampaign={handleRejectCampaign}
            />
          )}

          {currentView === 'vendors' && (
            <VendorsView
              vendors={vendors}
              onAddVendor={handleAddVendor}
              onUpdateVendor={handleUpdateVendor}
              onDeleteVendor={handleDeleteVendor}
              onClearAllVendors={handleClearAllVendors}
              userRole={userRole}
              addSystemLog={addSystemLog}
              addNotification={addNotification}
            />
          )}

          {currentView === 'history' && (
            <HistoryView
              campaigns={campaigns}
              addSystemLog={addSystemLog}
              addNotification={addNotification}
            />
          )}

          {currentView === 'reports' && (
            <ReportsView
              campaigns={campaigns}
              vendors={vendors}
              addSystemLog={addSystemLog}
              addNotification={addNotification}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={setSettings}
              userRole={userRole}
              addSystemLog={addSystemLog}
              addNotification={addNotification}
            />
          )}
        </main>

        {/* Footer Bar */}
        <footer className="h-8 bg-slate-100 border-t border-slate-200 px-4 flex items-center justify-between text-[10px] text-slate-500 font-medium select-none shrink-0 font-mono">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 font-bold text-slate-600">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              CLIENT-SIDE ISOLATED SHIELD: ACTIVE
            </div>
            <div>LATENCY: 12ms</div>
            <div>AIR-GAPPED DATA WALL: ON</div>
          </div>
          <div className="flex items-center gap-2">
            <span>© 2026 DISPATCHER CONSOLE v4.3.0</span>
            <button
              onClick={handleUserLogout}
              className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="Sign Out"
            >
              🔐
            </button>
          </div>
        </footer>
      </div>

    </div>
  );
}
