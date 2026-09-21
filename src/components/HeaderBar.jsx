import React from 'react';
import { Menu, Bell, Settings, RefreshCw, ArrowUpDown, StickyNote } from 'lucide-react';

export default function HeaderBar({ 
  onOpenMenu,
  onOpenSettings, 
  onOpenNotifications, 
  unreadCount = 0, 
  isRefreshing = false, 
  onForceRefreshAll,
  isReorderMode,
  onToggleReorderMode,
  onOpenNotes
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
          <div className="app-header-logo-icon">
            <img 
              src="/app-icon.png" 
              alt="Logo" 
              className="header-mini-logo"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <h1 className="app-brand-title">ASI Monitor</h1>
        </div>
      </div>

      <div className="header-actions">
        {/* Quick Keep Notes Shortcut */}
        <button 
          className="icon-btn-round" 
          onClick={onOpenNotes} 
          title="Keep Notes"
          aria-label="Keep Notes"
        >
          <StickyNote size={17} />
        </button>

        {/* Quick Reorder Shortcut */}
        <button 
          className={`icon-btn-round ${isReorderMode ? 'reorder-btn-active' : ''}`}
          onClick={onToggleReorderMode} 
          title={isReorderMode ? 'Done Reordering' : 'Rearrange Pages'}
          aria-label="Rearrange Pages"
        >
          <ArrowUpDown size={17} color={isReorderMode ? '#00e5ff' : 'currentColor'} />
        </button>

        <button 
          className="icon-btn-round" 
          onClick={onForceRefreshAll} 
          title="Refresh All Pages Now"
          aria-label="Refresh All Pages"
        >
          <RefreshCw size={17} className={isRefreshing ? 'animate-spin' : ''} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
        </button>

        <button 
          className="icon-btn-round" 
          onClick={onOpenNotifications} 
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell size={17} />
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
          <Settings size={17} />
        </button>
      </div>
    </header>
  );
}
