import React from 'react';
import { Bell, Settings, RefreshCw, Zap } from 'lucide-react';

export default function HeaderBar({ 
  onOpenSettings, 
  onOpenNotifications, 
  unreadCount = 0, 
  isRefreshing = false, 
  onForceRefreshAll,
  isLiveSimActive
}) {
  return (
    <header className="app-header">
      <div className="app-title-group">
        <img src="/logo.svg" alt="ASI Logo" className="app-logo-badge" />
        <h1 className="app-brand-title">ASI Monitor</h1>
        <div className="live-pill-badge" title="Live Real-Time Tracker Active">
          <div className="live-dot-pulse" />
          <span>LIVE</span>
        </div>
      </div>

      <div className="header-actions">
        <button 
          className="icon-btn-round" 
          onClick={onForceRefreshAll} 
          title="Refresh All Pages Now"
          aria-label="Refresh All Pages"
        >
          <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
        </button>

        <button 
          className="icon-btn-round" 
          onClick={onOpenNotifications} 
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="badge-counter-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>

        <button 
          className="icon-btn-round" 
          onClick={onOpenSettings} 
          title="Settings & Monitor Frequency"
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
