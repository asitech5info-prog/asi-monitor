import React, { useState, useEffect, useRef } from 'react';
import { X, Check, CheckCircle2, Eye, Users } from 'lucide-react';
import { parseFollowerText } from '../utils/facebookParser';
import { formatMetric } from '../utils/formatters';

export default function EditPageModal({ isOpen, onClose, page, onSave, initialFocus = 'views' }) {
  if (!isOpen || !page) return null;

  const [title, setTitle] = useState(page.title || '');
  const [followersInput, setFollowersInput] = useState(String(page.followers || 0));
  const [growth, setGrowth] = useState(page.growth || 0);
  const [viewsInput, setViewsInput] = useState(String(page.views || 0));
  const [pfp, setPfp] = useState(page.pfp || '');
  const [verified, setVerified] = useState(Boolean(page.verified));

  const viewsInputRef = useRef(null);
  const followersInputRef = useRef(null);

  useEffect(() => {
    if (page) {
      setTitle(page.title || '');
      setFollowersInput(String(page.followers || 0));
      setGrowth(page.growth || 0);
      setViewsInput(String(page.views || 0));
      setPfp(page.pfp || '');
      setVerified(Boolean(page.verified));
    }
  }, [page]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (initialFocus === 'views' && viewsInputRef.current) {
          viewsInputRef.current.focus();
          viewsInputRef.current.select();
        } else if (initialFocus === 'followers' && followersInputRef.current) {
          followersInputRef.current.focus();
          followersInputRef.current.select();
        }
      }, 100);
    }
  }, [isOpen, initialFocus]);

  const parsedFollowers = parseFollowerText(followersInput);
  const parsedViews = parseFollowerText(viewsInput);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...page,
      title: title.trim() || 'Facebook Page',
      followers: parsedFollowers,
      growth: Number(growth) || 0,
      views: parsedViews,
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
              <label className="modal-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={13} color="#00e676" /> Followers
                </span>
                <span style={{ color: '#00e676', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                  {formatMetric(parsedFollowers)}
                </span>
              </label>
              <input 
                ref={followersInputRef}
                type="text" 
                className="url-text-input"
                style={{
                  width: '100%',
                  background: '#131e36',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontFamily: 'var(--font-mono)'
                }}
                value={followersInput}
                onChange={(e) => setFollowersInput(e.target.value)}
                placeholder="e.g. 2500 or 2.5k"
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
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontFamily: 'var(--font-mono)'
                }}
                value={growth}
                onChange={(e) => setGrowth(e.target.value)}
              />
            </div>
          </div>

          {/* Views Input (supports 555k, 555000, 1.2M, etc.) */}
          <div>
            <label className="modal-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Eye size={14} color="#38bdf8" /> Total Views Count
              </span>
              <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.8rem' }}>
                = {formatMetric(parsedViews)} ({parsedViews.toLocaleString()})
              </span>
            </label>
            <input 
              ref={viewsInputRef}
              type="text" 
              className="url-text-input"
              style={{
                width: '100%',
                background: '#131e36',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1.5px solid rgba(56, 189, 248, 0.5)',
                fontFamily: 'var(--font-mono)',
                fontSize: '1rem',
                color: '#ffffff'
              }}
              value={viewsInput}
              onChange={(e) => setViewsInput(e.target.value)}
              placeholder="e.g. 555k or 555000"
              required
            />
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
              Tip: You can type <strong>555k</strong>, <strong>555000</strong>, or <strong>1.2M</strong>.
            </span>
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
