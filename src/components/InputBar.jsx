import React, { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';

export default function InputBar({ onAddPage, isLoading }) {
  const [urlInput, setUrlInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!urlInput.trim() || isLoading) return;
    onAddPage(urlInput.trim());
    setUrlInput('');
  };

  return (
    <div className="input-section">
      <form onSubmit={handleSubmit} className="url-input-container">
        <input
          type="text"
          className="url-text-input"
          placeholder="Add Page / Profile URL..."
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className="add-btn" 
          disabled={!urlInput.trim() || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
              <span>Adding...</span>
            </>
          ) : (
            <>
              <Plus size={16} strokeWidth={3} />
              <span>Add</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
