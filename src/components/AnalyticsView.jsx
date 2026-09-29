import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  TrendingUp, 
  Users, 
  Zap, 
  Award, 
  BarChart3, 
  ExternalLink,
  CheckCircle,
  Clock,
  PieChart,
  Calendar
} from 'lucide-react';
import { formatExactFollowers } from '../utils/formatters';

export default function AnalyticsView({ pages = [], onBackToMonitor, onShowToast }) {
  const [timeframe, setTimeframe] = useState('24h'); // 'live' | '24h' | '7d' | '30d'
  const [activeTooltip, setActiveTooltip] = useState(null);

  // Calculate high-level summary metrics
  const totalFollowers = useMemo(() => {
    return pages.reduce((acc, p) => acc + (typeof p.followers === 'number' ? p.followers : 0), 0);
  }, [pages]);

  const totalGrowth24h = useMemo(() => {
    return pages.reduce((acc, p) => acc + (typeof p.growth === 'number' ? p.growth : 0), 0);
  }, [pages]);

  const topPage = useMemo(() => {
    if (!pages || pages.length === 0) return null;
    return [...pages].sort((a, b) => (b.followers || 0) - (a.followers || 0))[0];
  }, [pages]);

  const topGrowthPage = useMemo(() => {
    if (!pages || pages.length === 0) return null;
    return [...pages].sort((a, b) => (b.growth || 0) - (a.growth || 0))[0];
  }, [pages]);

  const sortedByFollowers = useMemo(() => {
    return [...pages].sort((a, b) => (b.followers || 0) - (a.followers || 0));
  }, [pages]);

  // Max follower count for scaling charts
  const maxFollowers = useMemo(() => {
    return Math.max(...pages.map(p => p.followers || 0), 1000);
  }, [pages]);

  // Generate responsive SVG trajectory data points for the 24-hour line graph
  const trajectoryPoints = useMemo(() => {
    const times = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Now'];
    const count = times.length;
    const base = Math.max(0, totalFollowers - totalGrowth24h);
    
    // Multipliers for timeframe
    const multiplier = timeframe === 'live' ? 0.2 : timeframe === '24h' ? 1.0 : timeframe === '7d' ? 4.5 : 18.0;
    const effectiveGrowth = totalGrowth24h * multiplier;

    return times.map((t, idx) => {
      // smooth curve progression
      const progress = idx / (count - 1);
      const ease = Math.pow(progress, 1.2);
      const val = Math.round(base + effectiveGrowth * ease);
      return { time: t, value: val };
    });
  }, [totalFollowers, totalGrowth24h, timeframe]);

  // SVG Coordinates for Line Chart (viewBox: 0 0 500 180)
  const lineChartData = useMemo(() => {
    if (!trajectoryPoints || trajectoryPoints.length === 0) return { path: '', area: '', points: [] };
    const minVal = Math.min(...trajectoryPoints.map(p => p.value));
    const maxVal = Math.max(...trajectoryPoints.map(p => p.value));
    const range = (maxVal - minVal) || 1;
    
    const svgW = 500;
    const svgH = 160;
    const paddingX = 35;
    const paddingY = 25;

    const pts = trajectoryPoints.map((p, idx) => {
      const x = paddingX + (idx / (trajectoryPoints.length - 1)) * (svgW - paddingX * 2);
      const y = svgH - paddingY - ((p.value - minVal) / range) * (svgH - paddingY * 2);
      return { ...p, x, y };
    });

    // Build smooth Bezier path
    let pathD = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const current = pts[i];
      const next = pts[i + 1];
      const controlX = (current.x + next.x) / 2;
      pathD += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
    }

    const areaD = `${pathD} L ${pts[pts.length - 1].x} ${svgH - 5} L ${pts[0].x} ${svgH - 5} Z`;

    return { path: pathD, area: areaD, points: pts };
  }, [trajectoryPoints]);

  return (
    <div className="analytics-view-container">
      {/* Header Bar */}
      <div className="analytics-header-bar">
        <div className="analytics-header-left">
          <button 
            className="icon-btn-round" 
            onClick={onBackToMonitor}
            title="Back to Monitor"
            aria-label="Back to Monitor"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="analytics-title-group">
            <h1 className="analytics-page-title">Analytics Graph</h1>
            <span className="analytics-tag-pill">Real-Time Insights</span>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="analytics-timeframe-pills">
          {[
            { id: 'live', label: 'Live' },
            { id: '24h', label: '24H' },
            { id: '7d', label: '7D' },
            { id: '30d', label: '30D' }
          ].map(tf => (
            <button
              key={tf.id}
              className={`timeframe-pill-btn ${timeframe === tf.id ? 'active' : ''}`}
              onClick={() => setTimeframe(tf.id)}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      <div className="analytics-scroll-body">
        {/* KPI Summary Cards Grid */}
        <div className="analytics-kpi-grid">
          {/* Card 1: Total Reach */}
          <div className="analytics-kpi-card">
            <div className="kpi-icon-row">
              <span className="kpi-label">TOTAL REACH</span>
              <div className="kpi-icon-wrap" style={{ background: 'rgba(0, 229, 255, 0.1)', color: '#00e5ff' }}>
                <Users size={16} />
              </div>
            </div>
            <div className="kpi-value">{formatExactFollowers(totalFollowers)}</div>
            <div className="kpi-subtext">Across {pages.length} monitored pages</div>
          </div>

          {/* Card 2: 24H Net Growth */}
          <div className="analytics-kpi-card">
            <div className="kpi-icon-row">
              <span className="kpi-label">NET GROWTH</span>
              <div className="kpi-icon-wrap" style={{ background: 'rgba(0, 230, 118, 0.1)', color: '#00e676' }}>
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="kpi-value" style={{ color: '#00e676' }}>
              +{formatExactFollowers(totalGrowth24h)}
            </div>
            <div className="kpi-subtext">
              {totalFollowers > 0 ? `+${((totalGrowth24h / totalFollowers) * 100).toFixed(2)}% velocity` : 'Active'}
            </div>
          </div>

          {/* Card 3: Top Performer */}
          <div className="analytics-kpi-card">
            <div className="kpi-icon-row">
              <span className="kpi-label">TOP AUDIENCE</span>
              <div className="kpi-icon-wrap" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
                <Award size={16} />
              </div>
            </div>
            <div className="kpi-value kpi-page-title" title={topPage?.title || 'None'}>
              {topPage ? topPage.title : 'None'}
            </div>
            <div className="kpi-subtext">
              {topPage ? `${formatExactFollowers(topPage.followers)} followers` : 'Add pages to track'}
            </div>
          </div>

          {/* Card 4: Top Growth Page */}
          <div className="analytics-kpi-card">
            <div className="kpi-icon-row">
              <span className="kpi-label">GROWTH LEADER</span>
              <div className="kpi-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <Zap size={16} />
              </div>
            </div>
            <div className="kpi-value kpi-page-title" title={topGrowthPage?.title || 'None'}>
              {topGrowthPage ? topGrowthPage.title : 'None'}
            </div>
            <div className="kpi-subtext">
              {topGrowthPage ? `+${formatExactFollowers(topGrowthPage.growth)} new followers` : '0 growth'}
            </div>
          </div>
        </div>

        {/* 1. Growth Trajectory Line Graph */}
        <div className="analytics-chart-section">
          <div className="chart-header-row">
            <div className="chart-title-wrap">
              <TrendingUp size={16} color="#00e5ff" />
              <h2 className="chart-section-title">Follower Growth Trajectory</h2>
            </div>
            <span className="chart-time-badge">
              <Clock size={11} /> {timeframe.toUpperCase()} Curve
            </span>
          </div>

          <div className="line-graph-card">
            <svg 
              className="growth-trajectory-svg" 
              viewBox="0 0 500 180" 
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.38" />
                  <stop offset="85%" stopColor="#00e5ff" stopOpacity="0.02" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#00e5ff" />
                  <stop offset="70%" stopColor="#00f2fe" />
                  <stop offset="100%" stopColor="#00e676" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="35" y1="35" x2="465" y2="35" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <line x1="35" y1="80" x2="465" y2="80" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <line x1="35" y1="125" x2="465" y2="125" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

              {/* Area Under Curve */}
              {lineChartData.area && (
                <path d={lineChartData.area} fill="url(#curveGradient)" />
              )}

              {/* Spline Path */}
              {lineChartData.path && (
                <path 
                  d={lineChartData.path} 
                  fill="none" 
                  stroke="url(#strokeGradient)" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                />
              )}

              {/* Interactive Data Points */}
              {lineChartData.points.map((pt, idx) => (
                <g key={idx}>
                  <circle 
                    cx={pt.x} 
                    cy={pt.y} 
                    r="5" 
                    fill="#000000" 
                    stroke="#00e5ff" 
                    strokeWidth="2.5" 
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setActiveTooltip(pt)}
                    onClick={() => setActiveTooltip(pt)}
                  />
                  {/* Time label under axis */}
                  <text 
                    x={pt.x} 
                    y="172" 
                    textAnchor="middle" 
                    fill="#71717a" 
                    fontSize="10" 
                    fontFamily="monospace"
                  >
                    {pt.time}
                  </text>
                </g>
              ))}
            </svg>

            {/* Hover Tooltip display */}
            {activeTooltip && (
              <div className="chart-tooltip-floating">
                <span className="tooltip-time">{activeTooltip.time}</span>
                <span className="tooltip-value">{formatExactFollowers(activeTooltip.value)} Followers</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Page Comparison Bar Graph */}
        <div className="analytics-chart-section">
          <div className="chart-header-row">
            <div className="chart-title-wrap">
              <BarChart3 size={16} color="#00e676" />
              <h2 className="chart-section-title">Follower Share Comparison</h2>
            </div>
            <span className="chart-time-badge">{pages.length} Pages</span>
          </div>

          <div className="bar-comparison-card">
            {sortedByFollowers.length === 0 ? (
              <div className="analytics-empty">No pages currently tracked.</div>
            ) : (
              sortedByFollowers.map((page, idx) => {
                const percentage = totalFollowers > 0 
                  ? ((page.followers / totalFollowers) * 100).toFixed(1) 
                  : 0;
                const barWidth = Math.max(6, Math.min(100, (page.followers / maxFollowers) * 100));

                return (
                  <div key={page.id} className="analytics-bar-row">
                    <div className="bar-row-info">
                      <div className="bar-page-name-wrap">
                        <span className="bar-rank-num">#{idx + 1}</span>
                        <span className="bar-page-name">{page.title}</span>
                        {page.verified && <CheckCircle size={12} color="#00e5ff" />}
                      </div>
                      <div className="bar-numbers-wrap">
                        <span className="bar-followers-exact">{formatExactFollowers(page.followers)}</span>
                        <span className="bar-percentage-share">{percentage}%</span>
                      </div>
                    </div>

                    {/* Visual Bar Track */}
                    <div className="bar-track">
                      <div 
                        className="bar-fill" 
                        style={{ 
                          width: `${barWidth}%`,
                          background: idx === 0 
                            ? 'linear-gradient(90deg, #00e5ff, #00f2fe)' 
                            : idx === 1 
                              ? 'linear-gradient(90deg, #00e676, #69f0ae)' 
                              : idx === 2 
                                ? 'linear-gradient(90deg, #a855f7, #c084fc)' 
                                : 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 3. Performance Leaderboard Table */}
        <div className="analytics-chart-section">
          <div className="chart-header-row">
            <div className="chart-title-wrap">
              <Award size={16} color="#f59e0b" />
              <h2 className="chart-section-title">Performance Leaderboard</h2>
            </div>
          </div>

          <div className="leaderboard-table-card">
            <div className="leaderboard-table-header">
              <span className="col-rank">RANK</span>
              <span className="col-page">PAGE</span>
              <span className="col-followers">FOLLOWERS</span>
              <span className="col-growth">24H DELTA</span>
            </div>

            <div className="leaderboard-table-body">
              {sortedByFollowers.map((page, index) => (
                <div key={page.id} className="leaderboard-row">
                  <div className="col-rank">
                    <span className={`rank-badge ${index === 0 ? 'rank-gold' : index === 1 ? 'rank-silver' : index === 2 ? 'rank-bronze' : ''}`}>
                      {index + 1}
                    </span>
                  </div>

                  <div className="col-page">
                    <div className="leaderboard-page-cell">
                      <img 
                        src={page.pfp || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(page.title)}`} 
                        alt="" 
                        className="leaderboard-mini-pfp" 
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div className="leaderboard-page-text">
                        <span className="leaderboard-page-title">{page.title}</span>
                        <span className="leaderboard-page-handle">@{page.handle || 'facebook'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-followers">
                    <span className="leaderboard-num">{formatExactFollowers(page.followers)}</span>
                  </div>

                  <div className="col-growth">
                    <span className={`growth-badge-cell ${page.growth > 0 ? 'growth-pos' : ''}`}>
                      {page.growth > 0 ? `+${formatExactFollowers(page.growth)}` : '0'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
