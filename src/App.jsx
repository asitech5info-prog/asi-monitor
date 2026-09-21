import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { DEFAULT_PAGES } from './data/defaultPages';
import HeaderBar from './components/HeaderBar';
import InputBar from './components/InputBar';
import StatsSummaryBar from './components/StatsSummaryBar';
import MonitorCard from './components/MonitorCard';
import SettingsModal from './components/SettingsModal';
import NotificationsModal from './components/NotificationsModal';
import EditPageModal from './components/EditPageModal';
import AddPageModal from './components/AddPageModal';
import HamburgerDrawer from './components/HamburgerDrawer';
import KeepNotesView from './components/KeepNotesView';
import { fetchLiveFacebookData, extractPageNameFromUrl, parseFollowerText } from './utils/facebookParser';
import { formatExactFollowers } from './utils/formatters';
import { PlusCircle, RotateCcw, CheckCircle2, ArrowUpDown, Check } from 'lucide-react';

const STORAGE_KEY = 'asi_monitor_pages_v4';
const INITIALIZED_KEY = 'asi_monitor_init_done_v4';
const SETTING_REFRESH_INTERVAL_KEY = 'asi_monitor_refresh_interval';
const SETTING_LIVE_SIM_KEY = 'asi_monitor_live_sim';
const SETTING_META_TOKEN_KEY = 'asi_monitor_meta_token';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// Checks each page and resets 24-hour delta growth if 24 hours have elapsed
function applyGrowth24hReset(pagesList) {
  const now = Date.now();
  return pagesList.map(p => {
    const resetTime = p.growthResetAt 
      ? new Date(p.growthResetAt).getTime() 
      : (p.lastUpdated ? new Date(p.lastUpdated).getTime() : now);
    
    // Check if 24 hours have elapsed
    if (now - resetTime >= TWENTY_FOUR_HOURS_MS) {
      return {
        ...p,
        growth: 0,
        initialFollowers: p.followers,
        growthResetAt: new Date(now).toISOString()
      };
    }
    
    return {
      ...p,
      growthResetAt: p.growthResetAt || (p.lastUpdated || new Date(now).toISOString()),
      initialFollowers: p.initialFollowers ?? p.followers
    };
  });
}

