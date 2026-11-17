import React, { useMemo } from 'react';
import { CHART_REGISTRY } from '../utils/chartRegistry';
import GenericChartPanel from '../components/charts/GenericChartPanel';
import { useDahStore } from '../context/DahStore';

export default function AnimalHusbandryPage() {
  const { selectedFY } = useDahStore();

  const charts = useMemo(() => {
    return CHART_REGISTRY.filter((c) => c.page === 'animal-husbandry');
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 6, minHeight: 0 }}>
      <div className="dah-section-panel">
        <div className="dah-section-panel__header">
          <div className="dah-section-panel__title">
            <span>Animal Husbandry Key Indicators</span>
            {selectedFY && (
              <span className="dah-badge-pill">Highlighting FY {selectedFY}</span>
            )}
          </div>
          <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 600 }}>
            Dairy Development, Fodder, Health &amp; Subvention Schemes
          </span>
        </div>

        {/* 3x3 Grid */}
        <div className="dah-grid-3x3">
          {charts.map((cfg) => (
            <GenericChartPanel key={cfg.id} chartConfig={cfg} />
          ))}
        </div>
      </div>
    </div>
  );
}
