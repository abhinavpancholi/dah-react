import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts';
import { useDahStore } from '../../context/DahStore';
import { computeChartSeries } from '../../utils/aggregations';
import { formatLabel, formatIndian } from '../../utils/formatters';

const TARGET_COLOR = '#38bdf8'; // Light cyan
const TARGET_FILL = 'rgba(56, 189, 248, 0.18)';
const ACTUAL_COLOR = '#0f2342'; // Dark navy
const ACTUAL_FILL = 'rgba(15, 35, 66, 0.22)';

/**
 * Custom Tooltip matching WCD / Power BI spec
 */
function CustomChartTooltip({ active, payload, label, cumulative, hasRemarks, remarksText, unit }) {
  if (!active || !payload || !payload.length) return null;

  const dataPoint = payload[0]?.payload;
  if (!dataPoint) return null;

  const { fy, target, actual, rawTarget, rawActual } = dataPoint;
  const unitSuffix = unit ? ` ${unit}` : '';

  return (
    <div className="dah-tooltip">
      <div className="dah-tooltip__title">FY {fy}</div>
      {target != null && (
        <div className="dah-tooltip__row dah-tooltip__row--target">
          <span>{cumulative ? 'Cumulative Target:' : 'Target:'}</span>
          <span>
            {formatIndian(target)}
            {unitSuffix}
          </span>
        </div>
      )}
      {actual != null ? (
        <div className="dah-tooltip__row dah-tooltip__row--actual">
          <span>{cumulative ? 'Cumulative Actual:' : 'Actual:'}</span>
          <span>
            {formatIndian(actual)}
            {unitSuffix}
          </span>
        </div>
      ) : (
        <div className="dah-tooltip__row dah-tooltip__row--actual" style={{ opacity: 0.6 }}>
          <span>Actual:</span>
          <span>Not Reported</span>
        </div>
      )}

      {cumulative && (
        <div className="dah-tooltip__sub">
          This year: Target {rawTarget != null ? formatIndian(rawTarget) : '—'} / Actual{' '}
          {rawActual != null ? formatIndian(rawActual) : '—'}
        </div>
      )}

      {hasRemarks && remarksText && (
        <div className="dah-tooltip__sub" style={{ fontStyle: 'italic', maxWidth: 220 }}>
          {remarksText}
        </div>
      )}
    </div>
  );
}

/**
 * Custom Data Label for vertical Column chart
 */
const renderColumnLabel = (props, labelFormat, selectedFY, isTarget) => {
  const { x, y, width, value, payload } = props;
  if (value == null || isNaN(value) || x == null || isNaN(x) || y == null || isNaN(y)) return null;

  const isDimmed = selectedFY && payload?.fy !== selectedFY;
  const formatted = formatLabel(value, labelFormat);
  if (!formatted) return null;

  const barWidth = width || 10;
  const barCenterX = x + barWidth / 2;

  // Stagger labels when both Target and Actual are present to prevent horizontal collision
  const hasBoth = payload?.target != null && payload?.actual != null;
  let yOffset = -4;

  if (hasBoth) {
    const tVal = Number(payload.target);
    const aVal = Number(payload.actual);
    const diffRatio = Math.abs(tVal - aVal) / Math.max(tVal, aVal, 1);
    // When heights are close, stagger target higher
    if (diffRatio < 0.28) {
      if (isTarget) {
        yOffset = -14;
      } else {
        yOffset = -4;
      }
    }
  }

  return (
    <text
      x={barCenterX}
      y={y + yOffset}
      fill={isDimmed ? '#94a3b8' : isTarget ? '#0284c7' : '#0f172a'}
      textAnchor="middle"
      fontSize={7.5}
      fontWeight={isTarget ? 600 : 700}
      opacity={isDimmed ? 0.45 : 1}
    >
      {formatted}
    </text>
  );
};

/**
 * Custom Data Label for Line+Area chart
 */
