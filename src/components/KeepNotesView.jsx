import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Pin, 
  Trash2, 
  Palette, 
  CheckSquare, 
  Square, 
  Grid, 
  List, 
  X, 
  Sparkles, 
  Edit3,
  Copy,
  Check,
  Tag,
  ArrowUpDown,
  Download,
  Upload,
  Calendar,
  Layers
} from 'lucide-react';

const AMOLED_NOTE_COLORS = [
  { id: 'amoled', name: 'AMOLED Black', bg: '#080808', border: '#27272a' },
  { id: 'cyan', name: 'Neon Cyan', bg: '#041c24', border: '#00e5ff' },
  { id: 'emerald', name: 'Mint Emerald', bg: '#022013', border: '#00e676' },
  { id: 'violet', name: 'Cyber Violet', bg: '#1c0a32', border: '#a855f7' },
  { id: 'amber', name: 'Warm Amber', bg: '#261203', border: '#f59e0b' },
  { id: 'rose', name: 'Crimson Rose', bg: '#290610', border: '#f43f5e' },
  { id: 'slate', name: 'Deep Slate', bg: '#0d131f', border: '#334155' }
];

const NOTE_TAGS = ['All', 'Strategy', 'Tasks', 'Ideas', 'Milestones', 'Urgent', 'Content'];

const STORAGE_KEY_NOTES = 'asi_monitor_notes_v2';
const LEGACY_STORAGE_KEY = 'asi_monitor_keep_notes_v1';

const DEFAULT_NOTES = [
  {
    id: 'note-1',
    title: 'Facebook Page Viral Strategy 🚀',
    body: '1. Post high-retention 45-60s reels at 6 PM.\n2. Engage with top 10 comments in the first 15 mins.\n3. Track daily follower growth delta in ASI Monitor.',
    tag: 'Strategy',
    isChecklist: false,
    checklistItems: [],
    colorId: 'cyan',
    isPinned: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'note-2',
    title: 'Milestone Goals Checklist 🎯',
    body: '',
    tag: 'Milestones',
    isChecklist: true,
    checklistItems: [
      { id: 'c1', text: 'The Tech Insider: Cross 500,000 followers', done: true },
      { id: 'c2', text: 'Nature Photography: Reach 650,000 followers', done: false },
      { id: 'c3', text: 'Doodle Melt: Hit 5,000 live community members', done: false },
      { id: 'c4', text: 'Analyze 24h peak engagement graph', done: true }
    ],
    colorId: 'violet',
    isPinned: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'note-3',
    title: 'Weekly Content Schedule 📅',
    body: 'Mon & Wed: Behind the scenes & short clips.\nFriday: Community Q&A reel.\nSunday: Weekly recap & milestone celebration.',
    tag: 'Content',
    isChecklist: false,
    checklistItems: [],
    colorId: 'amber',
    isPinned: false,
    updatedAt: new Date().toISOString()
  }
];

