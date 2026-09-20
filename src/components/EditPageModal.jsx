import React, { useState, useEffect } from 'react';
import { X, Check, CheckCircle2 } from 'lucide-react';

export default function EditPageModal({ isOpen, onClose, page, onSave }) {
  if (!isOpen || !page) return null;

  const [title, setTitle] = useState(page.title || '');
  const [followers, setFollowers] = useState(page.followers || 0);
  const [growth, setGrowth] = useState(page.growth || 0);
  const [views, setViews] = useState(page.views || 0);
  const [pfp, setPfp] = useState(page.pfp || '');
  const [verified, setVerified] = useState(Boolean(page.verified));

  useEffect(() => {
    if (page) {
      setTitle(page.title || '');
      setFollowers(page.followers || 0);
      setGrowth(page.growth || 0);
      setViews(page.views || 0);
      setPfp(page.pfp || '');
      setVerified(Boolean(page.verified));
    }
  }, [page]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...page,
      title: title.trim(),
      followers: Number(followers) || 0,
      growth: Number(growth) || 0,
      views: Number(views) || 0,
      pfp: pfp.trim(),
      verified
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-title">
          <span>Edit Page Metrics</span>
          <button 
            className="icon-btn-round" 
            onClick={onClose} 
            style={{ width: '32px', height: '32px' }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="modal-label">Page / Profile Title</label>
            <input 
              type="text" 
              className="url-text-input"
              style={{
                width: '100%',
                background: '#131e36',
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="modal-label">Followers Count</label>
              <input 
                type="number" 
                className="url-text-input"
                style={{
                  width: '100%',
                  background: '#131e36',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
                value={followers}
                onChange={(e) => setFollowers(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="modal-label">Live Growth (+/-)</label>
              <input 
                type="number" 
                className="url-text-input"
                style={{
                  width: '100%',
                  background: '#131e36',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
                value={growth}
                onChange={(e) => setGrowth(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="modal-label">Views Count</label>
            <input 
              type="number" 
              className="url-text-input"
              style={{
                width: '100%',
                background: '#131e36',
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
              value={views}
              onChange={(e) => setViews(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="modal-label">Avatar / PFP Image URL</label>
            <input 
              type="url" 
              className="url-text-input"
              style={{
                width: '100%',
                background: '#131e36',
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
              value={pfp}
              onChange={(e) => setPfp(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
            <input 
              type="checkbox"
              id="verified-check"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#1877f2', cursor: 'pointer' }}
            />
            <label htmlFor="verified-check" style={{ fontSize: '0.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={15} color="#1877f2" />
              <span>Verified Facebook Blue Badge</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '12px',
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
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <Check size={16} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
