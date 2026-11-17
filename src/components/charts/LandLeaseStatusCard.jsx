import React, { useMemo } from 'react';
import { AlertCircle, CheckCircle2, Minus } from 'lucide-react';
import { useDahStore } from '../../context/DahStore';
import { computeLandLeaseStatus } from '../../utils/aggregations';

/**
 * Land Lease Policy Status Table (AIRD-23_1)
 *
 * ASSUMPTION:
 * Status per milestone = the latest non-null quarter's value in scope:
 * 'No' -> amber "!" circle
 * 'Yes' -> green check
 * no data -> grey dash
 * Scope = overall latest when no FY selected; when FY selected, latest within that FY.
 */
export default function LandLeaseStatusCard() {
  const { datasets, selectedFY } = useDahStore();
  const rawData = datasets['AIRD-23_1'] || [];

  const milestones = useMemo(() => {
    return computeLandLeaseStatus(rawData, selectedFY);
  }, [rawData, selectedFY]);

  return (
    <div className="dah-chart-panel">
      <div className="dah-chart-panel__header">
        <div className="dah-chart-panel__title" title="Introduction of Land Lease Policy of FLC">
          Introduction of Land Lease Policy of FLC
        </div>
        <div className="dah-chart-panel__legend">
          <span style={{ fontSize: '0.60rem', color: '#64748b' }}>
            Quarterly Milestone {selectedFY ? `(${selectedFY})` : '(Overall Status)'}
          </span>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: 0,
          padding: '2px 0',
        }}
      >
        <div className="dah-status-grid">
          {milestones.map((m) => {
            const isNo = m.status === 'No';
            const isYes = m.status === 'Yes';
            const isNone = !m.status;

            return (
              <div key={m.key} className="dah-status-item">
                <div className="dah-status-item__label">{m.label}</div>
                <div>
                  {isNo && (
                    <div className="dah-status-badge dah-status-badge--amber" title="Status: No">
                      <AlertCircle size={15} />
                    </div>
                  )}
                  {isYes && (
                    <div className="dah-status-badge dah-status-badge--green" title="Status: Yes">
                      <CheckCircle2 size={15} />
                    </div>
                  )}
                  {isNone && (
                    <div className="dah-status-badge dah-status-badge--grey" title="No Data for selected period">
                      <Minus size={15} />
                    </div>
                  )}
                </div>
                <div className="dah-status-item__quarter">
                  {m.quarter ? m.quarter : 'No data'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
