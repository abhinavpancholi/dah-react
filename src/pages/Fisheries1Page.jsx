import React, { useMemo } from 'react';
import { CHART_REGISTRY } from '../utils/chartRegistry';
import GenericChartPanel from '../components/charts/GenericChartPanel';
import { useDahStore } from '../context/DahStore';

export default function Fisheries1Page() {
  const { selectedFY } = useDahStore();

  const charts = useMemo(() => {
    return CHART_REGISTRY.filter((c) => c.page === 'fisheries-1');
  }, []);

  // Map charts by id for layout placement
  const chartMap = useMemo(() => {
    const map = {};
    charts.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [charts]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 6, minHeight: 0 }}>
      <div className="dah-section-panel">
        <div className="dah-section-panel__header">
          <div className="dah-section-panel__title">
            <span>Fisheries Page 1 — Aquaculture, Land &amp; Seed Production</span>
            {selectedFY && (
              <span className="dah-badge-pill">Highlighting FY {selectedFY}</span>
            )}
          </div>
          <span style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: 600 }}>
            Inland Aquaculture, Saline Land, Biofloc &amp; Capacity Building
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 6 }}>
          {/* Row 1 (2 wide) */}
          <div className="dah-grid-f1-r1">
            {chartMap['f1-aird09-brackish'] && (
              <GenericChartPanel chartConfig={chartMap['f1-aird09-brackish']} />
            )}
            {chartMap['f1-aird15-seed'] && (
              <GenericChartPanel chartConfig={chartMap['f1-aird15-seed']} />
            )}
          </div>

          {/* Row 2 (2 wide) */}
          <div className="dah-grid-f1-r2">
            {chartMap['f1-aird11-biofloc'] && (
              <GenericChartPanel chartConfig={chartMap['f1-aird11-biofloc']} />
            )}
            {chartMap['f1-aird17-yearling'] && (
              <GenericChartPanel chartConfig={chartMap['f1-aird17-yearling']} />
            )}
          </div>

          {/* Row 3 (3 wide) */}
          <div className="dah-grid-f1-r3">
            {chartMap['f1-aird24-training'] && (
              <GenericChartPanel chartConfig={chartMap['f1-aird24-training']} />
            )}
            {chartMap['f1-aird37-aquaculture'] && (
              <GenericChartPanel chartConfig={chartMap['f1-aird37-aquaculture']} />
            )}
            {chartMap['f1-aird37-fishseed'] && (
              <GenericChartPanel chartConfig={chartMap['f1-aird37-fishseed']} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
