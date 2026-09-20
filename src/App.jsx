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
import { resolveFacebookPage } from './utils/facebookParser';
import { PlusCircle, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'asi_monitor_pages_v2';

export default function App() {
  // Load initial pages from localStorage or default 4 mockup pages
  const [pages, setPages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading localStorage:', e);
    }
    return DEFAULT_PAGES;
  });

  // Settings
  const [refreshInterval, setRefreshInterval] = useState(8000); // 8 seconds default
  const [isLiveSimActive, setIsLiveSimActive] = useState(true);
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
      message: 'Monitoring 4 Facebook pages in real time.',
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

  // Handle URL input from search bar -> opens configure modal
  const handleInputSubmit = async (url) => {
    setIsLoading(true);
    try {
      const resolved = await resolveFacebookPage(url, metaToken);
      setPendingAddPage(resolved);
    } catch (error) {
      console.error('Error resolving page:', error);
      alert('Unable to process page link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm adding page from modal
  const handleConfirmAdd = (newPage) => {
    setPages(prev => [newPage, ...prev]);
    addNotification(`Added: ${newPage.title}`, `Started tracking live followers and views.`);
    
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.25 }
    });

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Delete page
  const handleDeletePage = (id) => {
    setPages(prev => {
      const target = prev.find(p => p.id === id);
      if (target) {
        addNotification(`Removed: ${target.title}`, `Stopped monitoring.`);
      }
      return prev.filter(p => p.id !== id);
    });
  };

  // Refresh single page
  const handleRefreshSingle = (page) => {
    setPages(prev => prev.map(p => {
      if (p.id === page.id) {
        const addedFollowers = Math.floor(Math.random() * 8) + 2;
        const addedViews = Math.floor(Math.random() * 35) + 12;
        return {
          ...p,
          followers: p.followers + addedFollowers,
          growth: (p.growth || 0) + addedFollowers,
          views: p.views + addedViews,
          lastUpdated: new Date().toISOString()
        };
      }
      return p;
    }));
  };

  // Force refresh all
  const handleForceRefreshAll = () => {
    setIsRefreshing(true);
    setPages(prev => prev.map(p => {
      const addedFollowers = Math.floor(Math.random() * 15) + 5;
      const addedViews = Math.floor(Math.random() * 60) + 20;
      return {
        ...p,
        followers: p.followers + addedFollowers,
        growth: (p.growth || 0) + addedFollowers,
        views: p.views + addedViews,
        lastUpdated: new Date().toISOString()
      };
    }));
    setTimeout(() => {
      setIsRefreshing(false);
      addNotification('Manual Sync Complete', `Updated ${pages.length} pages.`);
    }, 600);
  };

  // Real-Time Live Growth Engine Loop
  useEffect(() => {
    if (refreshInterval === 0 && !isLiveSimActive) return;

    const tickTimer = setInterval(() => {
      if (isLiveSimActive) {
        setPages(prev => {
          if (prev.length === 0) return prev;
          const updated = [...prev];
          const luckyIdx = Math.floor(Math.random() * updated.length);
          const target = { ...updated[luckyIdx] };
          
          const deltaFollowers = Math.floor(Math.random() * 7) + 1;
          const deltaViews = Math.floor(Math.random() * 40) + 15;
          
          target.followers += deltaFollowers;
          target.growth = (target.growth || 0) + deltaFollowers;
          target.views += deltaViews;
          target.lastUpdated = new Date().toISOString();

          updated[luckyIdx] = target;

          // Milestone notification trigger
          if (target.followers % 100 < 6) {
            addNotification(`${target.title}`, `Trending up! Gained +${target.growth} live followers today.`);
          }

          return updated;
        });
      }
    }, refreshInterval > 0 ? Math.min(refreshInterval, 6000) : 4000);

    return () => clearInterval(tickTimer);
  }, [refreshInterval, isLiveSimActive]);

  // Reset to 4 default mockup pages
  const handleResetDefaults = () => {
    setPages(DEFAULT_PAGES);
    localStorage.removeItem(STORAGE_KEY);
    addNotification('Reset', 'Restored 4 default pages from mockup.');
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
