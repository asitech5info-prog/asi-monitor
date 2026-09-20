import React from 'react';
import { X, RotateCcw, Zap, Clock, ShieldCheck } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  refreshInterval,
  setRefreshInterval,
  isLiveSimActive,
  setIsLiveSimActive,
  onResetDefaults,
  metaToken,
  setMetaToken
}) {
  if (!isOpen) return null;

  const intervals = [
    { label: '5s', value: 5000 },
    { label: '10s', value: 10000 },
    { label: '30s', value: 30000 },
    { label: '60s', value: 60000 },
    { label: 'Manual', value: 0 }
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-title">
          <span>ASI Monitor Settings</span>
          <button 
            className="icon-btn-round" 
            onClick={onClose} 
            style={{ width: '32px', height: '32px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Auto Refresh Frequency */}
        <div className="modal-section">
          <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={15} color="#00e5ff" />
            <span>Auto-Refresh Polling Interval</span>
          </label>
          <div className="interval-pill-group">
            {intervals.map((intv) => (
              <button
                key={intv.label}
                className={`interval-pill ${refreshInterval === intv.value ? 'active' : ''}`}
                onClick={() => setRefreshInterval(intv.value)}
              >
                {intv.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Growth Simulator */}
        <div className="toggle-row">
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={16} color="#00e676" />
              <span>Real-Time Growth Engine</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
              Simulates live follower & view ticks in real time
            </div>
          </div>
          <input 
            type="checkbox"
            checked={isLiveSimActive}
            onChange={(e) => setIsLiveSimActive(e.target.checked)}
            style={{ width: '20px', height: '20px', accentColor: '#00e5ff', cursor: 'pointer' }}
          />
        </div>

        {/* Optional Meta Graph API Token */}
        <div className="modal-section" style={{ marginTop: '16px' }}>
          <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={15} color="#1877f2" />
            <span>Meta Graph API Token (Optional)</span>
          </label>
          <input 
            type="password"
            className="url-text-input"
            style={{ 
              width: '100%', 
              background: '#131e36', 
              padding: '10px 14px', 
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '0.85rem'
            }}
            placeholder="EAA..."
            value={metaToken}
            onChange={(e) => setMetaToken(e.target.value)}
          />
          <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
            Enter your Page Access Token for official rate-limit-free Facebook Insights.
          </span>
        </div>

        {/* Reset Defaults */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button 
            className="menu-item-action" 
            onClick={() => {
              if (window.confirm('Reset to the default 4 sample pages from the mockup?')) {
                onResetDefaults();
                onClose();
              }
            }}
            style={{ width: '100%', justifyContent: 'center', color: '#38bdf8' }}
          >
            <RotateCcw size={15} />
            <span>Restore 4 Default Mockup Pages</span>
          </button>
        </div>
      </div>
    </div>
  );
}
