import React from 'react';
import { ChevronLeft, Circle, Square } from 'lucide-react';

export default function AndroidNavBar({ onHomeClick }) {
  return (
    <nav className="android-nav-bar" aria-label="Android System Navigation">
      <button 
        className="android-nav-btn" 
        onClick={() => window.history.back()} 
        title="Back"
        aria-label="Back"
      >
        <ChevronLeft size={22} strokeWidth={2.5} />
      </button>

      <button 
        className="android-nav-btn" 
        onClick={onHomeClick} 
        title="Home / Scroll to Top"
        aria-label="Home"
      >
        <Circle size={18} strokeWidth={2.5} />
      </button>

      <button 
        className="android-nav-btn" 
        onClick={() => {}} 
        title="Overview / Task Switcher"
        aria-label="Recents"
      >
        <Square size={17} strokeWidth={2.5} />
      </button>
    </nav>
  );
}
