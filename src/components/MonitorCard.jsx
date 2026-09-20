import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  MoreVertical, 
  TrendingUp, 
  ExternalLink, 
  Trash2, 
  RefreshCw, 
  Edit3,
  Film,
  FileText,
  Globe,
  Sparkles,
  Play,
  Shuffle
} from 'lucide-react';
import { formatMetric, formatGrowth } from '../utils/formatters';

export default function MonitorCard({ 
  page, 
  onDelete, 
  onRefresh, 
  onEdit, 
  onOpenShift,
  onQuickShift,
  isRefreshing 
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [hasPopped, setHasPopped] = useState(false);
  const [isShifting, setIsShifting] = useState(false);

  const prevFollowersRef = useRef(page.followers);
  const prevPostIdRef = useRef(page.latestPost?.id || page.latestPost?.title);
  const menuRef = useRef(null);

  // Latest Post/Reel fallback
  const latestPost = page.latestPost || {
    id: 'post-default',
    type: 'reel',
    title: 'Latest Public Reel / Video',
    views: page.views || 555000,
    publishedAt: 'Latest',
    url: page.url ? `${page.url.replace(/\/+$/, '')}/videos` : 'https://www.facebook.com',
    isNew: false
  };

  // Trigger flash animation when followers count updates
  useEffect(() => {
    if (prevFollowersRef.current !== page.followers) {
      setIsFlashing(true);
      setHasPopped(true);
      const flashTimer = setTimeout(() => setIsFlashing(false), 900);
      const popTimer = setTimeout(() => setHasPopped(false), 600);
      prevFollowersRef.current = page.followers;
      return () => {
        clearTimeout(flashTimer);
        clearTimeout(popTimer);
      };
    }
  }, [page.followers]);

  // Trigger smooth shift animation when new reel/post is published or shifted
  useEffect(() => {
    const currentPostKey = page.latestPost?.id || page.latestPost?.title || page.views;
    if (prevPostIdRef.current && prevPostIdRef.current !== currentPostKey) {
      setIsShifting(true);
      const shiftTimer = setTimeout(() => setIsShifting(false), 850);
      prevPostIdRef.current = currentPostKey;
      return () => clearTimeout(shiftTimer);
    }
    prevPostIdRef.current = currentPostKey;
  }, [page.latestPost, page.views]);

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  return (
    <div className={`monitor-row-card ${isFlashing ? 'just-updated' : ''}`}>
      {/* PFP Avatar */}
      <div className="card-pfp-wrapper">
        <img 
          src={page.pfp} 
          alt={page.title} 
          className="card-avatar-img"
          onError={(e) => {
            e.target.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(page.title)}`;
          }}
        />
        {page.verified && (
          <CheckCircle2 
            size={18} 
            className="verified-badge-icon" 
            fill="#1877f2" 
            color="#ffffff" 
          />
        )}
      </div>

      {/* Main Card Content */}
      <div className="card-details-wrapper">
        {/* Page Title & Dropdown Trigger */}
        <div className="card-title-header">
          <span className="card-page-title" title={page.title}>{page.title}</span>
          <button 
            className="card-menu-trigger" 
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Options"
          >
            <MoreVertical size={18} />
          </button>
        </div>

        {/* Dynamic Row: Left is Followers, Right is Public Latest Reel/Post Viewer Card */}
        <div className="card-metrics-grid">
          {/* Followers Column */}
          <div 
            className="metric-col-followers" 
            onClick={() => onEdit && onEdit(page, 'followers')}
            title={`${page.followers.toLocaleString()} exact followers (tap to edit)`}
            style={{ cursor: 'pointer' }}
          >
            <div className="followers-count-row">
              <span className="followers-main-number">
                {formatMetric(page.followers)}
              </span>
              <div className={`growth-pill-badge ${hasPopped ? 'pulse-pop' : ''}`}>
                <TrendingUp size={11} strokeWidth={2.5} />
                <span>{formatGrowth(page.growth || 0)}</span>
              </div>
            </div>
            <span className="metric-micro-label">Followers (tap to edit)</span>
          </div>

          {/* Public Latest Reel or Post Viewer Card */}
          <div 
            className={`latest-reel-viewer-card ${isShifting ? 'shifting-active' : ''} ${latestPost.isNew ? 'is-new-published' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              const targetUrl = latestPost.url || (page.url ? `${page.url.replace(/\/+$/, '')}/videos` : 'https://www.facebook.com');
              window.open(targetUrl, '_blank', 'noopener,noreferrer');
            }}
            title={`Public ${latestPost.type === 'reel' ? 'Reel' : 'Post'}: "${latestPost.title}" • ${latestPost.views.toLocaleString()} views. Tap to view on Facebook.`}
          >
            {/* Top Meta: Reel/Post Pill + Public Globe + Time */}
            <div className="reel-card-meta-bar">
              <div className="reel-pill-tags">
                <span className={`reel-type-pill ${latestPost.type === 'reel' ? 'pill-reel' : 'pill-post'}`}>
                  {latestPost.type === 'reel' ? <Film size={10} /> : <FileText size={10} />}
                  <span>{latestPost.type === 'reel' ? 'REEL' : 'POST'}</span>
                </span>
                <span className="reel-public-pill">
                  <Globe size={9} />
                  <span>PUBLIC</span>
                </span>
                {latestPost.isNew && (
                  <span className="reel-fire-pill">
                    <Sparkles size={9} />
                    <span>NEW</span>
                  </span>
                )}
              </div>
              <span className="reel-time-label">{latestPost.publishedAt || 'Latest'}</span>
            </div>

            {/* Views Count Line */}
            <div className="reel-card-views-row">
              <Play size={13} className="reel-play-icon" fill="#00e5ff" color="#00e5ff" />
              <span className="reel-views-digits">{formatMetric(latestPost.views)}</span>
              <span className="reel-views-suffix">views</span>
            </div>

            {/* Reel / Post Title Snippet */}
            <div className="reel-card-title-text" title={latestPost.title}>
              {latestPost.title}
            </div>

            {/* Action Footer */}
            <div className="reel-card-footer">
              <span className="reel-open-action">
                <span>Public Link</span>
                <ExternalLink size={10} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Dropdown Menu */}
      {showMenu && (
        <div className="card-dropdown-menu" ref={menuRef}>
          <button 
            className="menu-item-action"
            onClick={() => {
              setShowMenu(false);
              const targetUrl = latestPost.url || (page.url ? `${page.url.replace(/\/+$/, '')}/videos` : 'https://www.facebook.com');
              window.open(targetUrl, '_blank', 'noopener,noreferrer');
            }}
          >
            <Play size={14} color="#00e5ff" />
            <span>Watch Public Reel</span>
          </button>

          <button 
            className="menu-item-action"
            onClick={() => {
              setShowMenu(false);
              if (onOpenShift) onOpenShift(page);
            }}
          >
            <Sparkles size={14} color="#ff007a" />
            <span>Shift to New Reel / Post</span>
          </button>

          <button 
            className="menu-item-action"
            onClick={() => {
              setShowMenu(false);
              if (onQuickShift) onQuickShift(page.id);
            }}
          >
            <Shuffle size={14} color="#38bdf8" />
            <span>Quick Shift (Simulate)</span>
          </button>

          <button 
            className="menu-item-action"
            onClick={() => {
              setShowMenu(false);
              window.open(page.url, '_blank', 'noopener,noreferrer');
            }}
          >
            <ExternalLink size={14} />
            <span>Open Page on FB</span>
          </button>

          <button 
            className="menu-item-action"
            onClick={() => {
              setShowMenu(false);
              onRefresh(page);
            }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Refresh Live</span>
          </button>

          <button 
            className="menu-item-action"
            onClick={() => {
              setShowMenu(false);
              onEdit(page);
            }}
          >
            <Edit3 size={14} />
            <span>Edit Metrics</span>
          </button>

          <button 
            className="menu-item-action delete-item"
            onClick={() => {
              setShowMenu(false);
              onDelete(page.id);
            }}
          >
            <Trash2 size={14} />
            <span>Remove</span>
          </button>
        </div>
      )}
    </div>
  );
}
