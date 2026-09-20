import React, { useState, useEffect } from 'react';
import { X, Plus, CheckCircle2, Eye, Users, Sparkles } from 'lucide-react';
import { formatMetric, parseMetric } from '../utils/formatters';

export default function AddPageModal({ isOpen, onClose, initialData, onConfirmAdd }) {
  if (!isOpen || !initialData) return null;

  const [title, setTitle] = useState(initialData.title || '');
  const [followers, setFollowers] = useState(initialData.followers || 450000);
  const [views, setViews] = useState(initialData.views || 1200000);
  const [pfp, setPfp] = useState(initialData.pfp || '');
  const [verified, setVerified] = useState(Boolean(initialData.verified));

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setFollowers(initialData.followers || 450000);
      setViews(initialData.views || 1200000);
      setPfp(initialData.pfp || '');
      setVerified(Boolean(initialData.verified));
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirmAdd({
      ...initialData,
      title: title.trim() || 'Facebook Page',
      followers: Number(followers) || 100000,
      views: Number(views) || 300000,
      pfp: pfp.trim(),
      verified
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#00e5ff" />
            <span>Add to Page Monitor</span>
          </div>
          <button 
            className="icon-btn-round" 
            onClick={onClose} 
            style={{ width: '32px', height: '32px' }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Avatar Preview & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '16px' }}>
            <img 
              src={pfp} 
              alt={title} 
              style={{ width: '54px', height: '54px', borderRadius: '50%', border: '2px solid #00e5ff', objectFit: 'cover' }}
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=1877F2&color=fff&size=256&bold=true`;
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <label className="modal-label" style={{ marginBottom: '4px' }}>Page Title</label>
              <input 
                type="text" 
                className="url-text-input"
                style={{
                  width: '100%',
                  background: '#131e36',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontWeight: 600
                }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Metric Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Users size={14} color="#00e676" />
                <span>Followers</span>
              </label>
              <input 
                type="number" 
                className="url-text-input"
                style={{
                  width: '100%',
                  background: '#131e36',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontFamily: 'var(--font-mono)'
                }}
                value={followers}
                onChange={(e) => setFollowers(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginTop: '3px' }}>
                Preview: {formatMetric(followers)}
              </span>
            </div>

            <div>
              <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Eye size={14} color="#38bdf8" />
                <span>Views Count</span>
              </label>
              <input 
                type="number" 
                className="url-text-input"
                style={{
                  width: '100%',
                  background: '#131e36',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontFamily: 'var(--font-mono)'
                }}
                value={views}
                onChange={(e) => setViews(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginTop: '3px' }}>
                Preview: {formatMetric(views)}
              </span>
            </div>
          </div>

          {/* Verified Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
            <input 
              type="checkbox"
              id="verified-badge-checkbox"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#1877f2', cursor: 'pointer' }}
            />
            <label htmlFor="verified-badge-checkbox" style={{ fontSize: '0.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={16} color="#1877f2" />
              <span>Facebook Verified Blue Badge</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{
                flex: 1,
                padding: '11px',
                borderRadius: '14px',
                background: '#1e293b',
                color: '#94a3b8',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="add-btn"
              style={{ flex: 1.4, justifyContent: 'center' }}
            >
              <Plus size={18} strokeWidth={3} />
              <span>Add to Monitor</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
