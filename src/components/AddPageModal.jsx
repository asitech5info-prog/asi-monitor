import React, { useState, useEffect } from 'react';
import { X, Plus, CheckCircle2, Users, Sparkles } from 'lucide-react';
import { formatExactFollowers } from '../utils/formatters';
import { parseFollowerText } from '../utils/facebookParser';

export default function AddPageModal({ isOpen, onClose, initialData, onConfirmAdd }) {
  if (!isOpen || !initialData) return null;

  const [title, setTitle] = useState(initialData.title || '');
  const [url, setUrl] = useState(initialData.url || '');
  const [followersInput, setFollowersInput] = useState(String(initialData.followers !== undefined && initialData.followers > 0 ? initialData.followers : 2354));
  const [pfp, setPfp] = useState(initialData.pfp || '');
  const [verified, setVerified] = useState(Boolean(initialData.verified));

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setUrl(initialData.url || '');
      setFollowersInput(String(initialData.followers !== undefined && initialData.followers > 0 ? initialData.followers : 2354));
      setPfp(initialData.pfp || '');
      setVerified(Boolean(initialData.verified));
    }
  }, [initialData]);

  const parsedFollowers = parseFollowerText(followersInput);

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalTitle = title.trim() || 'Facebook Page';
    const finalFollowers = parsedFollowers > 0 ? parsedFollowers : 2354;
    onConfirmAdd({
      ...initialData,
      title: finalTitle,
      url: url.trim() || initialData.url || `https://www.facebook.com/${finalTitle.toLowerCase().replace(/\s+/g, '')}`,
      followers: finalFollowers,
      initialFollowers: finalFollowers,
      growth: 0,
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
            <span>Add Facebook Page</span>
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
              src={pfp || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(title || 'page')}`} 
              alt={title} 
              style={{ width: '52px', height: '52px', borderRadius: '50%', border: '2px solid #00e5ff', objectFit: 'cover' }}
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(title || 'FB')}&background=1877F2&color=fff&size=256&bold=true`;
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <label className="modal-label" style={{ marginBottom: '4px' }}>Page Title</label>
              <input 
                type="text" 
                className="url-text-input modal-input-field"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. My Facebook Page"
                required
              />
            </div>
          </div>

          <div>
            <label className="modal-label">Facebook URL</label>
            <input 
              type="text" 
              className="url-text-input modal-input-field"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.facebook.com/..."
            />
          </div>

          <div>
            <label className="modal-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Users size={14} color="#00e676" /> Exact Followers
              </span>
              <span style={{ color: '#00e676', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem' }}>
                = {formatExactFollowers(parsedFollowers)}
              </span>
            </label>
            <input 
              type="text" 
              className="url-text-input modal-input-field highlighted-input"
              value={followersInput}
              onChange={(e) => setFollowersInput(e.target.value)}
              placeholder="e.g. 2354"
              required
            />
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginTop: '3px' }}>
              Exact count without rounding (e.g. <strong>2354</strong> displays as <strong>2,354</strong>).
            </span>
          </div>

          <div>
            <label className="modal-label">Avatar / Profile Picture URL (Optional)</label>
            <input 
              type="text" 
              className="url-text-input modal-input-field"
              value={pfp}
              onChange={(e) => setPfp(e.target.value)}
              placeholder="https://... (leave blank for automatic avatar)"
            />
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
              className="modal-cancel-btn"
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
