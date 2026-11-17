import React, { useMemo } from 'react';
import { useDahStore } from '../context/DahStore';
import { computeOverviewKpis } from '../utils/aggregations';
import { CHART_REGISTRY } from '../utils/chartRegistry';
import GenericChartPanel from '../components/charts/GenericChartPanel';
import { formatIndian } from '../utils/formatters';

export default function OverviewPage() {
  const { datasets } = useDahStore();

  const kpis = useMemo(() => {
    return computeOverviewKpis(datasets);
  }, [datasets]);

  // Find the 6 overview charts from registry
  const overviewCharts = useMemo(() => {
    return CHART_REGISTRY.filter((c) => c.page === 'overview');
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 6, minHeight: 0 }}>
      {/* Row 1 — 4 KPI Cards */}
      <section className="dah-kpi-grid">
        {/* Card 1: AI cattle */}
        <div className="dah-kpi-card dah-kpi-card--teal">
          <div className="dah-kpi-card__header">
            Artificial Insemination performed in cattle across {kpis.ai.districtsCount} districts for Higher Milk Production
          </div>
          <div className="dah-kpi-card__main-row">
            <span className="dah-kpi-card__value dah-kpi-card__value--teal">
              {kpis.ai.value}
            </span>
            <span className="dah-kpi-card__unit">Lakh</span>
          </div>
          <div className="dah-kpi-card__subtitle">{kpis.ai.subtitle}</div>
        </div>

        {/* Card 2: Seed Minikits */}
        <div className="dah-kpi-card dah-kpi-card--blue">
          <div className="dah-kpi-card__header">
            Improved variety of fodder Seed Minikits distributed to livestock owners to Enhance Fodder Production
          </div>
          <div className="dah-kpi-card__main-row">
            <span className="dah-kpi-card__value dah-kpi-card__value--blue">
              {kpis.minikits.value.toFixed(2)}
            </span>
            <span className="dah-kpi-card__unit">Lakh</span>
          </div>
          <div className="dah-kpi-card__subtitle">{kpis.minikits.subtitle}</div>
        </div>

        {/* Card 3: KCC-AH */}
        <div className="dah-kpi-card dah-kpi-card--purple">
          <div className="dah-kpi-card__header">
            Livestock owners sanctioned for KCC-AH to facilitate access to formal credit sources
          </div>
          <div className="dah-kpi-card__main-row">
            <span className="dah-kpi-card__value dah-kpi-card__value--purple">
              {kpis.kcc.value.toFixed(2)}
            </span>
            <span className="dah-kpi-card__unit">Lakh</span>
          </div>
          <div className="dah-kpi-card__subtitle">{kpis.kcc.subtitle}</div>
        </div>

        {/* Card 4: Cages Installed */}
        <div className="dah-kpi-card dah-kpi-card--orange">
          <div className="dah-kpi-card__header">
            Cages installed across {kpis.cages.districtsCount} districts for Cage Fishing
          </div>
          <div className="dah-kpi-card__main-row">
            <span className="dah-kpi-card__value dah-kpi-card__value--orange">
              {formatIndian(kpis.cages.value)}
            </span>
            <span className="dah-kpi-card__unit">Cages</span>
          </div>
          <div className="dah-kpi-card__subtitle">{kpis.cages.subtitle}</div>
        </div>
      </section>

      {/* Row 2 — On Track KPIs panel with 3x2 grid of charts */}
      <section className="dah-section-panel">
        <div className="dah-section-panel__header">
          <div className="dah-section-panel__title">
            <span>On Track KPIs</span>
            <span className="dah-badge-pill">Overview Interventions</span>
          </div>
          <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 600 }}>
            Lifetime Roadmap &amp; Progress (2022-23 to 2029-30)
          </span>
        </div>

        <div className="dah-grid-3x2">
          {overviewCharts.map((cfg) => (
            <GenericChartPanel key={cfg.id} chartConfig={cfg} isOverview={true} />
          ))}
        </div>
      </section>
    </div>
  );
}
