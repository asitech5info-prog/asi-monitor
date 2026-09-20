import React from 'react';
import { formatMetric } from '../utils/formatters';

export default function StatsSummaryBar({ pages = [] }) {
  const totalPages = pages.length;
  const totalFollowers = pages.reduce((sum, p) => sum + (Number(p.followers) || 0), 0);
  const totalViews = pages.reduce((sum, p) => sum + (Number(p.views) || 0), 0);

  return (
    <div className="stats-summary-bar">
      <div className="stat-item">
        <div className="stat-label">Pages</div>
        <div className="stat-value highlight-cyan">{totalPages}</div>
      </div>
      <div className="stat-divider" />
      <div className="stat-item">
        <div className="stat-label">Total Followers</div>
        <div className="stat-value highlight-green">{formatMetric(totalFollowers)}</div>
      </div>
      <div className="stat-divider" />
      <div className="stat-item">
        <div className="stat-label">Total Views</div>
        <div className="stat-value">{formatMetric(totalViews)}</div>
      </div>
    </div>
  );
}
