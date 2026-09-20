import React, { useState, useEffect } from 'react';
import { 
  X, 
  Film, 
  FileText, 
  Globe, 
  Sparkles, 
  Play, 
  Shuffle, 
  TrendingUp, 
  Check 
} from 'lucide-react';
import { parseFollowerText } from '../utils/facebookParser';
import { formatMetric } from '../utils/formatters';

const SAMPLE_REELS = [
  {
    type: 'reel',
    title: '5 Hidden AI Features Released Today 🔥',
    views: 555000
  },
  {
    type: 'reel',
    title: 'Secret Waterfall Cinematic Drone Shot 4K 🌊',
    views: 840000
  },
  {
    type: 'reel',
    title: 'Unreal Engine 5 Photorealistic World Reveal 🎮',
    views: 620000
  },
  {
    type: 'reel',
    title: 'From 0 to 1 Million Followers in 90 Days 🚀',
    views: 750000
  },
  {
    type: 'reel',
    title: 'Exclusive Behind The Scenes Studio Tour ✨',
    views: 555000
  },
  {
    type: 'post',
    title: 'Big Announcement: Our Next Chapter Begins Today!',
    views: 310000
  }
];

export default function ShiftReelModal({ isOpen, onClose, page, onShiftReel }) {
  if (!isOpen || !page) return null;

  const currentPost = page.latestPost || {
    type: 'reel',
    title: 'Latest Reel / Video',
    views: page.views || 555000,
    url: page.url ? `${page.url.replace(/\/+$/, '')}/videos` : 'https://www.facebook.com'
  };

  const [type, setType] = useState(currentPost.type || 'reel');
  const [title, setTitle] = useState('');
  const [viewsInput, setViewsInput] = useState('555k');
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (page) {
      setType(page.latestPost?.type || 'reel');
      setTitle('');
      setViewsInput(page.views ? String(page.views) : '555k');
      setUrl(page.latestPost?.url || (page.url ? `${page.url.replace(/\/+$/, '')}/videos` : ''));
    }
  }, [page]);

  const parsedViews = parseFollowerText(viewsInput) || 555000;

  const handlePickRandom = () => {
    const sample = SAMPLE_REELS[Math.floor(Math.random() * SAMPLE_REELS.length)];
    setType(sample.type);
    setTitle(sample.title);
    setViewsInput(formatMetric(sample.views));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalTitle = title.trim() || (type === 'reel' ? 'New Viral Public Reel' : 'New Public Page Post');
    const finalUrl = url.trim() || (page.url ? `${page.url.replace(/\/+$/, '')}/${type === 'reel' ? 'videos' : 'posts'}` : 'https://www.facebook.com');

    onShiftReel(page.id, {
      type,
      title: finalTitle,
      views: parsedViews,
      url: finalUrl,
      publishedAt: 'Just now',
      isNew: true
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#00e5ff" />
            <span>Shift to New Reel / Post</span>
          </div>
          <button 
            className="icon-btn-round" 
            onClick={onClose} 
            style={{ width: '32px', height: '32px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Current Active Reel Banner */}
        <div style={{
          background: 'rgba(0, 229, 255, 0.06)',
          border: '1px solid rgba(0, 229, 255, 0.2)',
          borderRadius: '12px',
          padding: '10px 14px',
          marginBottom: '14px',
          fontSize: '0.82rem'
        }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '3px' }}>
            Current Featured Content on {page.title}:
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentPost.title || 'Latest Content'}
            </span>
            <span style={{ color: '#00e5ff', fontFamily: 'var(--font-mono)', fontWeight: 700, flexShrink: 0 }}>
              {formatMetric(currentPost.views || page.views || 0)} views
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Content Type Selector */}
          <div>
            <label className="modal-label">Publish Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setType('reel')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px',
                  borderRadius: '10px',
                  border: type === 'reel' ? '1.5px solid #ff007a' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: type === 'reel' ? 'linear-gradient(135deg, rgba(255, 0, 122, 0.25) 0%, rgba(121, 40, 202, 0.25) 100%)' : '#131e36',
                  color: type === 'reel' ? '#ffffff' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Film size={16} color={type === 'reel' ? '#ff007a' : 'currentColor'} />
                <span>Public Reel</span>
              </button>

              <button
                type="button"
                onClick={() => setType('post')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px',
                  borderRadius: '10px',
                  border: type === 'post' ? '1.5px solid #1877f2' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: type === 'post' ? 'linear-gradient(135deg, rgba(24, 119, 242, 0.25) 0%, rgba(0, 229, 255, 0.25) 100%)' : '#131e36',
                  color: type === 'post' ? '#ffffff' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <FileText size={16} color={type === 'post' ? '#1877f2' : 'currentColor'} />
                <span>Public Post</span>
              </button>
            </div>
          </div>

          {/* Reel Title / Caption */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="modal-label" style={{ margin: 0 }}>
                {type === 'reel' ? 'Reel Headline / Topic' : 'Post Title / Headline'}
              </label>
              <button
                type="button"
                onClick={handlePickRandom}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#00e5ff',
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Shuffle size={12} />
                <span>Pick Trending Idea</span>
              </button>
            </div>
            <input 
              type="text" 
              className="url-text-input"
              style={{
                width: '100%',
                background: '#131e36',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff'
              }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'reel' ? 'e.g. Next-Gen Quantum AI Unboxing' : 'e.g. Scaling to 1M users in 90 days'}
            />
          </div>

          {/* Public Views Count */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="modal-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Play size={13} color="#00e676" />
                <span>Public Views Count</span>
              </label>
              <span style={{ color: '#00e676', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.8rem' }}>
                = {formatMetric(parsedViews)} ({parsedViews.toLocaleString()} views)
              </span>
            </div>
            <input 
              type="text" 
              className="url-text-input"
              style={{
                width: '100%',
                background: '#131e36',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1.5px solid rgba(0, 230, 118, 0.4)',
                fontFamily: 'var(--font-mono)',
                fontSize: '1rem',
                color: '#ffffff'
              }}
              value={viewsInput}
              onChange={(e) => setViewsInput(e.target.value)}
              placeholder="e.g. 555k or 555000 or 1.2M"
              required
            />
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
              Anyone on Facebook will see this public view count. You can enter <strong>555k</strong>, <strong>840k</strong>, or exact numbers.
            </span>
          </div>

          {/* Reel / Post Public URL */}
          <div>
            <label className="modal-label">Public Reel / Post Direct Link</label>
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
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.facebook.com/reel/..."
            />
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginTop: '3px' }}>
              Tapping the card opens this public link directly.
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{
                flex: 1,
                padding: '11px',
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
              style={{ flex: 1.5, justifyContent: 'center' }}
            >
              <Sparkles size={16} />
              <span>Shift to this {type === 'reel' ? 'Reel' : 'Post'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
