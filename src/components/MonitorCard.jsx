import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  MoreVertical, 
  TrendingUp, 
  ExternalLink, 
  Trash2, 
  RefreshCw, 
  Edit3,
  Radio,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ArrowUpToLine,
  ArrowDownToLine
} from 'lucide-react';
import { formatExactFollowers, formatGrowth } from '../utils/formatters';

export default function MonitorCard({ 
  page, 
  index = 0,
  totalCount = 1,
  isReorderMode = false,
  onMoveUp,
  onMoveDown,
  onMoveToTop,
  onMoveToBottom,
  onDragStart,
  onDragOver,
  onDrop,
  onDelete, 
  onRefresh, 
  onEdit, 
  isRefreshing 
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [hasPopped, setHasPopped] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

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
    <div 
      className={`monitor-row-card ${isFlashing ? 'just-updated' : ''} ${isReorderMode ? 'reorder-card-active' : ''} ${isDragOver ? 'drag-target-over' : ''} ${showMenu ? 'card-menu-open' : ''}`}
      draggable={isReorderMode}
      onDragStart={(e) => {
        if (onDragStart) onDragStart(e, index);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
        if (onDragOver) onDragOver(e, index);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        setIsDragOver(false);
        if (onDrop) onDrop(e, index);
      }}
    >
      {/* Reorder Mode Handle & Position Indicator */}
      {isReorderMode && (
        <div className="reorder-handle-strip">
          <div className="reorder-grip-icon" title="Drag to reorder">
            <GripVertical size={20} color="#00e5ff" />
          </div>
          <span className="reorder-position-pill">#{index + 1}</span>
          <div className="reorder-arrow-buttons">
            <button 
              className="reorder-step-btn"
              disabled={index === 0}
              onClick={(e) => {
                e.stopPropagation();
                if (onMoveUp) onMoveUp(page.id);
              }}
              title="Move Up"
              aria-label="Move Up"
            >
              <ChevronUp size={16} />
            </button>
            <button 
              className="reorder-step-btn"
              disabled={index >= totalCount - 1}
              onClick={(e) => {
                e.stopPropagation();
                if (onMoveDown) onMoveDown(page.id);
              }}
              title="Move Down"
              aria-label="Move Down"
            >
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      )}

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
            {!isReorderMode && (
              <>
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
              </>
            )}

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
          {/* Reordering Options inside menu */}
          {index > 0 && (
            <button 
              className="menu-item-action"
              onClick={() => {
                setShowMenu(false);
                if (onMoveToTop) onMoveToTop(page.id);
              }}
            >
              <ArrowUpToLine size={14} color="#00e5ff" />
              <span>Place at Top</span>
            </button>
          )}

          {index > 0 && (
            <button 
              className="menu-item-action"
              onClick={() => {
                setShowMenu(false);
                if (onMoveUp) onMoveUp(page.id);
              }}
            >
              <ChevronUp size={14} color="#00e5ff" />
              <span>Move Up</span>
            </button>
          )}

          {index < totalCount - 1 && (
            <button 
              className="menu-item-action"
              onClick={() => {
                setShowMenu(false);
                if (onMoveDown) onMoveDown(page.id);
              }}
            >
              <ChevronDown size={14} color="#00e5ff" />
              <span>Move Down</span>
            </button>
          )}

          {index < totalCount - 1 && (
            <button 
              className="menu-item-action"
              onClick={() => {
                setShowMenu(false);
                if (onMoveToBottom) onMoveToBottom(page.id);
              }}
            >
              <ArrowDownToLine size={14} color="#00e5ff" />
              <span>Place at Bottom</span>
            </button>
          )}

          <div className="menu-divider" style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />

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