export default function KeepNotesView({ onBackToMonitor, onShowToast }) {
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // Migration from legacy
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        const parsedLegacy = JSON.parse(legacy);
        if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
          return parsedLegacy.map(n => ({
            ...n,
            tag: n.tag || 'Strategy',
            isChecklist: Boolean(n.isChecklist),
            checklistItems: n.checklistItems || []
          }));
        }
      }
      return DEFAULT_NOTES;
    } catch {
      return DEFAULT_NOTES;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'alpha'
  const [isGridView, setIsGridView] = useState(true);
  
  // Composer state
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerTitle, setComposerTitle] = useState('');
  const [composerBody, setComposerBody] = useState('');
  const [composerTag, setComposerTag] = useState('Strategy');
  const [composerColor, setComposerColor] = useState('amoled');
  const [composerPinned, setComposerPinned] = useState(false);
  const [composerIsChecklist, setComposerIsChecklist] = useState(false);
  const [composerChecklist, setComposerChecklist] = useState([{ id: '1', text: '', done: false }]);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Edit Note Modal state
  const [editingNote, setEditingNote] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const composerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Save notes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
    } catch (e) {
      console.error('Error saving notes:', e);
    }
  }, [notes]);

  // Click outside to collapse composer if empty
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (composerRef.current && !composerRef.current.contains(e.target)) {
        const hasContent = composerTitle.trim() || 
          (composerIsChecklist 
            ? composerChecklist.some(item => item.text.trim()) 
            : composerBody.trim());
        if (isComposerOpen && !hasContent) {
          setIsComposerOpen(false);
          setShowColorPicker(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isComposerOpen, composerTitle, composerBody, composerIsChecklist, composerChecklist]);

  // Add new note
  const handleSaveNote = () => {
    const validChecklist = composerChecklist.filter(item => item.text.trim());
    const hasContent = composerTitle.trim() || (composerIsChecklist ? validChecklist.length > 0 : composerBody.trim());
    
    if (!hasContent) {
      setIsComposerOpen(false);
      return;
    }

    const newNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: composerTitle.trim() || (composerIsChecklist ? 'Checklist' : 'Untitled Note'),
      body: composerIsChecklist ? '' : composerBody.trim(),
      tag: composerTag,
      isChecklist: composerIsChecklist,
      checklistItems: validChecklist,
      colorId: composerColor,
      isPinned: composerPinned,
      updatedAt: new Date().toISOString()
    };

    setNotes(prev => [newNote, ...prev]);
    resetComposer();
    if (onShowToast) onShowToast('Note Saved', newNote.title);
  };

  const resetComposer = () => {
    setComposerTitle('');
    setComposerBody('');
    setComposerTag('Strategy');
    setComposerColor('amoled');
    setComposerPinned(false);
    setComposerIsChecklist(false);
    setComposerChecklist([{ id: '1', text: '', done: false }]);
    setIsComposerOpen(false);
    setShowColorPicker(false);
  };

  // Toggle Pin on note
  const handleTogglePin = (id, e) => {
    if (e) e.stopPropagation();
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  };

  // Delete note
  const handleDeleteNote = (id, e) => {
    if (e) e.stopPropagation();
    setNotes(prev => prev.filter(n => n.id !== id));
    if (onShowToast) onShowToast('Note Removed');
  };

  // Change note color
  const handleChangeColor = (id, colorId, e) => {
    if (e) e.stopPropagation();
    setNotes(prev => prev.map(n => n.id === id ? { ...n, colorId } : n));
  };

  // Toggle checklist item status inside a note
  const handleToggleChecklistItem = (noteId, itemId, e) => {
    if (e) e.stopPropagation();
    setNotes(prev => prev.map(n => {
      if (n.id !== noteId) return n;
      const updatedItems = (n.checklistItems || []).map(item => 
        item.id === itemId ? { ...item, done: !item.done } : item
      );
      return { ...n, checklistItems: updatedItems, updatedAt: new Date().toISOString() };
    }));
  };

  // Copy note text
  const handleCopyNote = (note, e) => {
    if (e) e.stopPropagation();
    let text = note.title ? `${note.title}\n\n` : '';
    if (note.isChecklist) {
      text += (note.checklistItems || [])
        .map(i => `${i.done ? '[x]' : '[ ]'} ${i.text}`)
        .join('\n');
    } else {
      text += note.body;
    }
    navigator.clipboard.writeText(text);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 1500);
    if (onShowToast) onShowToast('Copied to Clipboard');
  };

  // Update edited note
  const handleUpdateEditingNote = (updated) => {
    setNotes(prev => prev.map(n => n.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : n));
    setEditingNote(null);
    if (onShowToast) onShowToast('Note Updated');
  };

  // Export Notes to JSON file
  const handleExportNotes = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(notes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `asi_notes_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    if (onShowToast) onShowToast('Notes Exported', `${notes.length} notes saved`);
  };

  // Import Notes from JSON file
  const handleImportNotes = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          setNotes(imported);
          if (onShowToast) onShowToast('Notes Restored', `${imported.length} notes loaded`);
        }
      } catch (err) {
        if (onShowToast) onShowToast('Import Failed', 'Invalid JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filter & Sort notes with useMemo for peak performance
  const filteredAndSortedNotes = useMemo(() => {
    let result = notes.filter(n => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.body && n.body.toLowerCase().includes(q)) ||
        (n.tag && n.tag.toLowerCase().includes(q)) ||
        (n.checklistItems && n.checklistItems.some(i => i.text.toLowerCase().includes(q)));
      
      const matchesTag = selectedTag === 'All' || n.tag === selectedTag;

      return matchesSearch && matchesTag;
    });

    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0));
    } else if (sortBy === 'alpha') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return result;
  }, [notes, searchQuery, selectedTag, sortBy]);

  const pinnedNotes = useMemo(() => filteredAndSortedNotes.filter(n => n.isPinned), [filteredAndSortedNotes]);
  const otherNotes = useMemo(() => filteredAndSortedNotes.filter(n => !n.isPinned), [filteredAndSortedNotes]);

  const getColorObj = (colorId) => AMOLED_NOTE_COLORS.find(c => c.id === colorId) || AMOLED_NOTE_COLORS[0];

  return (
    <div className="keep-notes-container amoled-notes-view">
      {/* Top Header Bar: Clean "NOTES", no description */}
      <div className="keep-header-bar">
        <div className="keep-header-left">
          <button 
            className="icon-btn-round" 
            onClick={onBackToMonitor}
            title="Back to Monitor"
            aria-label="Back to Monitor"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="keep-title-wrap">
            <h1 className="keep-title" style={{ fontSize: '1.25rem', letterSpacing: '0.05em' }}>NOTES</h1>
          </div>
        </div>

        <div className="keep-header-right" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Export Notes */}
          <button 
            className="icon-btn-round"
            onClick={handleExportNotes}
            title="Export Notes Backup (JSON)"
            aria-label="Export Notes"
          >
            <Download size={16} />
          </button>

          {/* Import Notes */}
          <button 
            className="icon-btn-round"
            onClick={() => fileInputRef.current?.click()}
            title="Import Notes Backup"
            aria-label="Import Notes"
          >
            <Upload size={16} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportNotes} 
            accept=".json" 
            style={{ display: 'none' }} 
          />

          {/* Sort Toggle */}
          <button 
            className="icon-btn-round"
            onClick={() => setSortBy(prev => prev === 'newest' ? 'alpha' : prev === 'alpha' ? 'oldest' : 'newest')}
            title={`Sort: ${sortBy.toUpperCase()}`}
            aria-label="Sort Notes"
          >
            <ArrowUpDown size={16} />
          </button>

          {/* Grid / List Layout Toggle */}
          <button 
            className="icon-btn-round"
            onClick={() => setIsGridView(!isGridView)}
            title={isGridView ? 'Switch to list view' : 'Switch to grid view'}
            aria-label="Toggle layout"
          >
            {isGridView ? <List size={17} /> : <Grid size={17} />}
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="keep-search-bar-wrap">
        <Search size={16} className="keep-search-icon" />
        <input 
          type="text"
          className="keep-search-input"
          placeholder="Search notes, tasks, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button 
            className="keep-search-clear" 
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Tag / Category Filter Pills */}
      <div className="notes-tag-pills-bar">
        {NOTE_TAGS.map(t => (
          <button
            key={t}
            className={`notes-tag-pill ${selectedTag === t ? 'active' : ''}`}
            onClick={() => setSelectedTag(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Quick AMOLED Note Composer */}
      <div 
        className={`keep-composer-card ${isComposerOpen ? 'composer-expanded' : ''}`}
        ref={composerRef}
        style={{
          backgroundColor: getColorObj(composerColor).bg,
          borderColor: getColorObj(composerColor).border
        }}
      >
        {!isComposerOpen ? (
          <div 
            className="keep-composer-collapsed"
            onClick={() => setIsComposerOpen(true)}
          >
            <span className="keep-composer-placeholder">Take a note or create checklist...</span>
            <div className="composer-collapsed-actions">
              <button 
                type="button" 
                className="composer-icon-action"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsComposerOpen(true);
                  setComposerIsChecklist(true);
                }}
                title="Create Checklist"
              >
                <CheckSquare size={16} color="#00e5ff" />
              </button>
              <button 
                type="button" 
                className="composer-icon-action"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsComposerOpen(true);
                  setShowColorPicker(true);
                }}
                title="Change Color"
              >
                <Palette size={16} />
              </button>
              <button 
                type="button" 
                className="composer-icon-action"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsComposerOpen(true);
                  setComposerPinned(true);
                }}
                title="Pin Note"
              >
                <Pin size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="keep-composer-form">
            <div className="composer-header-row">
              <input 
                type="text"
                className="composer-title-input"
                placeholder="Title"
                value={composerTitle}
                onChange={(e) => setComposerTitle(e.target.value)}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  type="button"
                  className={`composer-pin-btn ${composerIsChecklist ? 'pinned-active' : ''}`}
                  onClick={() => setComposerIsChecklist(!composerIsChecklist)}
                  title={composerIsChecklist ? 'Switch to standard text note' : 'Switch to checklist'}
                >
                  <CheckSquare size={16} />
                </button>
                <button 
                  type="button"
                  className={`composer-pin-btn ${composerPinned ? 'pinned-active' : ''}`}
                  onClick={() => setComposerPinned(!composerPinned)}
                  title={composerPinned ? 'Unpin note' : 'Pin note'}
                >
                  <Pin size={16} />
                </button>
              </div>
            </div>

            {/* Note Tag Selector */}
            <div className="composer-tags-row">
              <span className="composer-tag-label"><Tag size={12} /> Tag:</span>
              {NOTE_TAGS.filter(t => t !== 'All').map(t => (
                <button
                  key={t}
                  type="button"
                  className={`composer-mini-tag ${composerTag === t ? 'active' : ''}`}
                  onClick={() => setComposerTag(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Note Body or Checklist Form */}
            {!composerIsChecklist ? (
              <textarea 
                className="composer-body-textarea"
                placeholder="Take a note..."
                rows={3}
                value={composerBody}
                onChange={(e) => setComposerBody(e.target.value)}
              />
            ) : (
              <div className="composer-checklist-container">
                {composerChecklist.map((item, idx) => (
                  <div key={item.id} className="checklist-input-row">
                    <Square size={16} color="#71717a" />
                    <input 
                      type="text"
                      className="checklist-text-input"
                      placeholder={`Task item #${idx + 1}`}
                      value={item.text}
                      onChange={(e) => {
                        const val = e.target.value;
                        setComposerChecklist(prev => prev.map(it => it.id === item.id ? { ...it, text: val } : it));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          setComposerChecklist(prev => [...prev, { id: Date.now().toString(), text: '', done: false }]);
                        }
                      }}
                    />
                    {composerChecklist.length > 1 && (
                      <button 
                        type="button" 
                        className="checklist-del-btn"
                        onClick={() => setComposerChecklist(prev => prev.filter(it => it.id !== item.id))}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  type="button" 
                  className="add-checklist-item-btn"
                  onClick={() => setComposerChecklist(prev => [...prev, { id: Date.now().toString(), text: '', done: false }])}
                >
                  <Plus size={13} />
                  <span>Add Checklist Item</span>
                </button>
              </div>
            )}

            {/* AMOLED Color Palette Bar */}
            {showColorPicker && (
              <div className="keep-color-palette-bar">
                {AMOLED_NOTE_COLORS.map(c => (
                  <button 
                    key={c.id}
                    type="button"
                    className={`keep-color-dot ${composerColor === c.id ? 'active-dot' : ''}`}
                    style={{ backgroundColor: c.bg, borderColor: c.border }}
                    onClick={() => setComposerColor(c.id)}
                    title={c.name}
                  />
                ))}
              </div>
            )}

            <div className="composer-footer-row">
              <div className="composer-tools-left">
                <button 
                  type="button"
                  className="composer-tool-btn"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  title="Color theme"
                >
                  <Palette size={16} />
                </button>
              </div>

              <div className="composer-actions-right">
                <button 
                  type="button"
                  className="composer-cancel-btn"
                  onClick={resetComposer}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  className="composer-save-btn"
                  onClick={handleSaveNote}
                >
                  <Plus size={15} strokeWidth={3} />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notes Scroll Area */}
      <div className="keep-notes-scroll-area">
        {filteredAndSortedNotes.length === 0 ? (
          <div className="keep-empty-state">
            <Sparkles size={36} color="#00e5ff" />
            <p className="empty-state-title">No notes found</p>
            <p className="empty-state-desc">
              {searchQuery ? `No notes matching "${searchQuery}"` : 'Tap above to create your first note or task checklist.'}
            </p>
          </div>
        ) : (
          <>
            {/* PINNED SECTION */}
            {pinnedNotes.length > 0 && (
              <div className="keep-section-group">
                <div className="notes-section-header">
                  <Pin size={12} color="#00e5ff" />
                  <span className="keep-section-title">PINNED</span>
                </div>
                <div className={`keep-notes-grid ${!isGridView ? 'keep-list-layout' : ''}`}>
                  {pinnedNotes.map(note => (
                    <NoteCard 
                      key={note.id}
                      note={note}
                      getColorObj={getColorObj}
                      onEdit={() => setEditingNote(note)}
                      onTogglePin={(e) => handleTogglePin(note.id, e)}
                      onDelete={(e) => handleDeleteNote(note.id, e)}
                      onChangeColor={(colorId, e) => handleChangeColor(note.id, colorId, e)}
                      onToggleItem={(itemId, e) => handleToggleChecklistItem(note.id, itemId, e)}
                      onCopy={(e) => handleCopyNote(note, e)}
                      isCopied={copiedId === note.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* OTHERS SECTION */}
            {otherNotes.length > 0 && (
              <div className="keep-section-group">
                {pinnedNotes.length > 0 && (
                  <div className="notes-section-header">
                    <Layers size={12} color="#71717a" />
                    <span className="keep-section-title">OTHER NOTES</span>
                  </div>
                )}
                <div className={`keep-notes-grid ${!isGridView ? 'keep-list-layout' : ''}`}>
                  {otherNotes.map(note => (
                    <NoteCard 
                      key={note.id}
                      note={note}
                      getColorObj={getColorObj}
                      onEdit={() => setEditingNote(note)}
                      onTogglePin={(e) => handleTogglePin(note.id, e)}
                      onDelete={(e) => handleDeleteNote(note.id, e)}
                      onChangeColor={(colorId, e) => handleChangeColor(note.id, colorId, e)}
                      onToggleItem={(itemId, e) => handleToggleChecklistItem(note.id, itemId, e)}
                      onCopy={(e) => handleCopyNote(note, e)}
                      isCopied={copiedId === note.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Note Modal */}
      {editingNote && (
        <EditNoteModal 
          note={editingNote}
          getColorObj={getColorObj}
          onClose={() => setEditingNote(null)}
          onSave={handleUpdateEditingNote}
          onDelete={() => {
            setNotes(prev => prev.filter(n => n.id !== editingNote.id));
            setEditingNote(null);
            if (onShowToast) onShowToast('Note Removed');
          }}
        />
      )}
    </div>
  );
}

// Single Note Card Component
function NoteCard({ 
  note, 
  getColorObj, 
  onEdit, 
  onTogglePin, 
  onDelete, 
  onChangeColor, 
  onToggleItem,
  onCopy,
  isCopied
}) {
  const [showColors, setShowColors] = useState(false);
  const color = getColorObj(note.colorId);

  const completedCount = note.isChecklist && note.checklistItems 
    ? note.checklistItems.filter(i => i.done).length 
    : 0;
  const totalCount = note.isChecklist && note.checklistItems ? note.checklistItems.length : 0;

  return (
    <div 
      className="keep-note-card amoled-card-item"
      style={{
        backgroundColor: color.bg,
        borderColor: color.border
      }}
      onClick={onEdit}
    >
      <div className="note-card-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
          {note.title && <h3 className="note-card-title">{note.title}</h3>}
          {note.tag && (
            <span className="note-card-tag-badge">
              <Tag size={10} />
              {note.tag}
            </span>
          )}
        </div>
        <button 
          className={`note-pin-btn ${note.isPinned ? 'pinned' : ''}`}
          onClick={onTogglePin}
          title={note.isPinned ? 'Unpin note' : 'Pin note'}
          aria-label={note.isPinned ? 'Unpin note' : 'Pin note'}
        >
          <Pin size={14} />
        </button>
      </div>

      {/* Checklist items or plain text body */}
      {note.isChecklist ? (
        <div className="note-checklist-preview">
          {note.checklistItems && note.checklistItems.slice(0, 5).map(item => (
            <div 
              key={item.id} 
              className={`note-checklist-row ${item.done ? 'item-done' : ''}`}
              onClick={(e) => onToggleItem(item.id, e)}
            >
              {item.done ? (
                <CheckSquare size={14} color="#00e676" />
              ) : (
                <Square size={14} color="#71717a" />
              )}
              <span className="checklist-item-text">{item.text}</span>
            </div>
          ))}
          {totalCount > 5 && (
            <span className="checklist-more-count">+{totalCount - 5} more items</span>
          )}
          {totalCount > 0 && (
            <div className="checklist-progress-bar-wrap">
              <div 
                className="checklist-progress-bar-fill" 
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          )}
        </div>
      ) : (
        note.body && (
          <p className="note-card-body">{note.body}</p>
        )
      )}

      {/* Card Footer Actions */}
      <div className="note-card-footer" onClick={(e) => e.stopPropagation()}>
        <div className="note-footer-left">
          <button 
            className="note-action-icon"
            onClick={(e) => {
              e.stopPropagation();
              setShowColors(!showColors);
            }}
            title="Change color"
          >
            <Palette size={13} />
          </button>
          
          <button 
            className="note-action-icon"
            onClick={onCopy}
            title="Copy note"
          >
            {isCopied ? <Check size={13} color="#00e676" /> : <Copy size={13} />}
          </button>

          <button 
            className="note-action-icon delete-note-btn"
            onClick={onDelete}
            title="Delete note"
          >
            <Trash2 size={13} />
          </button>
        </div>

        <span className="note-date-text">
          {new Date(note.updatedAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Quick Color Picker dropdown on card */}
      {showColors && (
        <div className="card-color-dropdown" onClick={(e) => e.stopPropagation()}>
          {AMOLED_NOTE_COLORS.map(c => (
            <button 
              key={c.id}
              className={`keep-color-dot-mini ${note.colorId === c.id ? 'active' : ''}`}
              style={{ backgroundColor: c.bg, borderColor: c.border }}
              onClick={(e) => {
                onChangeColor(c.id, e);
                setShowColors(false);
              }}
              title={c.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Modal for editing an existing note
function EditNoteModal({ note, getColorObj, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState(note.title || '');
  const [body, setBody] = useState(note.body || '');
  const [tag, setTag] = useState(note.tag || 'Strategy');
  const [colorId, setColorId] = useState(note.colorId || 'amoled');
  const [isPinned, setIsPinned] = useState(Boolean(note.isPinned));
  const [isChecklist, setIsChecklist] = useState(Boolean(note.isChecklist));
  const [checklistItems, setChecklistItems] = useState(
    note.checklistItems && note.checklistItems.length > 0 
      ? note.checklistItems 
      : [{ id: '1', text: '', done: false }]
  );
  const [showColorPicker, setShowColorPicker] = useState(false);

  const currentColor = getColorObj(colorId);

  const handleSave = () => {
    onSave({
      ...note,
      title: title.trim() || (isChecklist ? 'Checklist' : 'Untitled Note'),
      body: isChecklist ? '' : body.trim(),
      tag,
      isChecklist,
      checklistItems: isChecklist ? checklistItems.filter(i => i.text.trim()) : [],
      colorId,
      isPinned
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="keep-edit-modal-card amoled-modal-card" 
        style={{
          backgroundColor: currentColor.bg,
          borderColor: currentColor.border
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="edit-modal-header">
          <input 
            type="text"
            className="composer-title-input modal-title-input"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '6px' }}>
            <button 
              type="button"
              className={`composer-pin-btn ${isChecklist ? 'pinned-active' : ''}`}
              onClick={() => setIsChecklist(!isChecklist)}
              title={isChecklist ? 'Convert to text' : 'Convert to checklist'}
            >
              <CheckSquare size={16} />
            </button>
            <button 
              type="button"
              className={`composer-pin-btn ${isPinned ? 'pinned-active' : ''}`}
              onClick={() => setIsPinned(!isPinned)}
              title={isPinned ? 'Unpin note' : 'Pin note'}
            >
              <Pin size={17} />
            </button>
          </div>
        </div>

        {/* Tag Picker */}
        <div className="composer-tags-row" style={{ padding: '4px 0 10px' }}>
          <span className="composer-tag-label"><Tag size={12} /> Tag:</span>
          {NOTE_TAGS.filter(t => t !== 'All').map(t => (
            <button
              key={t}
              type="button"
              className={`composer-mini-tag ${tag === t ? 'active' : ''}`}
              onClick={() => setTag(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {!isChecklist ? (
          <textarea 
            className="composer-body-textarea modal-body-textarea"
            placeholder="Note content..."
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        ) : (
          <div className="composer-checklist-container modal-checklist-scroll">
            {checklistItems.map((item, idx) => (
              <div key={item.id} className="checklist-input-row">
                <button 
                  type="button"
                  className="checklist-toggle-btn"
                  onClick={() => setChecklistItems(prev => prev.map(it => it.id === item.id ? { ...it, done: !it.done } : it))}
                >
                  {item.done ? <CheckSquare size={16} color="#00e676" /> : <Square size={16} color="#71717a" />}
                </button>
                <input 
                  type="text"
                  className={`checklist-text-input ${item.done ? 'item-done' : ''}`}
                  placeholder={`Task item #${idx + 1}`}
                  value={item.text}
                  onChange={(e) => {
                    const val = e.target.value;
                    setChecklistItems(prev => prev.map(it => it.id === item.id ? { ...it, text: val } : it));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      setChecklistItems(prev => [...prev, { id: Date.now().toString(), text: '', done: false }]);
                    }
                  }}
                />
                {checklistItems.length > 1 && (
                  <button 
                    type="button" 
                    className="checklist-del-btn"
                    onClick={() => setChecklistItems(prev => prev.filter(it => it.id !== item.id))}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            <button 
              type="button" 
              className="add-checklist-item-btn"
              onClick={() => setChecklistItems(prev => [...prev, { id: Date.now().toString(), text: '', done: false }])}
            >
              <Plus size={13} />
              <span>Add Checklist Item</span>
            </button>
          </div>
        )}

        {showColorPicker && (
          <div className="keep-color-palette-bar" style={{ padding: '8px 0' }}>
            {AMOLED_NOTE_COLORS.map(c => (
              <button 
                key={c.id}
                type="button"
                className={`keep-color-dot ${colorId === c.id ? 'active-dot' : ''}`}
                style={{ backgroundColor: c.bg, borderColor: c.border }}
                onClick={() => setColorId(c.id)}
                title={c.name}
              />
            ))}
          </div>
        )}

        <div className="edit-modal-footer">
          <div className="edit-footer-tools">
            <button 
              type="button" 
              className="composer-tool-btn"
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Color options"
            >
              <Palette size={17} />
            </button>
            <button 
              type="button" 
              className="composer-tool-btn delete-tool-btn"
              onClick={onDelete}
              title="Delete note"
            >
              <Trash2 size={17} />
            </button>
          </div>

          <div className="edit-footer-buttons">
            <button 
              type="button" 
              className="modal-cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="add-btn"
              onClick={handleSave}
            >
              <Edit3 size={15} />
              <span>Update</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