const renderLineAreaLabel = (props, labelFormat, selectedFY, isTarget) => {
  const { x, y, value, payload } = props;
  if (value == null || isNaN(value) || x == null || isNaN(x) || y == null || isNaN(y)) return null;

  const isDimmed = selectedFY && payload?.fy !== selectedFY;
  const formatted = formatLabel(value, labelFormat);
  if (!formatted) return null;

  const hasBoth = payload?.target != null && payload?.actual != null;
  let yOffset = -7;

  if (hasBoth) {
    const tVal = Number(payload.target);
    const aVal = Number(payload.actual);
    if (isTarget) {
      yOffset = tVal < aVal ? 12 : -8;
    } else {
      yOffset = aVal < tVal ? 12 : -8;
    }
  }

  return (
    <text
      x={x}
      y={y + yOffset}
      fill={isDimmed ? '#94a3b8' : isTarget ? '#0284c7' : '#0f172a'}
      textAnchor="middle"
      fontSize={7.5}
      fontWeight={isTarget ? 600 : 700}
      opacity={isDimmed ? 0.45 : 1}
    >
      {formatted}
    </text>
  );
};

/**
 * Custom Data Label for horizontal Bar chart
 */
const renderBarLabel = (props, labelFormat, selectedFY, isTarget) => {
  const { x, y, width, height, value, payload } = props;
  if (value == null || isNaN(value) || x == null || isNaN(x) || y == null || isNaN(y)) return null;

  const isDimmed = selectedFY && payload?.fy !== selectedFY;
  const formatted = formatLabel(value, labelFormat);
  if (!formatted) return null;

  const barH = height || 6;

  return (
    <text
      x={x + (width || 0) + 3}
      y={y + barH / 2 + 3}
      fill={isDimmed ? '#94a3b8' : isTarget ? '#0284c7' : '#0f172a'}
      textAnchor="start"
      fontSize={7.5}
      fontWeight={isTarget ? 600 : 700}
      opacity={isDimmed ? 0.45 : 1}
    >
      {formatted}
    </text>
  );
};

/**
 * GenericChartPanel
 * Renders column, bar, or line+area charts based on chartConfig.
 * Handles highlight cross-filtering and opacity dimming.
 */
