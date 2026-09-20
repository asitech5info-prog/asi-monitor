import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  Eye, 
  MoreVertical, 
  TrendingUp, 
  ExternalLink, 
  Trash2, 
  RefreshCw, 
  Edit3 
} from 'lucide-react';
import { formatMetric, formatGrowth } from '../utils/formatters';

export default function MonitorCard({ 
  page, 
  onDelete, 
  onRefresh, 
  onEdit, 
  isRefreshing 
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [hasPopped, setHasPopped] = useState(false);
  const prevFollowersRef = useRef(page.followers);
  const menuRef = useRef(null);

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

      {/* Main Card Info */}
      <div className="card-details-wrapper">
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

        {/* Metrics Row: Followers & Views */}
        <div className="card-metrics-grid">
          {/* Followers Column - Click to edit */}
          <div 
            className="metric-col-followers" 
            onClick={() => onEdit(page, 'followers')}
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

          {/* Views Column - Click to edit */}
          <div 
            className="metric-col-views"
            onClick={() => onEdit(page, 'views')}
            title={`${page.views.toLocaleString()} exact views (tap to edit)`}
            style={{ cursor: 'pointer' }}
          >
            <div className="views-count-row">
              <Eye size={16} className="views-eye-icon" />
              <span className="views-main-number">
                {formatMetric(page.views)}
              </span>
            </div>
            <span className="metric-micro-label">Views (tap to edit)</span>
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
              window.open(page.url, '_blank', 'noopener,noreferrer');
            }}
          >
            <ExternalLink size={14} />
            <span>Open on FB</span>
          </button>

          <button 
            className="menu-item-action"
            onClick={() => {
              setShowMenu(false);
              onRefresh(page);
            }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Refresh Now</span>
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
