import React from 'react';
import { 
  X, 
  Activity, 
  StickyNote, 
  ArrowUpDown, 
  Bell, 
  Settings, 
  RefreshCw, 
  Radio, 
  ChevronRight,
  ShieldCheck,
  BarChart3
} from 'lucide-react';

export default function HamburgerDrawer({
  isOpen,
  onClose,
  currentView,
  onSelectView,
  onOpenNotifications,
  unreadNotifs = 0,
  onOpenSettings,
  isReorderMode,
  onToggleReorderMode,
  onForceRefreshAll,
  isRefreshing
}) {
  if (!isOpen) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div 
        className="hamburger-drawer-panel" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Navigation Menu"
      >
        {/* Drawer Header with App Name & Version */}
        <div className="drawer-header">
          <div className="drawer-brand-wrap">
            <div className="drawer-logo-icon">
              <div className="drawer-logo-fallback">
                <Activity size={22} color="#00e5ff" />
              </div>
            </div>
            <div className="drawer-brand-text">
              <div className="drawer-title-row">
                <span className="drawer-title">ASI Monitor</span>
                <span className="version-pill">v1.2.0</span>
              </div>
              <span className="drawer-subtitle">
                <Radio size={10} color="#00e676" style={{ display: 'inline', marginRight: '4px' }} />
                Real-Time Live Engine
              </span>
            </div>
          </div>
          <button 
            className="icon-btn-round drawer-close-btn" 
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="drawer-nav-list">
          <div className="drawer-section-label">MAIN APPLICATION</div>

          {/* 1. Live Monitor Dashboard */}
          <button 
            className={`drawer-nav-item ${currentView === 'monitor' ? 'active' : ''}`}
            onClick={() => {
              onSelectView('monitor');
              onClose();
            }}
          >
            <div className="drawer-nav-icon-wrap monitor-icon">
              <Activity size={18} />
            </div>
            <div className="drawer-nav-content">
              <span className="drawer-nav-title">Live Monitor</span>
              <span className="drawer-nav-desc">Track Facebook pages & followers</span>
            </div>
            <ChevronRight size={16} className="drawer-arrow" />
          </button>

          {/* 2. NOTES (Renamed from Keep Notes, description removed as requested) */}
          <button 
            className={`drawer-nav-item ${currentView === 'notes' ? 'active' : ''}`}
            onClick={() => {
              onSelectView('notes');
              onClose();
            }}
          >
            <div className="drawer-nav-icon-wrap notes-icon">
              <StickyNote size={18} />
            </div>
            <div className="drawer-nav-content">
              <span className="drawer-nav-title">NOTES</span>
            </div>
            <ChevronRight size={16} className="drawer-arrow" />
          </button>

          {/* 3. Analytics Graph */}
          <button 
            className={`drawer-nav-item ${currentView === 'analytics' ? 'active' : ''}`}
            onClick={() => {
              onSelectView('analytics');
              onClose();
            }}
          >
            <div className="drawer-nav-icon-wrap analytics-icon">
              <BarChart3 size={18} />
            </div>
            <div className="drawer-nav-content">
              <span className="drawer-nav-title">Analytics Graph</span>
              <span className="drawer-nav-desc">Visual growth trends & page charts</span>
            </div>
            <ChevronRight size={16} className="drawer-arrow" />
          </button>

          <div className="drawer-section-label" style={{ marginTop: '14px' }}>MONITOR TOOLS</div>

          {/* 4. Rearrange Pages */}
          <button 
            className={`drawer-nav-item ${isReorderMode ? 'active' : ''}`}
            onClick={() => {
              onToggleReorderMode();
              if (currentView !== 'monitor') {
                onSelectView('monitor');
              }
              onClose();
            }}
          >
            <div className="drawer-nav-icon-wrap reorder-icon">
              <ArrowUpDown size={18} />
            </div>
            <div className="drawer-nav-content">
              <span className="drawer-nav-title">Rearrange Pages</span>
              <span className="drawer-nav-desc">
                {isReorderMode ? 'Exit reordering mode' : 'Custom reorder top / middle / bottom'}
              </span>
            </div>
            <span className={`toggle-pill ${isReorderMode ? 'pill-active' : ''}`}>
              {isReorderMode ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* 5. Sync All Live */}
          <button 
            className="drawer-nav-item"
            onClick={() => {
              onForceRefreshAll();
              onClose();
            }}
          >
            <div className="drawer-nav-icon-wrap refresh-icon">
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            </div>
            <div className="drawer-nav-content">
              <span className="drawer-nav-title">Sync All Live</span>
              <span className="drawer-nav-desc">Force live check on all pages</span>
            </div>
          </button>

          {/* 6. Notifications / Activity */}
          <button 
            className="drawer-nav-item"
            onClick={() => {
              onClose();
              onOpenNotifications();
            }}
          >
            <div className="drawer-nav-icon-wrap bell-icon">
              <Bell size={18} />
            </div>
            <div className="drawer-nav-content">
              <span className="drawer-nav-title">Activity & Alerts</span>
              <span className="drawer-nav-desc">Follower updates & alerts</span>
            </div>
            {unreadNotifs > 0 && (
              <span className="drawer-badge-count">{unreadNotifs}</span>
            )}
          </button>

          {/* 7. Settings */}
          <button 
            className="drawer-nav-item"
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
          >
            <div className="drawer-nav-icon-wrap settings-icon">
              <Settings size={18} />
            </div>
            <div className="drawer-nav-content">
              <span className="drawer-nav-title">Settings</span>
              <span className="drawer-nav-desc">Polling rate & Graph API token</span>
            </div>
            <ChevronRight size={16} className="drawer-arrow" />
          </button>
        </div>

        {/* Drawer Footer */}
        <div className="drawer-footer">
          <div className="drawer-footer-card">
            <ShieldCheck size={16} color="#00e676" />
            <div className="footer-card-text">
              <span className="footer-title">ASI Monitor Security</span>
              <span className="footer-desc">Direct live fetching with zero third-party leakage</span>
            </div>
          </div>
          <span className="drawer-copyright">ASI Monitor v1.2.0 • AMOLED Edition</span>
        </div>
      </div>
    </div>
  );
}
