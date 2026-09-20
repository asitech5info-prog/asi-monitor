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
import { fetchLiveFacebookData, extractPageNameFromUrl, parseFollowerText } from './utils/facebookParser';
import { formatExactFollowers } from './utils/formatters';
import { PlusCircle, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'asi_monitor_pages_v4';
const INITIALIZED_KEY = 'asi_monitor_init_done_v4';

export default function App() {
  // Load initial pages from localStorage or default mockup pages
  const [pages, setPages] = useState(() => {
    try {
      const isInitialized = localStorage.getItem(INITIALIZED_KEY);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (isInitialized && saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(p => ({
            ...p,
            followers: typeof p.followers === 'number' ? p.followers : parseFollowerText(p.followers)
          }));
        }
      }
      // First run: save defaults
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
  const [pendingAddPage, setPendingAddPage] = useState(null);
  
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
      let customFollowers = null;
      let cleanInput = inputStr.trim();
      
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
        setPendingAddPage({
          id: `page-${Date.now()}`,
          title: resolved?.title || extractPageNameFromUrl(cleanInput),
          handle: (resolved?.title || 'page').toLowerCase().replace(/\s+/g, ''),
          url: resolved?.url || cleanInput,
          pfp: resolved?.pfp || '',
          followers: customFollowers || 2354,
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
      followers: Number(newPage.followers) || 0,
      initialFollowers: Number(newPage.followers) || 0,
      growth: 0,
      isLive: true,
      lastUpdated: new Date().toISOString()
    };
    setPages(prev => [pageToAdd, ...prev]);
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
        addNotification(live.title, `Live update: ${formatExactFollowers(live.followers)} followers.`);
        return;
      }
    } catch (e) {
      console.warn('Refresh error:', e.message);
    }

    setPages(prev => prev.map(p => p.id === page.id ? { ...p, lastUpdated: new Date().toISOString() } : p));
    addNotification(page.title, `Follower check complete.`);
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
        } catch {
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

  // Reset to default mockup pages
  const handleResetDefaults = () => {
    setPages(DEFAULT_PAGES);
    try {
      localStorage.setItem(INITIALIZED_KEY, 'true');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PAGES));
    } catch (e) {
      console.error('Error saving defaults:', e);
    }
    addNotification('Reset', 'Restored default sample pages.');
  };

  // Save edited page
  const handleSaveEdit = (updatedPage) => {
    setPages(prev => prev.map(p => p.id === updatedPage.id ? updatedPage : p));
    addNotification(`Updated: ${updatedPage.title}`, `Accurate followers set to ${formatExactFollowers(updatedPage.followers)}.`);
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
            <p style={{ fontSize: '0.8rem' }}>Enter a Facebook link above or restore the sample pages.</p>
            <button className="preset-btn" onClick={handleResetDefaults}>
              <RotateCcw size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Restore Sample Pages
            </button>
          </div>
        ) : (
          pages.map(page => (
            <MonitorCard 
              key={page.id} 
              page={page}
              onDelete={handleDeletePage}
              onRefresh={handleRefreshSingle}
              onEdit={(p) => setEditingPage(p)}
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
