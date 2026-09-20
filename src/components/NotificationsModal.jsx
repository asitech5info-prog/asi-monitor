import React from 'react';
import { X, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';
import { formatGrowth } from '../utils/formatters';

export default function NotificationsModal({ isOpen, onClose, notifications = [], onClear }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#00e5ff" />
            <span>Live Activity Feed</span>
          </div>
          <button 
            className="icon-btn-round" 
            onClick={onClose} 
            style={{ width: '32px', height: '32px' }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b' }}>
              No recent activity. Real-time updates will appear here as pages gain followers and views.
            </div>
          ) : (
            notifications.map((item) => (
              <div 
                key={item.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <div 
                  style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '50%', 
                    background: 'rgba(0, 230, 118, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00e676',
                    flexShrink: 0
                  }}
                >
                  <TrendingUp size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#00e676', fontWeight: 600 }}>
                    {item.message}
                  </div>
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                  {item.time}
                </div>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={onClear}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '0.78rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Clear activity feed
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
