import React from 'react';
import { Layers } from 'lucide-react';

/**
 * Summary Page
 * ASSUMPTION: There is NO screenshot and NO data spec for "Summary".
 * Render a WCD-style empty-state card "Summary page — design pending" without inventing content.
 */
export default function SummaryPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
      <div className="dah-empty-state">
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'rgba(56, 189, 248, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0284c7',
          }}
        >
          <Layers size={24} />
        </div>
        <h2 className="dah-empty-state__title">Summary Page — Design Pending</h2>
        <p className="dah-empty-state__text">
          // ASSUMPTION: The department source workbook and Power BI design specification did not include
          a mockup or KPI schema for the Summary route. This placeholder preserves the route and sidebar
          navigation entry for future department deployment.
        </p>
      </div>
    </div>
  );
}
