import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  CartesianGrid
} from 'recharts';
import { LeadItem } from '../types';
import {
  PieChart as PieIcon,
  BarChart3,
  AlignLeft,
  Compass,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  CircleDot,
  X
} from 'lucide-react';

interface CategoryDistributionChartProps {
  leads: LeadItem[];
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

export type GraphType = 'donut' | 'pie' | 'horizontal' | 'column' | 'radar' | 'treemap';

// Curated professional color palette (Google-inspired, high contrast)
const PALETTE = [
  { main: '#1A73E8', light: '#E8F0FE', dark: '#1557B0', gradient: ['#1A73E8', '#4285F4'] }, // Google Blue
  { main: '#1E8E3E', light: '#E6F4EA', dark: '#137333', gradient: ['#1E8E3E', '#34A853'] }, // Google Green
  { main: '#EA8600', light: '#FEF7E0', dark: '#B06000', gradient: ['#EA8600', '#FBBC04'] }, // Google Amber
  { main: '#D93025', light: '#FCE8E6', dark: '#A50E0E', gradient: ['#D93025', '#EA4335'] }, // Google Red
  { main: '#7C3AED', light: '#F3E8FF', dark: '#5B21B6', gradient: ['#7C3AED', '#9333EA'] }, // Violet
  { main: '#0891B2', light: '#ECFEFF', dark: '#0E7490', gradient: ['#0891B2', '#06B6D4'] }, // Cyan
  { main: '#EA580C', light: '#FFF7ED', dark: '#C2410C', gradient: ['#EA580C', '#F97316'] }, // Orange
  { main: '#DB2777', light: '#FDF2F8', dark: '#BE185D', gradient: ['#DB2777', '#EC4899'] }, // Pink
  { main: '#059669', light: '#ECFDF5', dark: '#047857', gradient: ['#059669', '#10B981'] }, // Emerald
  { main: '#6366F1', light: '#EEF2FF', dark: '#4338CA', gradient: ['#6366F1', '#818CF8'] }  // Indigo
];

export const CategoryDistributionChart: React.FC<CategoryDistributionChartProps> = ({
  leads,
  selectedCategory = 'all',
  onSelectCategory
}) => {
  const [chartType, setChartType] = useState<GraphType>('donut');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Group leads by category and compute counts + percentages
  const chartData = useMemo(() => {
    if (!leads || leads.length === 0) return [];

    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      const cat = l.category && l.category.trim() ? l.category.trim() : 'Uncategorized';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, count], index) => {
        const theme = PALETTE[index % PALETTE.length];
        return {
          name,
          count,
          percentage: Number(((count / leads.length) * 100).toFixed(1)),
          color: theme.main,
          colorLight: theme.light,
          colorDark: theme.dark,
          gradient: theme.gradient
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [leads]);

  if (leads.length === 0 || chartData.length === 0) {
    return null;
  }

  const activeCategoryData = chartData.find((c) => c.name === selectedCategory);
  const isFiltered = Boolean(selectedCategory && selectedCategory !== 'all');

  const handleSliceOrBarClick = (name: string) => {
    if (!onSelectCategory) return;
    if (selectedCategory === name) {
      onSelectCategory('all');
    } else {
      onSelectCategory(name);
    }
  };

  const graphOptions: { id: GraphType; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
    { id: 'donut', label: 'Donut Chart', icon: PieIcon },
    { id: 'pie', label: 'Pie Chart', icon: CircleDot },
    { id: 'horizontal', label: 'Ranked Bars', icon: AlignLeft },
    { id: 'column', label: 'Column Chart', icon: BarChart3 },
    { id: 'radar', label: 'Radar Chart', icon: Compass },
    { id: 'treemap', label: 'Treemap Grid', icon: LayoutGrid }
  ];

  return (
    <div className="category-distribution-card border border-slate-200/90 rounded-3 p-2.5 mb-3 bg-white shadow-xs position-relative overflow-hidden">
      {/* Icon-wise Chart Switcher Bar (Purely Icons, No Dropdowns, No Unwanted Headings or Text) */}
      <div className="d-flex align-items-center justify-content-between gap-2 mb-2 pb-2 border-bottom border-slate-100">
        {/* Pure Icon Switcher Buttons */}
        <div className="d-flex align-items-center gap-1 p-1 bg-slate-100 rounded-2 border border-slate-200/80">
          {graphOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = chartType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setChartType(opt.id);
                  if (isCollapsed) setIsCollapsed(false);
                }}
                className={`btn btn-sm d-flex align-items-center justify-content-center p-0 rounded-2 border-0 transition-all ${
                  isActive ? 'shadow-xs' : 'hover:bg-slate-200'
                }`}
                style={{
                  width: '34px',
                  height: '34px',
                  cursor: 'pointer',
                  backgroundColor: isActive ? '#1A73E8' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#475569'
                }}
                title={opt.label}
                aria-label={opt.label}
              >
                <Icon size={17} />
              </button>
            );
          })}
        </div>

        {/* Filter status and collapse toggle */}
        <div className="d-flex align-items-center gap-1.5 ms-auto">
          {isFiltered && (
            <button
              type="button"
              onClick={() => onSelectCategory && onSelectCategory('all')}
              className="btn btn-sm py-1 px-2.5 rounded-pill d-inline-flex align-items-center gap-1 border-0"
              style={{ backgroundColor: '#E8F0FE', color: '#1A73E8', fontSize: '0.72rem', fontWeight: 600 }}
              title="Reset category filter"
            >
              <span>{selectedCategory}</span>
              <X size={12} className="ms-0.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="btn btn-sm btn-light border border-slate-200/80 p-0 rounded-2 d-flex align-items-center justify-content-center text-secondary shadow-none"
            style={{ width: '32px', height: '32px' }}
            title={isCollapsed ? 'Expand graph' : 'Collapse graph'}
            aria-label="Toggle graph section"
          >
            {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>
        </div>
      </div>

      {/* Main Chart Body (Only charts and graphs with suitable icons) */}
      {!isCollapsed && (
        <div className="w-100 pt-1" style={{ minHeight: '230px' }}>
          {/* 1. DONUT / RING VIEW */}
          {chartType === 'donut' && (
            <div className="row g-3 align-items-center">
              <div className="col-12 col-md-5 col-lg-5">
                <div className="position-relative d-flex align-items-center justify-content-center" style={{ height: '220px', minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                    <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div
                                className="border border-slate-700/60 rounded-2 p-2 shadow-sm"
                                style={{
                                  backgroundColor: 'rgba(15, 23, 42, 0.94)',
                                  color: '#F8FAFC',
                                  backdropFilter: 'blur(10px)',
                                  fontSize: '0.74rem'
                                }}
                              >
                                <div className="d-flex align-items-center gap-1.5 fw-bold mb-0.5">
                                  <span className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: data.color }} />
                                  <span>{data.name}</span>
                                </div>
                                <div className="text-slate-300">
                                  {data.count} ({data.percentage}%)
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Pie
                        data={chartData}
                        dataKey="count"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={92}
                        paddingAngle={2.5}
                        animationDuration={400}
                        cursor={onSelectCategory ? 'pointer' : 'default'}
                        onClick={(d) => d && d.name && handleSliceOrBarClick(d.name)}
                        onMouseEnter={(d) => d && d.name && setHoveredCategory(d.name)}
                        onMouseLeave={() => setHoveredCategory(null)}
                      >
                        {chartData.map((entry, idx) => {
                          const isSelected = selectedCategory === entry.name;
                          const isAll = !isFiltered;
                          const isHovered = hoveredCategory === entry.name;
                          const opacity = isAll || isSelected ? 1 : 0.35;
                          return (
                            <Cell
                              key={`donut-slice-${idx}`}
                              fill={entry.color}
                              opacity={opacity}
                              stroke={isSelected || isHovered ? '#0F172A' : '#FFFFFF'}
                              strokeWidth={isSelected || isHovered ? 2.5 : 1.5}
                            />
                          );
                        })}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center Metric Display inside Donut */}
                  <div
                    className="position-absolute top-50 start-50 translate-middle text-center pointer-events-none"
                    style={{ lineHeight: 1.15 }}
                  >
                    <div className="fw-bold fs-4 text-dark" style={{ letterSpacing: '-0.5px' }}>
                      {activeCategoryData ? activeCategoryData.count : leads.length}
                    </div>
                    <div className="text-secondary small fw-medium" style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      {activeCategoryData ? `${activeCategoryData.percentage}%` : 'Leads'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact Interactive Breakdown Bars */}
              <div className="col-12 col-md-7 col-lg-7">
                <div className="d-flex flex-column gap-2" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                  {chartData.map((item, idx) => {
                    const isSelected = selectedCategory === item.name;
                    return (
                      <div
                        key={`donut-list-${idx}`}
                        onClick={() => handleSliceOrBarClick(item.name)}
                        onMouseEnter={() => setHoveredCategory(item.name)}
                        onMouseLeave={() => setHoveredCategory(null)}
                        className="p-1.5 px-2 rounded-2 border transition-all cursor-pointer"
                        style={{
                          borderColor: isSelected ? item.color : '#F1F5F9',
                          backgroundColor: isSelected ? item.colorLight : '#FFFFFF',
                          boxShadow: isSelected ? `0 0 0 1px ${item.color}` : undefined
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between mb-1">
                          <div className="d-flex align-items-center gap-1.5 min-w-0">
                            <span className="rounded-circle flex-shrink-0" style={{ width: '8px', height: '8px', backgroundColor: item.color }} />
                            <span className="fw-semibold text-dark text-truncate" style={{ fontSize: '0.78rem' }}>
                              {item.name}
                            </span>
                          </div>
                          <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
                            <span className="fw-bold text-dark" style={{ fontSize: '0.78rem' }}>
                              {item.count}
                            </span>
                            <span className="text-secondary small" style={{ fontSize: '0.7rem' }}>
                              ({item.percentage}%)
                            </span>
                          </div>
                        </div>
                        <div className="w-100 bg-slate-100 rounded-pill overflow-hidden" style={{ height: '4px' }}>
                          <div
                            className="h-100 rounded-pill transition-all"
                            style={{
                              width: `${item.percentage}%`,
                              backgroundColor: item.color
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 2. CLASSIC PIE CHART VIEW */}
          {chartType === 'pie' && (
            <div className="row g-3 align-items-center">
              <div className="col-12 col-md-5 col-lg-5">
                <div className="position-relative d-flex align-items-center justify-content-center" style={{ height: '220px', minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                    <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div
                                className="border border-slate-700/60 rounded-2 p-2 shadow-sm"
                                style={{
                                  backgroundColor: 'rgba(15, 23, 42, 0.94)',
                                  color: '#F8FAFC',
                                  backdropFilter: 'blur(10px)',
                                  fontSize: '0.74rem'
                                }}
                              >
                                <div className="d-flex align-items-center gap-1.5 fw-bold mb-0.5">
                                  <span className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: data.color }} />
                                  <span>{data.name}</span>
                                </div>
                                <div className="text-slate-300">
                                  {data.count} ({data.percentage}%)
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Pie
                        data={chartData}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={92}
                        animationDuration={400}
                        cursor={onSelectCategory ? 'pointer' : 'default'}
                        onClick={(d) => d && d.name && handleSliceOrBarClick(d.name)}
                        onMouseEnter={(d) => d && d.name && setHoveredCategory(d.name)}
                        onMouseLeave={() => setHoveredCategory(null)}
                      >
                        {chartData.map((entry, idx) => {
                          const isSelected = selectedCategory === entry.name;
                          const isAll = !isFiltered;
                          const isHovered = hoveredCategory === entry.name;
                          const opacity = isAll || isSelected ? 1 : 0.35;
                          return (
                            <Cell
                              key={`pie-slice-${idx}`}
                              fill={entry.color}
                              opacity={opacity}
                              stroke={isSelected || isHovered ? '#0F172A' : '#FFFFFF'}
                              strokeWidth={isSelected || isHovered ? 2.5 : 1.5}
                            />
                          );
                        })}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart Legend & Sector Cards */}
              <div className="col-12 col-md-7 col-lg-7">
                <div className="row g-2" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                  {chartData.map((item, idx) => {
                    const isSelected = selectedCategory === item.name;
                    return (
                      <div key={`pie-grid-${idx}`} className="col-12 col-sm-6">
                        <div
                          onClick={() => handleSliceOrBarClick(item.name)}
                          onMouseEnter={() => setHoveredCategory(item.name)}
                          onMouseLeave={() => setHoveredCategory(null)}
                          className="p-2 rounded-2 border transition-all cursor-pointer h-100 d-flex flex-column justify-content-between"
                          style={{
                            borderColor: isSelected ? item.color : '#E2E8F0',
                            backgroundColor: isSelected ? item.colorLight : '#FFFFFF',
                            borderLeft: `3px solid ${item.color}`
                          }}
                        >
                          <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                            <span className="fw-semibold text-dark text-truncate" style={{ fontSize: '0.78rem' }} title={item.name}>
                              {item.name}
                            </span>
                            <span
                              className="badge rounded-pill fw-bold"
                              style={{ backgroundColor: item.colorLight, color: item.colorDark, fontSize: '0.65rem' }}
                            >
                              {item.percentage}%
                            </span>
                          </div>
                          <div className="d-flex align-items-baseline gap-1 text-secondary small" style={{ fontSize: '0.72rem' }}>
                            <strong className="text-dark">{item.count}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 3. HORIZONTAL RANK BARS VIEW */}
          {chartType === 'horizontal' && (
            <div className="d-flex flex-column gap-2" style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {chartData.map((item, idx) => {
                const isSelected = selectedCategory === item.name;
                const isHovered = hoveredCategory === item.name;
                return (
                  <div
                    key={`rank-bar-${idx}`}
                    onClick={() => handleSliceOrBarClick(item.name)}
                    onMouseEnter={() => setHoveredCategory(item.name)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className="p-2 rounded-2 border transition-all cursor-pointer"
                    style={{
                      borderColor: isSelected || isHovered ? item.color : '#F1F5F9',
                      backgroundColor: isSelected ? item.colorLight : '#FFFFFF',
                      transform: isHovered ? 'translateX(2px)' : 'none'
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between gap-2 mb-1.5">
                      <div className="d-flex align-items-center gap-2 min-w-0">
                        <span
                          className="badge rounded-circle p-0 d-inline-flex align-items-center justify-content-center text-secondary fw-semibold flex-shrink-0"
                          style={{ width: '18px', height: '18px', backgroundColor: '#F1F5F9', fontSize: '0.65rem' }}
                        >
                          {idx + 1}
                        </span>
                        <span className="rounded-circle flex-shrink-0" style={{ width: '8px', height: '8px', backgroundColor: item.color }} />
                        <span className="fw-semibold text-dark text-truncate" style={{ fontSize: '0.8rem' }}>
                          {item.name}
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-2 flex-shrink-0">
                        <span className="fw-bold text-dark" style={{ fontSize: '0.8rem' }}>
                          {item.count}
                        </span>
                        <span
                          className="badge rounded px-1.5 py-0.5 fw-semibold"
                          style={{ backgroundColor: item.colorLight, color: item.colorDark, fontSize: '0.68rem' }}
                        >
                          {item.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Full-width gradient bar */}
                    <div className="w-100 bg-slate-100 rounded-pill overflow-hidden" style={{ height: '6px' }}>
                      <div
                        className="h-100 rounded-pill transition-all"
                        style={{
                          width: `${item.percentage}%`,
                          background: `linear-gradient(90deg, ${item.gradient[0]}, ${item.gradient[1]})`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 4. VERTICAL COLUMNS VIEW */}
          {chartType === 'column' && (
            <div style={{ height: '230px', width: '100%', minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 15, left: -10, bottom: 25 }}
                >
                  <defs>
                    {chartData.map((entry, idx) => (
                      <linearGradient key={`colGrad-${idx}`} id={`colGrad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={entry.gradient[1]} stopOpacity={1} />
                        <stop offset="100%" stopColor={entry.gradient[0]} stopOpacity={0.85} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="name"
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickLine={false}
                    interval={0}
                    tick={({ x, y, payload }) => {
                      const isSelected = selectedCategory === payload.value;
                      const isHovered = hoveredCategory === payload.value;
                      const maxLen = 12;
                      const truncated = payload.value.length > maxLen
                        ? `${payload.value.substring(0, maxLen)}…`
                        : payload.value;
                      return (
                        <text
                          x={x}
                          y={y}
                          dy={12}
                          textAnchor="middle"
                          fill={isSelected ? '#1A73E8' : (isHovered ? '#0F172A' : '#64748B')}
                          fontWeight={isSelected || isHovered ? 700 : 500}
                          fontSize={10}
                          style={{ cursor: onSelectCategory ? 'pointer' : 'default' }}
                          onClick={() => handleSliceOrBarClick(payload.value)}
                        >
                          {truncated}
                        </text>
                      );
                    }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94A3B8', fontSize: 10 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(26, 115, 232, 0.04)', radius: 6 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div
                            className="border border-slate-700/60 rounded-2 p-2 shadow-sm"
                            style={{
                              backgroundColor: 'rgba(15, 23, 42, 0.94)',
                              color: '#F8FAFC',
                              backdropFilter: 'blur(10px)',
                              fontSize: '0.74rem'
                            }}
                          >
                            <div className="d-flex align-items-center gap-1.5 fw-bold mb-0.5">
                              <span className="rounded-circle" style={{ width: '8px', height: '8px', backgroundColor: data.color }} />
                              <span>{data.name}</span>
                            </div>
                            <div className="text-slate-300">
                              {data.count} ({data.percentage}%)
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[6, 6, 0, 0]}
                    animationDuration={400}
                    cursor={onSelectCategory ? 'pointer' : 'default'}
                    onClick={(d) => d && d.name && handleSliceOrBarClick(d.name)}
                  >
                    {chartData.map((entry, idx) => {
                      const isSelected = selectedCategory === entry.name;
                      const isAll = !isFiltered;
                      const isHovered = hoveredCategory === entry.name;
                      const opacity = isAll || isSelected ? 1 : 0.35;
                      return (
                        <Cell
                          key={`col-cell-${idx}`}
                          fill={`url(#colGrad-${idx})`}
                          opacity={opacity}
                          stroke={isSelected || isHovered ? '#0F172A' : 'none'}
                          strokeWidth={isSelected || isHovered ? 1.5 : 0}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 5. RADAR MATRIX VIEW (Clean centered graph, no unwanted paragraphs) */}
          {chartType === 'radar' && (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '240px', width: '100%', minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                <RadarChart data={chartData} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis
                    dataKey="name"
                    tick={({ x, y, payload }) => {
                      const maxLen = 14;
                      const text = payload.value.length > maxLen
                        ? `${payload.value.substring(0, maxLen)}…`
                        : payload.value;
                      const isSelected = selectedCategory === payload.value;
                      return (
                        <text
                          x={x}
                          y={y}
                          fontSize={10}
                          fontWeight={isSelected ? 700 : 500}
                          fill={isSelected ? '#1A73E8' : '#475569'}
                          textAnchor="middle"
                          dy={3}
                          style={{ cursor: onSelectCategory ? 'pointer' : 'default' }}
                          onClick={() => handleSliceOrBarClick(payload.value)}
                        >
                          {text}
                        </text>
                      );
                    }}
                  />
                  <PolarRadiusAxis angle={30} stroke="#94A3B8" fontSize={9} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div
                            className="border border-slate-700/60 rounded-2 p-2 shadow-sm"
                            style={{
                              backgroundColor: 'rgba(15, 23, 42, 0.94)',
                              color: '#F8FAFC',
                              backdropFilter: 'blur(10px)',
                              fontSize: '0.74rem'
                            }}
                          >
                            <div className="fw-bold mb-0.5">{data.name}</div>
                            <div className="text-slate-300">{data.count} ({data.percentage}%)</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Radar
                    name="Leads"
                    dataKey="count"
                    stroke="#1A73E8"
                    fill="#4285F4"
                    fillOpacity={0.45}
                    animationDuration={400}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 6. TREEMAP / AREA TILES VIEW */}
          {chartType === 'treemap' && (
            <div className="row g-2" style={{ minHeight: '190px' }}>
              {chartData.map((item, idx) => {
                const isSelected = selectedCategory === item.name;
                const isHovered = hoveredCategory === item.name;
                const colClass = item.percentage >= 40
                  ? 'col-12 col-sm-6 col-lg-6'
                  : item.percentage >= 20
                  ? 'col-6 col-sm-6 col-lg-3'
                  : 'col-6 col-sm-4 col-lg-3';

                return (
                  <div key={`treemap-tile-${idx}`} className={colClass}>
                    <div
                      onClick={() => handleSliceOrBarClick(item.name)}
                      onMouseEnter={() => setHoveredCategory(item.name)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      className="p-2.5 rounded-2 border h-100 d-flex flex-column justify-content-between cursor-pointer transition-all position-relative overflow-hidden"
                      style={{
                        borderColor: isSelected || isHovered ? item.color : '#E2E8F0',
                        backgroundColor: isSelected ? item.colorLight : '#FFFFFF',
                        borderLeft: `4px solid ${item.color}`,
                        minHeight: '84px',
                        boxShadow: isHovered ? '0 4px 12px -2px rgba(0,0,0,0.06)' : undefined,
                        transform: isHovered ? 'scale(1.015)' : 'none'
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                        <span className="fw-semibold text-dark text-truncate" style={{ fontSize: '0.78rem' }} title={item.name}>
                          {item.name}
                        </span>
                        <span
                          className="badge rounded-pill fw-bold flex-shrink-0"
                          style={{ backgroundColor: item.colorLight, color: item.colorDark, fontSize: '0.65rem' }}
                        >
                          {item.percentage}%
                        </span>
                      </div>
                      <div className="d-flex align-items-baseline gap-1 mt-auto">
                        <span className="fs-5 fw-bold text-dark" style={{ letterSpacing: '-0.3px', lineHeight: 1 }}>
                          {item.count}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
