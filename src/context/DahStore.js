/**
 * DAH Dashboard — Zustand Global Store
 * Holds selectedFY (null | "2025-26" etc.) and cached datasets.
 *
 * ASSUMPTION: FY slicer is highlight-not-filter and shared across pages 2–5; Overview ignores it.
 * Clicking a selected FY again clears it (toggle-click).
 */

import { create } from 'zustand';

const ALL_SHEET_CODES = [
  'AIRD-06', 'AIRD-07', 'AIRD-08', 'AIRD-09', 'AIRD-10', 'AIRD-11',
  'AIRD-15', 'AIRD-17', 'AIRD-22', 'AIRD-23_1', 'AIRD-23_2', 'AIRD-23_3',
  'AIRD-24', 'AIRD-36', 'AIRD-37_1', 'AIRD-37_2', 'AIRD-50', 'AIRD-51',
  'AIRD-54', 'AIRD-55_1', 'AIRD-55_2', 'AIRD-63', 'AIRD-71', 'AIRD-81', 'AIRD-93',
];

export const useDahStore = create((set, get) => ({
  selectedFY: null,
  datasets: {},
  isLoading: false,
  isLoaded: false,
  error: null,

  setFY: (fy) => {
    const current = get().selectedFY;
    // Toggle-click: clicking active FY again clears it
    set({ selectedFY: current === fy ? null : fy });
  },

  clearFilters: () => {
    set({ selectedFY: null });
  },

  loadAllData: async () => {
    if (get().isLoaded || get().isLoading) return;
    set({ isLoading: true, error: null });

    try {
      const results = {};
      await Promise.all(
        ALL_SHEET_CODES.map(async (code) => {
          try {
            const resp = await fetch(`/data/${code}.json`);
            if (resp.ok) {
              const data = await resp.json();
              results[code] = data;
            } else {
              results[code] = [];
            }
          } catch (err) {
            console.warn(`Failed to fetch ${code}.json`, err);
            results[code] = [];
          }
        })
      );

      set({ datasets: results, isLoaded: true, isLoading: false });
    } catch (err) {
      console.error('Error loading datasets:', err);
      set({ error: err.message, isLoading: false });
    }
  },
}));

export default useDahStore;