export default function GenericChartPanel({ chartConfig, isOverview = false }) {
  const {
    id,
    title,
    sheetCode,
    chartType = 'column',
    cumulative = false,
    labelFormat = 'integer',
    targetLabelFormat,
    noLegend = false,
    actualOnly = false,
    unit,
    hasRemarks = false,
  } = chartConfig;

  const { datasets, selectedFY, setFY } = useDahStore();

  const rawSheetData = datasets[sheetCode] || [];

  const seriesData = useMemo(() => {
    return computeChartSeries(chartConfig, rawSheetData);
  }, [chartConfig, rawSheetData]);

  // Check if selectedFY is present in this chart's axis
  const hasSelectedFYInAxis = useMemo(() => {
    if (!selectedFY || isOverview) return true;
    return seriesData.some((d) => d.fy === selectedFY);
  }, [selectedFY, isOverview, seriesData]);

  // Remarks lookup (e.g. for AIRD-51)
  const remarksText = useMemo(() => {
    if (!hasRemarks || !rawSheetData.length) return null;
    const r = rawSheetData.find((row) => row.remarks);
    return r ? r.remarks : null;
  }, [hasRemarks, rawSheetData]);

  // Click on point/bar triggers cross-highlight
  const handleItemClick = (entry) => {
    if (isOverview) return; // Overview ignores FY slicer
    if (entry && entry.fy) {
      setFY(entry.fy);
    }
  };

  if (!seriesData || seriesData.length === 0) {
    return (
      <div className="dah-chart-panel dah-chart-panel--no-data">
        <div className="dah-chart-panel__header">
          <div className="dah-chart-panel__title">{title}</div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#94a3b8',
            fontSize: '0.75rem',
          }}
        >
          No data available
        </div>
      </div>
    );
  }

  const effectiveSelectedFY = isOverview ? null : selectedFY;
  const isCardDimmed = effectiveSelectedFY && !hasSelectedFYInAxis;

  return (
    <div
      className={`dah-chart-panel ${isCardDimmed ? 'dah-chart-panel--no-data' : ''}`}
      id={`chart-${id}`}
    >
      {/* Title Bar & Legend */}
      <div className="dah-chart-panel__header">
        <div className="dah-chart-panel__title" title={title}>
          {title}
        </div>
        <div className="dah-chart-panel__legend">
          {!noLegend && (
            <>
              {!actualOnly && (
                <span>
                  <span className="dah-legend-dot dah-legend-dot--target" />
                  Target
                </span>
              )}
              <span>
                <span className="dah-legend-dot dah-legend-dot--actual" />
                Actual
              </span>
            </>
          )}

          {isCardDimmed && (
            <span className="dah-chart-panel__no-data-badge">
              No data for {effectiveSelectedFY}
            </span>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="dah-chart-panel__body">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            /* Horizontal Bar Chart */
            <BarChart
              data={seriesData}
              layout="vertical"
              margin={{ top: 6, right: 38, left: 6, bottom: 2 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="fy"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 7.5, fill: '#64748b', fontWeight: 600 }}
                width={44}
                interval={0}
              />
              <Tooltip
                content={
                  <CustomChartTooltip
                    cumulative={cumulative}
                    hasRemarks={hasRemarks}
                    remarksText={remarksText}
                    unit={unit}
                  />
                }
              />
              {!actualOnly && (
                <Bar
                  dataKey="target"
                  fill={TARGET_COLOR}
                  radius={[0, 3, 3, 0]}
                  barSize={6}
                  onClick={handleItemClick}
                  cursor="pointer"
                  label={(p) =>
                    renderBarLabel(
                      p,
                      targetLabelFormat || labelFormat,
                      effectiveSelectedFY,
                      true
                    )
                  }
                >
                  {seriesData.map((entry, index) => {
                    const isSelected = effectiveSelectedFY === entry.fy;
                    const opacity =
                      !effectiveSelectedFY || isSelected ? 1 : 0.35;
                    return <Cell key={`tgt-${index}`} fill={TARGET_COLOR} opacity={opacity} />;
                  })}
                </Bar>
              )}
              <Bar
                dataKey="actual"
                fill={ACTUAL_COLOR}
                radius={[0, 3, 3, 0]}
                barSize={6}
                onClick={handleItemClick}
                cursor="pointer"
                label={(p) => renderBarLabel(p, labelFormat, effectiveSelectedFY, false)}
              >
                {seriesData.map((entry, index) => {
                  const isSelected = effectiveSelectedFY === entry.fy;
                  const opacity =
                    !effectiveSelectedFY || isSelected ? 1 : 0.35;
                  return <Cell key={`act-${index}`} fill={ACTUAL_COLOR} opacity={opacity} />;
                })}
              </Bar>
            </BarChart>
          ) : chartType === 'line+area' ? (
            /* Line + Area Chart */
            <AreaChart
              data={seriesData}
              margin={{ top: 16, right: 12, left: 12, bottom: 2 }}
              onClick={(e) => {
                if (e && e.activeLabel) {
                  handleItemClick({ fy: e.activeLabel });
                }
              }}
            >
              <XAxis
                dataKey="fy"
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                tick={{ fontSize: 7.5, fill: '#64748b', fontWeight: 600 }}
                interval={0}
              />
              <YAxis hide />
              <Tooltip
                content={
                  <CustomChartTooltip
                    cumulative={cumulative}
                    hasRemarks={hasRemarks}
                    remarksText={remarksText}
                    unit={unit}
                  />
                }
              />
              {effectiveSelectedFY && (
                <ReferenceLine
                  x={effectiveSelectedFY}
                  stroke="#0284c7"
                  strokeDasharray="3 3"
                />
              )}
              {!actualOnly && (
                <Area
                  type="monotone"
                  dataKey="target"
                  stroke={TARGET_COLOR}
                  strokeDasharray="4 4"
                  strokeWidth={1.8}
                  fill={TARGET_FILL}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (cx == null || cy == null || payload?.target == null) return null;
                    const isSelected = effectiveSelectedFY === payload.fy;
                    const opacity = !effectiveSelectedFY || isSelected ? 1 : 0.35;
                    const r = isSelected ? 5 : 2.5;
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={r}
                        fill={TARGET_COLOR}
                        stroke="#ffffff"
                        strokeWidth={1.2}
                        opacity={opacity}
                        cursor="pointer"
                      />
                    );
                  }}
                  label={(p) =>
                    renderLineAreaLabel(
                      p,
                      targetLabelFormat || labelFormat,
                      effectiveSelectedFY,
                      true
                    )
                  }
                />
              )}
              <Area
                type="monotone"
                dataKey="actual"
                stroke={ACTUAL_COLOR}
                strokeWidth={2}
                fill={ACTUAL_FILL}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (cx == null || cy == null || payload?.actual == null) return null;
                  const isSelected = effectiveSelectedFY === payload.fy;
                  const opacity = !effectiveSelectedFY || isSelected ? 1 : 0.35;
                  const r = isSelected ? 5 : 3;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r}
                      fill={ACTUAL_COLOR}
                      stroke="#ffffff"
                      strokeWidth={1.2}
                      opacity={opacity}
                      cursor="pointer"
                    />
                  );
                }}
                label={(p) => renderLineAreaLabel(p, labelFormat, effectiveSelectedFY, false)}
              />
            </AreaChart>
          ) : (
            /* Vertical Column Chart (Clustered) */
            <BarChart
              data={seriesData}
              margin={{ top: 18, right: 8, left: 8, bottom: 2 }}
            >
              <XAxis
                dataKey="fy"
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                tick={{ fontSize: 7.5, fill: '#64748b', fontWeight: 600 }}
                interval={0}
              />
              <YAxis hide />
              <Tooltip
                content={
                  <CustomChartTooltip
                    cumulative={cumulative}
                    hasRemarks={hasRemarks}
                    remarksText={remarksText}
                    unit={unit}
                  />
                }
              />
              {!actualOnly && (
                <Bar
                  dataKey="target"
                  fill={TARGET_COLOR}
                  radius={[3, 3, 0, 0]}
                  barSize={10}
                  onClick={handleItemClick}
                  cursor="pointer"
                  label={(p) =>
                    renderColumnLabel(
                      p,
                      targetLabelFormat || labelFormat,
                      effectiveSelectedFY,
                      true
                    )
                  }
                >
                  {seriesData.map((entry, index) => {
                    const isSelected = effectiveSelectedFY === entry.fy;
                    const opacity =
                      !effectiveSelectedFY || isSelected ? 1 : 0.35;
                    return <Cell key={`tgt-${index}`} fill={TARGET_COLOR} opacity={opacity} />;
                  })}
                </Bar>
              )}
              <Bar
                dataKey="actual"
                fill={ACTUAL_COLOR}
                radius={[3, 3, 0, 0]}
                barSize={10}
                onClick={handleItemClick}
                cursor="pointer"
                label={(p) => renderColumnLabel(p, labelFormat, effectiveSelectedFY, false)}
              >
                {seriesData.map((entry, index) => {
                  const isSelected = effectiveSelectedFY === entry.fy;
                  const opacity =
                    !effectiveSelectedFY || isSelected ? 1 : 0.35;
                  return <Cell key={`act-${index}`} fill={ACTUAL_COLOR} opacity={opacity} />;
                })}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
