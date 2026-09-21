import React, { useState, useEffect, useRef } from 'react';
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
  Check
} from 'lucide-react';

const KEEP_COLORS = [
  { id: 'default', name: 'Default Dark', bg: '#182234', border: 'rgba(255,255,255,0.1)' },
  { id: 'amber', name: 'Warm Amber', bg: '#451a03', border: '#b45309' },
  { id: 'emerald', name: 'Mint Emerald', bg: '#064e3b', border: '#10b981' },
  { id: 'teal', name: 'Neon Teal', bg: '#134e4a', border: '#14b8a6' },
  { id: 'blue', name: 'Royal Blue', bg: '#172554', border: '#3b82f6' },
  { id: 'purple', name: 'Cyber Violet', bg: '#3b0764', border: '#a855f7' },
  { id: 'rose', name: 'Berry Rose', bg: '#4c0519', border: '#f43f5e' },
  { id: 'slate', name: 'Deep Titanium', bg: '#0f172a', border: '#475569' }
];

const STORAGE_KEY_NOTES = 'asi_monitor_keep_notes_v1';

const DEFAULT_NOTES = [
  {
    id: 'note-1',
    title: 'Facebook Page Viral Strategy 🚀',
    body: '1. Post high-retention 45-60s reels at 6 PM.\n2. Engage with top 10 comments in the first 15 mins.\n3. Track daily follower growth delta in ASI Monitor.',
    colorId: 'teal',
    isPinned: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'note-2',
    title: 'Milestone Goals 🎯',
    body: '• The Tech Insider: Push to 500,000 followers.\n• Nature Photography: Cross 650,000 followers.\n• Doodle Melt: Hit 5,000 live community members.',
    colorId: 'purple',
    isPinned: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'note-3',
    title: 'Content Posting Schedule 📅',
    body: 'Mon & Wed: Behind the scenes & short clips.\nFriday: Community Q&A reel.\nSunday: Weekly recap & giveaway announcement.',
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
        if (Array.isArray(parsed)) return parsed;
      }
      return DEFAULT_NOTES;
    } catch {
      return DEFAULT_NOTES;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isGridView, setIsGridView] = useState(true);
  
  // Composer state
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerTitle, setComposerTitle] = useState('');
  const [composerBody, setComposerBody] = useState('');
  const [composerColor, setComposerColor] = useState('default');
  const [composerPinned, setComposerPinned] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Edit Note Modal state
  const [editingNote, setEditingNote] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const composerRef = useRef(null);

  // Save notes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
    } catch (e) {
      console.error('Error saving keep notes:', e);
    }
  }, [notes]);

  // Click outside to collapse composer if empty
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (composerRef.current && !composerRef.current.contains(e.target)) {
        if (isComposerOpen && !composerTitle.trim() && !composerBody.trim()) {
          setIsComposerOpen(false);
          setShowColorPicker(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isComposerOpen, composerTitle, composerBody]);

  // Add new note
  const handleSaveNote = () => {
    if (!composerTitle.trim() && !composerBody.trim()) {
      setIsComposerOpen(false);
      return;
    }

    const newNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: composerTitle.trim() || 'Untitled Note',
      body: composerBody.trim(),
      colorId: composerColor,
      isPinned: composerPinned,
      updatedAt: new Date().toISOString()
    };

    setNotes(prev => [newNote, ...prev]);
    setComposerTitle('');
    setComposerBody('');
    setComposerColor('default');
    setComposerPinned(false);
    setIsComposerOpen(false);
    setShowColorPicker(false);
    if (onShowToast) onShowToast('Note Created', newNote.title);
  };

  // Toggle Pin on note
  const handleTogglePin = (id, e) => {
    e.stopPropagation();
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  };

  // Delete note
  const handleDeleteNote = (id, e) => {
    e.stopPropagation();
    setNotes(prev => prev.filter(n => n.id !== id));
    if (onShowToast) onShowToast('Note Deleted');
  };

  // Change note color
  const handleChangeColor = (id, colorId, e) => {
    if (e) e.stopPropagation();
    setNotes(prev => prev.map(n => n.id === id ? { ...n, colorId } : n));
  };

  // Copy note text
  const handleCopyNote = (note, e) => {
    e.stopPropagation();
    const text = `${note.title ? note.title + '\n\n' : ''}${note.body}`;
    navigator.clipboard.writeText(text);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 1500);
    if (onShowToast) onShowToast('Copied to clipboard');
  };

  // Update edited note
  const handleUpdateEditingNote = (updated) => {
    setNotes(prev => prev.map(n => n.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : n));
    setEditingNote(null);
    if (onShowToast) onShowToast('Note Updated');
  };

  // Filter notes based on search query
  const filteredNotes = notes.filter(n => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (n.title && n.title.toLowerCase().includes(q)) ||
           (n.body && n.body.toLowerCase().includes(q));
  });

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const otherNotes = filteredNotes.filter(n => !n.isPinned);

  const getColorObj = (colorId) => KEEP_COLORS.find(c => c.id === colorId) || KEEP_COLORS[0];

  return (
    <div className="keep-notes-container">
      {/* Top Header Bar */}
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
            <h1 className="keep-title">Keep Notes</h1>
            <span className="keep-badge">ASI Keep</span>
          </div>
        </div>

        <div className="keep-header-right">
          <button 
            className="icon-btn-round"
            onClick={() => setIsGridView(!isGridView)}
            title={isGridView ? 'Switch to list view' : 'Switch to grid view'}
            aria-label="Toggle layout"
          >
            {isGridView ? <List size={18} /> : <Grid size={18} />}
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="keep-search-bar-wrap">
        <Search size={16} className="keep-search-icon" />
        <input 
          type="text"
          className="keep-search-input"
          placeholder="Search your notes..."
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

      {/* Google Keep "Take a Note..." Quick Composer */}
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
            <span className="keep-composer-placeholder">Take a note...</span>
            <div className="composer-collapsed-actions">
              <button 
                type="button" 
                className="composer-icon-action"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsComposerOpen(true);
                  setShowColorPicker(true);
                }}
                title="Change color"
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
                title="Pin note"
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
              <button 
                type="button"
                className={`composer-pin-btn ${composerPinned ? 'pinned-active' : ''}`}
                onClick={() => setComposerPinned(!composerPinned)}
                title={composerPinned ? 'Unpin note' : 'Pin note'}
              >
                <Pin size={16} />
              </button>
            </div>

            <textarea 
              className="composer-body-textarea"
              placeholder="Take a note..."
              rows={3}
              value={composerBody}
              onChange={(e) => setComposerBody(e.target.value)}
            />

            {/* Color Palette Row */}
            {showColorPicker && (
              <div className="keep-color-palette-bar">
                {KEEP_COLORS.map(c => (
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
                  title="Color options"
                >
                  <Palette size={16} />
                </button>
              </div>

              <div className="composer-actions-right">
                <button 
                  type="button"
                  className="composer-cancel-btn"
                  onClick={() => {
                    setComposerTitle('');
                    setComposerBody('');
                    setIsComposerOpen(false);
                    setShowColorPicker(false);
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  className="composer-save-btn"
                  onClick={handleSaveNote}
                >
                  <Plus size={15} strokeWidth={3} />
                  <span>Save Note</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notes Scroll Area */}
      <div className="keep-notes-scroll-area">
        {filteredNotes.length === 0 ? (
          <div className="keep-empty-state">
            <Sparkles size={40} color="#00e5ff" />
            <p className="empty-state-title">No notes found</p>
            <p className="empty-state-desc">
              {searchQuery ? `No notes matching "${searchQuery}"` : 'Notes you add will appear here.'}
            </p>
          </div>
        ) : (
          <>
            {/* PINNED NOTES */}
            {pinnedNotes.length > 0 && (
              <div className="keep-section-group">
                <span className="keep-section-title">PINNED</span>
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
                      onCopy={(e) => handleCopyNote(note, e)}
                      isCopied={copiedId === note.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* OTHER NOTES */}
            {otherNotes.length > 0 && (
              <div className="keep-section-group">
                {pinnedNotes.length > 0 && <span className="keep-section-title">OTHERS</span>}
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
            if (onShowToast) onShowToast('Note Deleted');
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
  onCopy,
  isCopied
}) {
  const [showColors, setShowColors] = useState(false);
  const color = getColorObj(note.colorId);

  return (
    <div 
      className="keep-note-card"
      style={{
        backgroundColor: color.bg,
        borderColor: color.border
      }}
      onClick={onEdit}
    >
      <div className="note-card-header">
        {note.title && <h3 className="note-card-title">{note.title}</h3>}
        <button 
          className={`note-pin-btn ${note.isPinned ? 'pinned' : ''}`}
          onClick={onTogglePin}
          title={note.isPinned ? 'Unpin note' : 'Pin note'}
          aria-label={note.isPinned ? 'Unpin note' : 'Pin note'}
        >
          <Pin size={14} />
        </button>
      </div>

      {note.body && (
        <p className="note-card-body">{note.body}</p>
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
          {KEEP_COLORS.map(c => (
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
  const [colorId, setColorId] = useState(note.colorId || 'default');
  const [isPinned, setIsPinned] = useState(Boolean(note.isPinned));
  const [showColorPicker, setShowColorPicker] = useState(false);

  const currentColor = getColorObj(colorId);

  const handleSave = () => {
    onSave({
      ...note,
      title: title.trim() || 'Untitled Note',
      body: body.trim(),
      colorId,
      isPinned
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="keep-edit-modal-card" 
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
          <button 
            type="button"
            className={`composer-pin-btn ${isPinned ? 'pinned-active' : ''}`}
            onClick={() => setIsPinned(!isPinned)}
            title={isPinned ? 'Unpin note' : 'Pin note'}
          >
            <Pin size={17} />
          </button>
        </div>

        <textarea 
          className="composer-body-textarea modal-body-textarea"
          placeholder="Note content..."
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />

        {showColorPicker && (
          <div className="keep-color-palette-bar" style={{ padding: '8px 0' }}>
            {KEEP_COLORS.map(c => (
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