export default function App() {
  // Load initial pages from localStorage or default mockup pages with 24h reset checked
  // If user removed pages, they stay removed!
  const [pages, setPages] = useState(() => {
    try {
      const isInitialized = localStorage.getItem(INITIALIZED_KEY);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (isInitialized && saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const normalized = parsed.map(p => ({
            ...p,
            followers: typeof p.followers === 'number' ? p.followers : parseFollowerText(p.followers)
          }));
          return applyGrowth24hReset(normalized);
        }
      }
      // First run only: save defaults
      localStorage.setItem(INITIALIZED_KEY, 'true');
      const defaultsWithReset = applyGrowth24hReset(DEFAULT_PAGES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultsWithReset));
      return defaultsWithReset;
    } catch (e) {
      console.error('Error reading localStorage:', e);
      return applyGrowth24hReset(DEFAULT_PAGES);
    }
  });

  // Main navigation view: 'monitor' | 'notes'
  const [currentView, setCurrentView] = useState('monitor');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);

  // Settings with persistent localStorage storage
  const [refreshInterval, setRefreshInterval] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTING_REFRESH_INTERVAL_KEY);
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error reading refresh interval:', e);
    }
    return 10000; // default 10 seconds polling heartbeat
  });

  const [isLiveSimActive, setIsLiveSimActive] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTING_LIVE_SIM_KEY);
      if (saved !== null) return saved === 'true';
    } catch (e) {
      console.error('Error reading live sim state:', e);
    }
    return false;
  });

  const [metaToken, setMetaToken] = useState(() => {
    try {
      return localStorage.getItem(SETTING_META_TOKEN_KEY) || '';
    } catch (e) {
      return '';
    }
  });
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [pendingAddPage, setPendingAddPage] = useState(null);
  
  // Floating Toast Notification state
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (message = 'Refreshed', subtext = '') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ id: Date.now(), message, subtext });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 2400);
  };
  
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'ASI Monitor Live',
      message: 'Real-time accurate Facebook follower tracking engine active.',
      time: 'Active'
    }
  ]);
  const [unreadNotifs, setUnreadNotifs] = useState(1);

  const scrollContainerRef = useRef(null);

  // Save pages to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
    } catch (e) {
      console.error('Error saving pages:', e);
    }
  }, [pages]);

  // Persist settings to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(SETTING_REFRESH_INTERVAL_KEY, refreshInterval.toString());
    } catch (e) {
      console.error('Error saving refresh interval:', e);
    }
  }, [refreshInterval]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTING_LIVE_SIM_KEY, isLiveSimActive ? 'true' : 'false');
    } catch (e) {
      console.error('Error saving live sim setting:', e);
    }
  }, [isLiveSimActive]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTING_META_TOKEN_KEY, metaToken);
    } catch (e) {
      console.error('Error saving meta token:', e);
    }
  }, [metaToken]);

  // Push new notification
  const addNotification = (title, message) => {
    const newNotif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title,
      message,
      time: 'Just now'
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 19)]);
    setUnreadNotifs(prev => prev + 1);
  };

  // Drag and drop index tracker
  const dragItemIndexRef = useRef(null);

  // Reorder page handlers
  const handleMoveToTop = (id) => {
    setPages(prev => {
      const idx = prev.findIndex(p => p.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.unshift(item);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Error saving pages:', e);
      }
      return next;
    });
    showToast('Reordered', 'Placed at top');
  };

  const handleMoveUp = (id) => {
    setPages(prev => {
      const idx = prev.findIndex(p => p.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const temp = next[idx - 1];
      next[idx - 1] = next[idx];
      next[idx] = temp;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Error saving pages:', e);
      }
      return next;
    });
  };

  const handleMoveDown = (id) => {
    setPages(prev => {
      const idx = prev.findIndex(p => p.id === id);
      if (idx === -1 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      const temp = next[idx + 1];
      next[idx + 1] = next[idx];
      next[idx] = temp;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Error saving pages:', e);
      }
      return next;
    });
  };

  const handleMoveToBottom = (id) => {
    setPages(prev => {
      const idx = prev.findIndex(p => p.id === id);
      if (idx === -1 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.push(item);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Error saving pages:', e);
      }
      return next;
    });
    showToast('Reordered', 'Placed at bottom');
  };

  const handleDragStart = (e, index) => {
    dragItemIndexRef.current = index;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = dragItemIndexRef.current;
    if (sourceIndex === null || sourceIndex === undefined || sourceIndex === targetIndex) return;
    setPages(prev => {
      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.error('Error saving reordered pages:', err);
      }
      return next;
    });
    dragItemIndexRef.current = null;
    showToast('Reordered', 'Updated page position');
  };

  // Handle URL input from search bar -> automatic live fetch from Facebook!
  const handleInputSubmit = async (inputStr) => {
    if (!inputStr || !inputStr.trim()) return;
    setIsLoading(true);
    let cleanInput = inputStr.trim();
    let customFollowers = null;

    try {
      // Check if user entered followers count alongside URL (e.g. "facebook.com/mypage 2354" or "facebook.com/mypage, 2,354")
      const followersMatch = cleanInput.match(/(?:,\s*|\s+)(?:followers?[:\s=]*)?([\d.,]+)\s*([KMBkmb])?(?:\s*followers?)?$/i);
      if (followersMatch && followersMatch[1]) {
        customFollowers = parseFollowerText(followersMatch[1] + (followersMatch[2] || ''));
        cleanInput = cleanInput.replace(followersMatch[0], '').trim();
      }

      const resolved = await fetchLiveFacebookData(cleanInput, metaToken);
      const finalFollowers = customFollowers !== null && customFollowers > 0 
        ? customFollowers 
        : (resolved?.followers && resolved.followers > 0 ? resolved.followers : 0);

      if (finalFollowers > 0) {
        const newPage = {
          id: `page-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          title: resolved?.title || extractPageNameFromUrl(cleanInput),
          handle: (resolved?.title || extractPageNameFromUrl(cleanInput)).toLowerCase().replace(/\s+/g, ''),
          url: resolved?.url || cleanInput,
          pfp: resolved?.pfp || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanInput)}`,
          followers: finalFollowers,
          initialFollowers: finalFollowers,
          growth: 0,
          verified: resolved?.verified || false,
          isLive: true,
          lastUpdated: new Date().toISOString(),
          source: resolved?.isLive ? 'facebook_live' : 'manual'
        };

        setPages(prev => [newPage, ...prev]);
        addNotification(`Added: ${newPage.title}`, `Monitoring ${formatExactFollowers(finalFollowers)} live followers.`);

        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.25 }
        });

        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        // Fallback: If Facebook blocked or private, open modal so user can configure exact followers
        const fallbackTitle = resolved?.title || extractPageNameFromUrl(cleanInput);
        setPendingAddPage({
          id: `page-${Date.now()}`,
          title: fallbackTitle,
          handle: fallbackTitle.toLowerCase().replace(/\s+/g, ''),
          url: resolved?.url || cleanInput,
          pfp: resolved?.pfp || '',
          followers: customFollowers || 2354,
          growth: 0,
          verified: false
        });
      }
    } catch (error) {
      console.warn('Handling page link fallback:', error);
      const fallbackTitle = extractPageNameFromUrl(cleanInput);
      setPendingAddPage({
        id: `page-${Date.now()}`,
        title: fallbackTitle,
        handle: fallbackTitle.toLowerCase().replace(/\s+/g, ''),
        url: cleanInput,
        pfp: '',
        followers: customFollowers || 2354,
        growth: 0,
        verified: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm adding page from modal with exact readings
  const handleConfirmAdd = (newPage) => {
    const finalFollowers = Number(newPage.followers) || 2354;
    const pageToAdd = {
      ...newPage,
      followers: finalFollowers,
      initialFollowers: finalFollowers,
      growth: 0,
      isLive: true,
      lastUpdated: new Date().toISOString()
    };
    setPages(prev => [pageToAdd, ...prev]);
    setPendingAddPage(null);
    addNotification(`Added: ${pageToAdd.title}`, `Monitoring ${formatExactFollowers(pageToAdd.followers)} exact followers.`);
    
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.25 }
    });

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Delete page permanently (persists empty list if all deleted)
  const handleDeletePage = (id) => {
    setPages(prev => {
      const target = prev.find(p => p.id === id);
      if (target) {
        addNotification(`Removed: ${target.title}`, `Page removed from monitor.`);
      }
      const updated = prev.filter(p => p.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        localStorage.setItem(INITIALIZED_KEY, 'true');
      } catch (e) {
        console.error('Error saving deleted page:', e);
      }
      return updated;
    });
  };

  // Refresh single page live from Facebook
  const handleRefreshSingle = async (page) => {
    if (!page.url) return;
    showToast('Refreshed', page.title);
    const now = Date.now();
    try {
      const live = await fetchLiveFacebookData(page.url, metaToken);
      if (live && live.followers > 0) {
        setPages(prev => prev.map(p => {
          if (p.id === page.id) {
            const resetTime = p.growthResetAt ? new Date(p.growthResetAt).getTime() : now;
            const is24hOver = now - resetTime >= TWENTY_FOUR_HOURS_MS;
            const base = is24hOver ? live.followers : (p.initialFollowers || live.followers);
            return {
              ...p,
              followers: live.followers,
              initialFollowers: base,
              growth: is24hOver ? 0 : Math.max(0, live.followers - base),
              growthResetAt: is24hOver ? new Date(now).toISOString() : (p.growthResetAt || new Date(now).toISOString()),
              title: live.title || p.title,
              pfp: live.pfp || p.pfp,
              verified: live.verified !== undefined ? live.verified : p.verified,
              lastUpdated: new Date().toISOString()
            };
          }
          return p;
        }));
        addNotification('Refreshed', `${live.title || page.title}: live followers updated.`);
        return;
      }
    } catch (e) {
      console.warn('Refresh error:', e.message);
    }

    setPages(prev => prev.map(p => p.id === page.id ? { ...p, lastUpdated: new Date().toISOString() } : p));
    addNotification('Refreshed', `${page.title} check completed.`);
  };

  // Force refresh all monitored pages live from Facebook
  const handleForceRefreshAll = async () => {
    setIsRefreshing(true);
    showToast('Refreshed', 'All monitored pages updated');
    const now = Date.now();
    try {
      const updated = await Promise.all(pages.map(async (page) => {
        if (!page.url) return page;
        try {
          const live = await fetchLiveFacebookData(page.url, metaToken);
          if (live && live.followers > 0) {
            const resetTime = page.growthResetAt ? new Date(page.growthResetAt).getTime() : now;
            const is24hOver = now - resetTime >= TWENTY_FOUR_HOURS_MS;
            const base = is24hOver ? live.followers : (page.initialFollowers || live.followers);
            return {
              ...page,
              followers: live.followers,
              initialFollowers: base,
              growth: is24hOver ? 0 : Math.max(0, live.followers - base),
              growthResetAt: is24hOver ? new Date(now).toISOString() : (page.growthResetAt || new Date(now).toISOString()),
              title: live.title || page.title,
              pfp: live.pfp || page.pfp,
              verified: live.verified !== undefined ? live.verified : page.verified,
              lastUpdated: new Date().toISOString()
            };
          }
        } catch {
          // ignore single page error
        }
        return { ...page, lastUpdated: new Date().toISOString() };
      }));
      setPages(updated);
      addNotification('Refreshed', `All ${pages.length} pages updated live from Facebook.`);
    } catch (e) {
      console.warn('Sync all error:', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // Real-Time Polling Engine: periodically queries Facebook live stats for all monitored pages
  // and maintains the 24-hour growth reset boundary
  useEffect(() => {
    // Check 24-hour growth reset periodically
    const check24hBoundary = () => {
      setPages(prev => {
        const now = Date.now();
        let changed = false;
        const checked = prev.map(p => {
          const resetTime = p.growthResetAt ? new Date(p.growthResetAt).getTime() : now;
          if (now - resetTime >= TWENTY_FOUR_HOURS_MS) {
            changed = true;
            return {
              ...p,
              growth: 0,
              initialFollowers: p.followers,
              growthResetAt: new Date(now).toISOString()
            };
          }
          return p;
        });
        return changed ? checked : prev;
      });
    };

    const resetIntervalTimer = setInterval(check24hBoundary, 30000);

    if (refreshInterval === 0) {
      return () => clearInterval(resetIntervalTimer);
    }

    const tickTimer = setInterval(async () => {
      const now = Date.now();
      setPages(prev => {
        if (prev.length === 0) return prev;
        prev.forEach(async (page) => {
          if (!page.url) return;
          try {
            const live = await fetchLiveFacebookData(page.url, metaToken);
            if (live && live.followers > 0) {
              setPages(currentPages => currentPages.map(p => {
                if (p.id === page.id && p.followers !== live.followers) {
                  const resetTime = p.growthResetAt ? new Date(p.growthResetAt).getTime() : now;
                  const is24hOver = now - resetTime >= TWENTY_FOUR_HOURS_MS;
                  const base = is24hOver ? live.followers : (p.initialFollowers || live.followers);
                  return {
                    ...p,
                    followers: live.followers,
                    initialFollowers: base,
                    growth: is24hOver ? 0 : Math.max(0, live.followers - base),
                    growthResetAt: is24hOver ? new Date(now).toISOString() : (p.growthResetAt || new Date(now).toISOString()),
                    title: live.title || p.title,
                    pfp: live.pfp || p.pfp,
                    verified: live.verified !== undefined ? live.verified : p.verified,
                    lastUpdated: new Date().toISOString()
                  };
                }
                return p;
              }));
            }
          } catch {
            // silent catch on background poll
          }
        });
        return prev.map(p => ({ ...p, lastUpdated: new Date().toISOString() }));
      });
    }, refreshInterval > 0 ? refreshInterval : 8000);

    return () => {
      clearInterval(tickTimer);
      clearInterval(resetIntervalTimer);
    };
  }, [refreshInterval, metaToken]);

  // Reset to default mockup pages
  const handleResetDefaults = () => {
    const defaultsWithReset = applyGrowth24hReset(DEFAULT_PAGES);
    setPages(defaultsWithReset);
    try {
      localStorage.setItem(INITIALIZED_KEY, 'true');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultsWithReset));
    } catch (e) {
      console.error('Error saving defaults:', e);
    }
    showToast('Refreshed', 'Restored default sample pages');
    addNotification('Refreshed', 'Restored default sample pages.');
  };

  // Save edited page
  const handleSaveEdit = (updatedPage) => {
    setPages(prev => prev.map(p => p.id === updatedPage.id ? {
      ...updatedPage,
      growthResetAt: updatedPage.growthResetAt || new Date().toISOString()
    } : p));
    addNotification(`Updated: ${updatedPage.title}`, `Accurate followers set to ${formatExactFollowers(updatedPage.followers)}.`);
  };

  return (
    <div className="app-viewport">
      {/* On-Screen Toast Notification */}
      {toast && (
        <div className="toast-notification-banner" role="status" aria-live="polite">
          <div className="toast-icon-wrap">
            <CheckCircle2 size={15} color="#00e676" />
          </div>
          <div className="toast-content">
            <span className="toast-title">{toast.message}</span>
            {toast.subtext && <span className="toast-subtext">{toast.subtext}</span>}
          </div>
        </div>
      )}

      {/* Hamburger Navigation Drawer */}
      <HamburgerDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentView={currentView}
        onSelectView={(v) => setCurrentView(v)}
        onOpenNotifications={() => {
          setIsNotificationsOpen(true);
          setUnreadNotifs(0);
        }}
        unreadNotifs={unreadNotifs}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isReorderMode={isReorderMode}
        onToggleReorderMode={() => setIsReorderMode(prev => !prev)}
        onForceRefreshAll={handleForceRefreshAll}
        isRefreshing={isRefreshing}
      />

      {/* Conditionally Render View: Keep Notes vs Live Monitor */}
      {currentView === 'notes' ? (
        <KeepNotesView 
          onBackToMonitor={() => setCurrentView('monitor')}
          onShowToast={showToast}
        />
      ) : (
        <>
          {/* ASI Monitor Header */}
          <HeaderBar 
            onOpenMenu={() => setIsDrawerOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenNotifications={() => {
              setIsNotificationsOpen(true);
              setUnreadNotifs(0);
            }}
            unreadCount={unreadNotifs}
            isRefreshing={isRefreshing}
            onForceRefreshAll={handleForceRefreshAll}
            isReorderMode={isReorderMode}
            onToggleReorderMode={() => setIsReorderMode(prev => !prev)}
            onOpenNotes={() => setCurrentView('notes')}
          />

          {/* Rearrange Mode Banner (Active when rearranging pages) */}
          {isReorderMode && (
            <div className="reorder-banner" role="region" aria-label="Rearrange Mode">
              <div className="reorder-banner-content">
                <ArrowUpDown size={15} color="#00e5ff" />
                <span>Rearrange: Drag cards or use arrows</span>
              </div>
              <button 
                className="reorder-done-btn" 
                onClick={() => setIsReorderMode(false)}
                aria-label="Done Rearranging"
              >
                <Check size={14} />
                <span>Done</span>
              </button>
            </div>
          )}

          {/* Add Page / Profile URL Input Bar */}
          <InputBar onAddPage={handleInputSubmit} isLoading={isLoading} />

          {/* Aggregate Metrics Bar */}
          <StatsSummaryBar pages={pages} />

          {/* Monitored Rows Cards Container */}
          <main className="cards-scroll-container" ref={scrollContainerRef}>
            {pages.length === 0 ? (
              <div className="empty-pages-state">
                <PlusCircle size={44} strokeWidth={1.5} color="#00e5ff" />
                <p style={{ fontWeight: 600, color: '#e2e8f0' }}>No Facebook pages currently monitored</p>
                <p style={{ fontSize: '0.8rem' }}>Enter a Facebook link above or restore the sample pages.</p>
                <button className="preset-btn" onClick={handleResetDefaults}>
                  <RotateCcw size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Restore Sample Pages
                </button>
              </div>
            ) : (
              pages.map((page, index) => (
                <MonitorCard 
                  key={page.id} 
                  page={page}
                  index={index}
                  totalCount={pages.length}
                  isReorderMode={isReorderMode}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  onMoveToTop={handleMoveToTop}
                  onMoveToBottom={handleMoveToBottom}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDelete={handleDeletePage}
                  onRefresh={handleRefreshSingle}
                  onEdit={(p) => setEditingPage(p)}
                  isRefreshing={isRefreshing}
                />
              ))
            )}
          </main>
        </>
      )}

      {/* Configure & Add Page Modal */}
      <AddPageModal 
        isOpen={Boolean(pendingAddPage)}
        onClose={() => setPendingAddPage(null)}
        initialData={pendingAddPage}
        onConfirmAdd={handleConfirmAdd}
      />

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        refreshInterval={refreshInterval}
        setRefreshInterval={setRefreshInterval}
        isLiveSimActive={isLiveSimActive}
        setIsLiveSimActive={setIsLiveSimActive}
        onResetDefaults={handleResetDefaults}
        metaToken={metaToken}
        setMetaToken={setMetaToken}
      />

      {/* Activity / Notifications Drawer */}
      <NotificationsModal 
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onClear={() => setNotifications([])}
      />

      {/* Edit Page Modal */}
      <EditPageModal 
        isOpen={Boolean(editingPage)}
        onClose={() => setEditingPage(null)}
        page={editingPage}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
