import React from 'react';
import { Menu, Bell, RefreshCw } from 'lucide-react';

export default function HeaderBar({ 
  onOpenMenu,
  onOpenNotifications, 
  unreadCount = 0, 
  isRefreshing = false, 
  onForceRefreshAll
}) {
  return (
    <header className="app-header">
      <div className="app-header-left">
        <button 
          className="icon-btn-round hamburger-menu-btn"
          onClick={onOpenMenu}
          title="Open Navigation Menu"
          aria-label="Open Navigation Menu"
        >
          <Menu size={20} />
        </button>

        <div className="app-title-group">
          <h1 className="app-brand-title">ASI Monitor</h1>
        </div>
      </div>

      <div className="header-actions">
        {/* Only Refresh and Notifications buttons remain in header */}
        <button 
          className="icon-btn-round header-refresh-btn" 
          onClick={onForceRefreshAll} 
          title="Refresh All Pages Now"
          aria-label="Refresh All Pages"
        >
          <RefreshCw 
            size={17} 
            className={isRefreshing ? 'animate-spin' : ''} 
            style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} 
          />
        </button>

        <button 
          className="icon-btn-round header-notifs-btn" 
          onClick={onOpenNotifications} 
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span className="badge-counter-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>
      </div>
    </header>
  );
}
