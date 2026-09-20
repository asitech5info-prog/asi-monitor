import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  MoreVertical, 
  TrendingUp, 
  ExternalLink, 
  Trash2, 
  RefreshCw, 
  Edit3,
  Radio
} from 'lucide-react';
import { formatExactFollowers, formatGrowth } from '../utils/formatters';

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

      {/* Main Card Content */}
      <div className="card-details-wrapper">
        {/* Top Header: Title + More Actions */}
        <div className="card-title-header">
          <div className="card-title-container">
            <span className="card-page-title" title={page.title}>{page.title}</span>
            {page.isLive && (
              <span className="card-live-indicator" title="Live connection active">
                <Radio size={10} color="#00e676" />
                <span>LIVE</span>
              </span>
            )}
          </div>
          
          <div className="card-header-actions">
            <button 
              className="card-quick-action-btn"
              onClick={() => onRefresh(page)}
              title="Refresh follower count now"
              aria-label="Refresh"
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
            </button>

            <button 
              className="card-quick-action-btn"
              onClick={() => onEdit && onEdit(page, 'followers')}
              title="Edit followers"
              aria-label="Edit"
            >
              <Edit3 size={15} />
            </button>

            <button 
              className="card-menu-trigger" 
              onClick={() => setShowMenu(!showMenu)}
              aria-label="More options"
            >
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        {/* Exact Follower Count Row */}
        <div 
          className="metric-col-followers" 
          onClick={() => onEdit && onEdit(page, 'followers')}
          title={`${Number(page.followers).toLocaleString()} exact followers (tap to edit)`}
        >
          <div className="followers-count-row">
            <span className="followers-main-number">
              {formatExactFollowers(page.followers)}
            </span>
            <div className={`growth-pill-badge ${hasPopped ? 'pulse-pop' : ''}`}>
              <TrendingUp size={11} strokeWidth={2.5} />
              <span>{formatGrowth(page.growth || 0)}</span>
            </div>
          </div>
          <div className="metric-footer-row">
            <span className="metric-micro-label">Followers (tap to edit)</span>
            {page.url && (
              <a 
                href={page.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="card-fb-link"
                onClick={(e) => e.stopPropagation()}
              >
                <span>View on FB</span>
                <ExternalLink size={10} />
              </a>
            )}
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
              window.open(page.url || 'https://www.facebook.com', '_blank', 'noopener,noreferrer');
            }}
          >
            <ExternalLink size={14} color="#38bdf8" />
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
            <span>Refresh Live Count</span>
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
            <span>Remove Page</span>
          </button>
        </div>
      )}
    </div>
  );
}
