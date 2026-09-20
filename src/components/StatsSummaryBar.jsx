import React from 'react';
import { formatExactFollowers, formatGrowth } from '../utils/formatters';

export default function StatsSummaryBar({ pages = [] }) {
  const totalPages = pages.length;
  const totalFollowers = pages.reduce((sum, p) => sum + (Number(p.followers) || 0), 0);
  const totalGrowth = pages.reduce((sum, p) => sum + (Number(p.growth) || 0), 0);

  return (
    <div className="stats-summary-bar">
      <div className="stat-item">
        <div className="stat-label">Monitored</div>
        <div className="stat-value highlight-cyan">
          {totalPages} <span className="stat-sub">{totalPages === 1 ? 'Page' : 'Pages'}</span>
        </div>
      </div>
      
      <div className="stat-divider" />
      
      <div className="stat-item">
        <div className="stat-label">Total Followers</div>
        <div className="stat-value highlight-green">
          {formatExactFollowers(totalFollowers)}
        </div>
      </div>
      
      <div className="stat-divider" />
      
      <div className="stat-item">
        <div className="stat-label">Net Growth</div>
        <div className="stat-value highlight-growth">
          {formatGrowth(totalGrowth)}
        </div>
      </div>
    </div>
  );
}
