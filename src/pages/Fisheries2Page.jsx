import React, { useMemo } from 'react';
import { CHART_REGISTRY } from '../utils/chartRegistry';
import GenericChartPanel from '../components/charts/GenericChartPanel';
import LandLeaseStatusCard from '../components/charts/LandLeaseStatusCard';
import { useDahStore } from '../context/DahStore';

export default function Fisheries2Page() {
  const { selectedFY } = useDahStore();

  const charts = useMemo(() => {
    return CHART_REGISTRY.filter((c) => c.page === 'fisheries-2');
  }, []);

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
            <span>Fisheries Page 2 — Harbors, Cold Chain, Labs &amp; Infrastructure</span>
            {selectedFY && (
              <span className="dah-badge-pill">Highlighting FY {selectedFY}</span>
            )}
          </div>
          <span style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: 600 }}>
            Policy Milestones, Landing Centers, Processing Units &amp; R&amp;D Centers
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 6 }}>
          {/* Row 1 (3 across: Land Lease Status Table, Fish Harbors, Cold Chain Infrastructure) */}
          <div className="dah-grid-f2-r1">
            <LandLeaseStatusCard />
            {chartMap['f2-aird23-harbors'] && (
              <GenericChartPanel chartConfig={chartMap['f2-aird23-harbors']} />
            )}
            {chartMap['f2-aird23-coldchain'] && (
              <GenericChartPanel chartConfig={chartMap['f2-aird23-coldchain']} />
            )}
          </div>

          {/* Row 2 (4 across: Value Added Machineries, Fish Market, GNFSU Plants, Marine Labs) */}
          <div className="dah-grid-f2-r2">
            {chartMap['f2-aird54-valueadded'] && (
              <GenericChartPanel chartConfig={chartMap['f2-aird54-valueadded']} />
            )}
            {chartMap['f2-aird54-fishmarket'] && (
              <GenericChartPanel chartConfig={chartMap['f2-aird54-fishmarket']} />
            )}
            {chartMap['f2-aird54-gnfsu'] && (
              <GenericChartPanel chartConfig={chartMap['f2-aird54-gnfsu']} />
            )}
            {chartMap['f2-aird36-marine'] && (
              <GenericChartPanel chartConfig={chartMap['f2-aird36-marine']} />
            )}
          </div>

          {/* Row 3 (3 across, first wider: Research Units, Conservation Centers, Diagnostic Labs) */}
          <div className="dah-grid-f2-r3">
            {chartMap['f2-aird36-research'] && (
              <GenericChartPanel chartConfig={chartMap['f2-aird36-research']} />
            )}
            {chartMap['f2-aird36-conservation'] && (
              <GenericChartPanel chartConfig={chartMap['f2-aird36-conservation']} />
            )}
            {chartMap['f2-aird36-diagnostic'] && (
              <GenericChartPanel chartConfig={chartMap['f2-aird36-diagnostic']} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
