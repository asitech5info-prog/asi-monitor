import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';

export default function AndroidStatusBar() {
  const [timeStr, setTimeStr] = useState('10:09');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      let minutes = now.getMinutes();
      const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      setTimeStr(formatted);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="android-status-bar">
      <span>{timeStr}</span>
      <div className="status-bar-icons">
        <Signal size={14} strokeWidth={2.5} />
        <Wifi size={14} strokeWidth={2.5} />
        <span style={{ fontSize: '0.78rem', marginLeft: '2px', marginRight: '2px' }}>94%</span>
        <BatteryMedium size={16} strokeWidth={2.5} />
      </div>
    </div>
  );
}
