import React from 'react';
import { NavLink } from 'react-router-dom';
import { Target, BarChart3, ListChecks } from 'lucide-react';
import { useDahStore } from '../../context/DahStore';
import { ALL_FYS, NAV_ITEMS, SIDEBAR_COUNTERS } from '../../utils/chartRegistry';

function FyGrid() {
  const { selectedFY, setFY } = useDahStore();

  return (
    <div className="labor-fy-grid">
      {ALL_FYS.map((fy) => (
        <button
          key={fy}
          className={`labor-fy-btn ${selectedFY === fy ? 'labor-fy-btn--active' : ''}`}
          onClick={() => setFY(fy)}
        >
          {fy}
        </button>
      ))}
    </div>
  );
}

function StatCards() {
  return (
    <div className="labor-stat-cards">
      <div className="labor-stat-card labor-stat-card--teal">
        <div className="labor-stat-card__icon labor-stat-card__icon--teal">
          <Target size={16} />
        </div>
        <div>
          <div className="labor-stat-card__label">Interventions</div>
          <div className="labor-stat-card__value">{SIDEBAR_COUNTERS.interventions}</div>
        </div>
      </div>

      <div className="labor-stat-card labor-stat-card--blue">
        <div className="labor-stat-card__icon labor-stat-card__icon--blue">
          <ListChecks size={16} />
        </div>
        <div>
          <div className="labor-stat-card__label">Actionable Steps</div>
          <div className="labor-stat-card__value">{SIDEBAR_COUNTERS.actionableSteps}</div>
        </div>
      </div>

      <div className="labor-stat-card labor-stat-card--purple">
        <div className="labor-stat-card__icon labor-stat-card__icon--purple">
          <BarChart3 size={16} />
        </div>
        <div>
          <div className="labor-stat-card__label">KPIs</div>
          <div className="labor-stat-card__value">{SIDEBAR_COUNTERS.kpis}</div>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="labor-sidebar dah-sidebar">
      <div className="labor-sidebar__top">
        <FyGrid />
        <StatCards />
      </div>

      <nav className="labor-sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `labor-nav-item ${isActive ? 'labor-nav-item--active' : ''}`
            }
          >
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom — Footer info */}
      <div className="labor-sidebar__bottom tdd-sidebar__bottom">
        <div className="labor-sidebar-footer tdd-sidebar-footer">
          <div className="labor-sidebar-footer__text tdd-sidebar-footer__text">
            The data and references shown are dummy and representative in nature, intended solely for demonstration purposes.
          </div>
        </div>
      </div>
    </aside>
  );
}
