import React, { useMemo } from 'react';
import { CHART_REGISTRY } from '../utils/chartRegistry';
import GenericChartPanel from '../components/charts/GenericChartPanel';
import { useDahStore } from '../context/DahStore';

export default function CoOperativesPage() {
  const { selectedFY } = useDahStore();

  const charts = useMemo(() => {
    return CHART_REGISTRY.filter((c) => c.page === 'co-operatives');
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
            <span>Co-Operatives &amp; Agricultural Marketing</span>
            {selectedFY && (
              <span className="dah-badge-pill">Highlighting FY {selectedFY}</span>
            )}
          </div>
          <span style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: 600 }}>
            e-NAM Integration, APMCs, Logistics, Traders &amp; Farmers Enablement
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 6 }}>
          {/* Row 1 (4 across: Markets, Refrigerated Van, Offline Camp, Online Camp) */}
          <div className="dah-grid-co-r1">
            {chartMap['co-aird50-markets'] && (
              <GenericChartPanel chartConfig={chartMap['co-aird50-markets']} />
            )}
            {chartMap['co-aird50-van'] && (
              <GenericChartPanel chartConfig={chartMap['co-aird50-van']} />
            )}
            {chartMap['co-aird55-offline'] && (
              <GenericChartPanel chartConfig={chartMap['co-aird55-offline']} />
            )}
            {chartMap['co-aird55-online'] && (
              <GenericChartPanel chartConfig={chartMap['co-aird55-online']} />
            )}
          </div>

          {/* Row 2 (Farmers Registered - wide, Traders Registered, Value of Trade) */}
          <div className="dah-grid-co-r2">
            {chartMap['co-aird55-farmers'] && (
              <GenericChartPanel chartConfig={chartMap['co-aird55-farmers']} />
            )}
            {chartMap['co-aird55-traders'] && (
              <GenericChartPanel chartConfig={chartMap['co-aird55-traders']} />
            )}
            {chartMap['co-aird55-trade'] && (
              <GenericChartPanel chartConfig={chartMap['co-aird55-trade']} />
            )}
          </div>

          {/* Row 3 (APMCs, Farmers Price Discovery, Marketing Yards - wide) */}
          <div className="dah-grid-co-r3">
            {chartMap['co-aird50-apmc'] && (
              <GenericChartPanel chartConfig={chartMap['co-aird50-apmc']} />
            )}
            {chartMap['co-aird51-price'] && (
              <GenericChartPanel chartConfig={chartMap['co-aird51-price']} />
            )}
            {chartMap['co-aird55-yards'] && (
              <GenericChartPanel chartConfig={chartMap['co-aird55-yards']} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
