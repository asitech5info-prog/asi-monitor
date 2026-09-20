import React, { useState, useEffect, useRef } from 'react';
import { X, Check, CheckCircle2, Users, TrendingUp } from 'lucide-react';
import { parseFollowerText } from '../utils/facebookParser';
import { formatExactFollowers } from '../utils/formatters';

export default function EditPageModal({ isOpen, onClose, page, onSave, initialFocus = 'followers' }) {
  if (!isOpen || !page) return null;

  const [title, setTitle] = useState(page.title || '');
  const [followersInput, setFollowersInput] = useState(String(page.followers || 0));
  const [growth, setGrowth] = useState(page.growth || 0);
  const [pfp, setPfp] = useState(page.pfp || '');
  const [verified, setVerified] = useState(Boolean(page.verified));

  const followersInputRef = useRef(null);

  useEffect(() => {
    if (page) {
      setTitle(page.title || '');
      setFollowersInput(String(page.followers || 0));
      setGrowth(page.growth || 0);
      setPfp(page.pfp || '');
      setVerified(Boolean(page.verified));
    }
  }, [page]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (followersInputRef.current) {
          followersInputRef.current.focus();
          followersInputRef.current.select();
        }
      }, 100);
    }
  }, [isOpen]);

  const parsedFollowers = parseFollowerText(followersInput);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...page,
      title: title.trim() || 'Facebook Page',
      followers: parsedFollowers,
      growth: Number(growth) || 0,
      pfp: pfp.trim(),
      verified
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-title">
          <span>Edit Follower Metrics</span>
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
              className="url-text-input modal-input-field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="modal-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Users size={14} color="#00e676" /> Exact Follower Count
              </span>
              <span style={{ color: '#00e676', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem' }}>
                = {formatExactFollowers(parsedFollowers)} followers
              </span>
            </label>
            <input 
              ref={followersInputRef}
              type="text" 
              className="url-text-input modal-input-field highlighted-input"
              value={followersInput}
              onChange={(e) => setFollowersInput(e.target.value)}
              placeholder="e.g. 2354 or 2,354"
              required
            />
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginTop: '3px' }}>
              Type exact number like <strong>2354</strong> or <strong>2,354</strong>. It will display accurately with commas.
            </span>
          </div>

          <div>
            <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <TrendingUp size={13} color="#38bdf8" /> Live Growth (+/-)
            </label>
            <input 
              type="number" 
              className="url-text-input modal-input-field"
              value={growth}
              onChange={(e) => setGrowth(e.target.value)}
              placeholder="0"
            />
          </div>

          <div>
            <label className="modal-label">Avatar / Profile Picture URL</label>
            <input 
              type="url" 
              className="url-text-input modal-input-field"
              value={pfp}
              onChange={(e) => setPfp(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
            <input 
              type="checkbox"
              id="edit-verified-check"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#1877f2', cursor: 'pointer' }}
            />
            <label htmlFor="edit-verified-check" style={{ fontSize: '0.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={15} color="#1877f2" />
              <span>Verified Facebook Blue Badge</span>
            </label>
          </div>

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
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <Check size={16} />
              <span>Save Accurate Metrics</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
