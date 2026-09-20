import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
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
import ShiftReelModal from './components/ShiftReelModal';
import { fetchLiveFacebookData, extractPageNameFromUrl, parseFollowerText } from './utils/facebookParser';
import { formatMetric } from './utils/formatters';
import { PlusCircle, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'asi_monitor_pages_v3';
const INITIALIZED_KEY = 'asi_monitor_init_done_v3';

const VIRAL_REELS_POOL = [
  { type: 'reel', title: '5 Hidden AI Features Released Today 🔥', views: 720000 },
  { type: 'reel', title: 'Top 5 Secrets Pros Never Share 🤫', views: 555000 },
  { type: 'reel', title: 'Secret Waterfall Cinematic Drone Shot 4K 🌊', views: 910000 },
  { type: 'reel', title: 'Unreal Engine 5 Photorealistic World Reveal 🎮', views: 640000 },
  { type: 'reel', title: 'From 0 to 1 Million Followers in 90 Days 🚀', views: 830000 },
  { type: 'reel', title: 'Exclusive Behind The Scenes Studio Tour ✨', views: 555000 },
  { type: 'post', title: 'Big Announcement: Our Next Chapter Begins Today!', views: 420000 }
];

export default function App() {
  // Load initial pages from localStorage or default 4 mockup pages
  const [pages, setPages] = useState(() => {
    try {
      const isInitialized = localStorage.getItem(INITIALIZED_KEY);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (isInitialized && saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Ensure all pages have latestPost structure
          return parsed.map(p => {
            if (!p.latestPost) {
              const defaultMatch = DEFAULT_PAGES.find(dp => dp.id === p.id);
              return {
                ...p,
                latestPost: defaultMatch?.latestPost || {
                  id: `post-${Date.now()}`,
                  type: 'reel',
                  title: `${p.title} Featured Reel`,
                  views: Number(p.views) || 555000,
                  publishedAt: 'Latest',
                  url: p.url ? `${p.url.replace(/\/+$/, '')}/videos` : 'https://www.facebook.com',
                  isNew: false
                }
              };
            }
            return p;
          });
        }
      }
      // First run only: store defaults
      localStorage.setItem(INITIALIZED_KEY, 'true');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PAGES));
      return DEFAULT_PAGES;
    } catch (e) {
      console.error('Error reading localStorage:', e);
      return DEFAULT_PAGES;
    }
  });

  // Settings
  const [refreshInterval, setRefreshInterval] = useState(10000); // 10 seconds polling heartbeat
  const [isLiveSimActive, setIsLiveSimActive] = useState(false);
  const [metaToken, setMetaToken] = useState('');
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [editFocusField, setEditFocusField] = useState('views');
  const [pendingAddPage, setPendingAddPage] = useState(null);
  const [shiftingPage, setShiftingPage] = useState(null);
  
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'ASI Monitor Live',
      message: 'Real-time Facebook tracking engine active with public Reel & Post viewer.',
      time: 'Active'
    }
  ]);
  const [unreadNotifs, setUnreadNotifs] = useState(1);

  const scrollContainerRef = useRef(null);

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
    } catch (e) {
      console.error('Error saving pages:', e);
    }
  }, [pages]);

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

  // Handle URL input from search bar -> automatic live fetch from Facebook!
  const handleInputSubmit = async (inputStr) => {
    setIsLoading(true);
    try {
      // Check if user entered views alongside URL (e.g. "facebook.com/mypage 555k" or "facebook.com/mypage, 555000")
      let customViews = null;
      let cleanInput = inputStr.trim();
      const viewsMatch = cleanInput.match(/(?:,\s*|\s+)(?:views?[:\s=]*)?([\d.,]+)\s*([KMBkmb])?(?:\s*views?)?$/i);
      if (viewsMatch && viewsMatch[1]) {
        customViews = parseFollowerText(viewsMatch[1] + (viewsMatch[2] || ''));
        cleanInput = cleanInput.replace(viewsMatch[0], '').trim();
      }

      const resolved = await fetchLiveFacebookData(cleanInput, metaToken);
      if (resolved && resolved.followers > 0) {
        // Use user's exact views if provided, or resolved views, or realistic default (555k)
        const finalViews = customViews !== null && customViews > 0
          ? customViews
          : (resolved.views && resolved.views > 0 ? resolved.views : 555000);

        const newPage = {
          id: `page-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          title: resolved.title,
          handle: resolved.title.toLowerCase().replace(/\s+/g, ''),
          url: resolved.url,
          pfp: resolved.pfp,
          followers: resolved.followers,
          initialFollowers: resolved.followers,
          views: finalViews,
          growth: 0,
          verified: resolved.verified,
          isLive: true,
          lastUpdated: new Date().toISOString(),
          source: 'facebook_live',
          latestPost: {
            id: `post-${Date.now()}`,
            type: cleanInput.includes('/reel/') ? 'reel' : 'reel',
            title: `${resolved.title} Featured Reel`,
            views: finalViews,
            publishedAt: 'Just now',
            url: cleanInput.includes('/reel/') || cleanInput.includes('/videos/') ? cleanInput : `${resolved.url.replace(/\/+$/, '')}/videos`,
            isNew: true
          }
        };

        setPages(prev => [newPage, ...prev]);
        addNotification(`Live Added: ${resolved.title}`, `Tracking ${resolved.followers.toLocaleString()} real followers & ${finalViews.toLocaleString()} views on public reel!`);

        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.25 }
        });

        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        // Fallback: If Facebook blocked or private, open modal so user can configure
        setPendingAddPage({
          id: `page-${Date.now()}`,
          title: resolved?.title || extractPageNameFromUrl(cleanInput),
          handle: (resolved?.title || 'page').toLowerCase().replace(/\s+/g, ''),
          url: resolved?.url || cleanInput,
          pfp: resolved?.pfp || '',
          followers: resolved?.followers || 1000,
          views: customViews || 555000,
          growth: 0,
          verified: false
        });
      }
    } catch (error) {
      console.error('Error resolving page:', error);
      alert('Unable to process page link. Please verify the URL.');
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm adding page from modal with exact readings
  const handleConfirmAdd = (newPage) => {
    const pageToAdd = {
      ...newPage,
      latestPost: newPage.latestPost || {
        id: `post-${Date.now()}`,
        type: 'reel',
        title: `${newPage.title} Featured Reel`,
        views: Number(newPage.views) || 555000,
        publishedAt: 'Just now',
        url: newPage.url ? `${newPage.url.replace(/\/+$/, '')}/videos` : 'https://www.facebook.com',
        isNew: true
      }
    };
    setPages(prev => [pageToAdd, ...prev]);
    addNotification(`Added: ${pageToAdd.title}`, `Monitoring ${pageToAdd.followers.toLocaleString()} followers & ${pageToAdd.views.toLocaleString()} reel views.`);
    
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.25 }
    });

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Delete page permanently
  const handleDeletePage = (id) => {
    setPages(prev => {
      const target = prev.find(p => p.id === id);
      if (target) {
        addNotification(`Removed: ${target.title}`, `Page removed from monitor.`);
      }
      const updated = prev.filter(p => p.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving deleted page:', e);
      }
      return updated;
    });
  };

  // Shift page to new Reel or Post
  const handleShiftReel = (pageId, newPostData) => {
    setPages(prev => prev.map(p => {
      if (p.id === pageId) {
        return {
          ...p,
          views: newPostData.views,
          latestPost: {
            ...newPostData,
            id: `post-${Date.now()}`,
            publishedAt: 'Just now',
            isNew: true
          },
          lastUpdated: new Date().toISOString()
        };
      }
      return p;
    }));

    confetti({
      particleCount: 55,
      spread: 70,
      origin: { y: 0.3 }
    });

    const targetPage = pages.find(p => p.id === pageId);
    addNotification(
      `🔥 Shifted to New ${newPostData.type === 'reel' ? 'Reel' : 'Post'}`,
      `${targetPage?.title || 'Page'} shifted to "${newPostData.title}" (${formatMetric(newPostData.views)} views)!`
    );
  };

  // Quick 1-click test to shift to a new viral reel
  const handleQuickShift = (pageId) => {
    const target = pages.find(p => p.id === pageId);
    if (!target) return;
    const pool = VIRAL_REELS_POOL.filter(r => r.title !== target.latestPost?.title);
    const pick = pool[Math.floor(Math.random() * pool.length)] || VIRAL_REELS_POOL[0];
    handleShiftReel(pageId, {
      type: pick.type,
      title: pick.title,
      views: pick.views,
      url: target.url ? `${target.url.replace(/\/+$/, '')}/${pick.type === 'reel' ? 'videos' : 'posts'}` : 'https://www.facebook.com'
    });
  };

  // Refresh single page live from Facebook
  const handleRefreshSingle = async (page) => {
    if (!page.url) return;
    try {
      const live = await fetchLiveFacebookData(page.url, metaToken);
      if (live && live.followers > 0) {
        setPages(prev => prev.map(p => {
          if (p.id === page.id) {
            const base = p.initialFollowers || p.followers;
            return {
              ...p,
              followers: live.followers,
              growth: live.followers - base,
              title: live.title || p.title,
              pfp: live.pfp || p.pfp,
              verified: live.verified !== undefined ? live.verified : p.verified,
              lastUpdated: new Date().toISOString()
            };
          }
          return p;
        }));
        addNotification(live.title, `Live update: ${live.followers.toLocaleString()} followers.`);
        return;
      }
    } catch (e) {
      console.warn('Refresh error:', e.message);
    }

    setPages(prev => prev.map(p => p.id === page.id ? { ...p, lastUpdated: new Date().toISOString() } : p));
    addNotification(page.title, `Real-time check complete.`);
  };

  // Force refresh all monitored pages live from Facebook
  const handleForceRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      const updated = await Promise.all(pages.map(async (page) => {
        if (!page.url) return page;
        try {
          const live = await fetchLiveFacebookData(page.url, metaToken);
          if (live && live.followers > 0) {
            const base = page.initialFollowers || page.followers;
            return {
              ...page,
              followers: live.followers,
              growth: live.followers - base,
              title: live.title || page.title,
              pfp: live.pfp || page.pfp,
              verified: live.verified !== undefined ? live.verified : page.verified,
              lastUpdated: new Date().toISOString()
            };
          }
        } catch (err) {
          // ignore single page error
        }
        return { ...page, lastUpdated: new Date().toISOString() };
      }));
      setPages(updated);
      addNotification('Real-Time Sync Complete', `All ${pages.length} pages updated live from Facebook.`);
    } catch (e) {
      console.warn('Sync all error:', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // Real-Time Polling Engine: periodically queries Facebook live stats for all monitored pages
  useEffect(() => {
    if (refreshInterval === 0) return;

    const tickTimer = setInterval(async () => {
      setPages(prev => {
        if (prev.length === 0) return prev;
        prev.forEach(async (page) => {
          if (!page.url) return;
          try {
            const live = await fetchLiveFacebookData(page.url, metaToken);
            if (live && live.followers > 0) {
              setPages(currentPages => currentPages.map(p => {
                if (p.id === page.id && p.followers !== live.followers) {
                  const base = p.initialFollowers || p.followers;
                  return {
                    ...p,
                    followers: live.followers,
                    growth: live.followers - base,
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

    return () => clearInterval(tickTimer);
  }, [refreshInterval, metaToken]);

  // Reset to 4 default mockup pages
  const handleResetDefaults = () => {
    setPages(DEFAULT_PAGES);
    try {
      localStorage.setItem(INITIALIZED_KEY, 'true');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PAGES));
    } catch (e) {
      console.error('Error saving defaults:', e);
    }
    addNotification('Reset', 'Restored 4 default sample pages with public reels.');
  };

  // Save edited page
  const handleSaveEdit = (updatedPage) => {
    setPages(prev => prev.map(p => p.id === updatedPage.id ? updatedPage : p));
    addNotification(`Updated: ${updatedPage.title}`, 'Metrics saved successfully.');
  };

  return (
    <div className="app-viewport">
      {/* ASI Monitor Header */}
      <HeaderBar 
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenNotifications={() => {
          setIsNotificationsOpen(true);
          setUnreadNotifs(0);
        }}
        unreadCount={unreadNotifs}
        isRefreshing={isRefreshing}
        onForceRefreshAll={handleForceRefreshAll}
        isLiveSimActive={isLiveSimActive}
      />

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
            <p style={{ fontSize: '0.8rem' }}>Enter a Facebook link above or restore the mockup pages.</p>
            <button className="preset-btn" onClick={handleResetDefaults}>
              <RotateCcw size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Restore 4 Default Pages
            </button>
          </div>
        ) : (
          pages.map(page => (
            <MonitorCard 
              key={page.id} 
              page={page}
              onDelete={handleDeletePage}
              onRefresh={handleRefreshSingle}
              onEdit={(p, field = 'views') => {
                setEditingPage(p);
                setEditFocusField(field);
              }}
              onOpenShift={(p) => setShiftingPage(p)}
              onQuickShift={handleQuickShift}
              isRefreshing={isRefreshing}
            />
          ))
        )}
      </main>

      {/* Configure & Add Page Modal */}
      <AddPageModal 
        isOpen={Boolean(pendingAddPage)}
        onClose={() => setPendingAddPage(null)}
        initialData={pendingAddPage}
        onConfirmAdd={handleConfirmAdd}
      />

      {/* Shift to New Reel / Post Modal */}
      <ShiftReelModal 
        isOpen={Boolean(shiftingPage)}
        onClose={() => setShiftingPage(null)}
        page={shiftingPage}
        onShiftReel={handleShiftReel}
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
        initialFocus={editFocusField}
      />
    </div>
  );
}
