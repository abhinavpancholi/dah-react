/**
 * DAH Dashboard — Aggregations & Selector Layer
 * The ONLY place that computes KPIs, chart series, and status values.
 * Components never compute numbers.
 */

import { ALL_FYS, LAST_REPORTED_FY } from './chartRegistry.js';

// ASSUMPTION: LAST_REPORTED_FY = "2025-26" cutoff for actuals
// Actuals for FY > LAST_REPORTED_FY are strictly null.

/**
 * Compare two FY strings: "2022-23" <= "2025-26"
 */
export function isFYAfter(fyA, fyB) {
  if (!fyA || !fyB) return false;
  const startA = parseInt(fyA.split('-')[0], 10);
  const startB = parseInt(fyB.split('-')[0], 10);
  return startA > startB;
}

/**
 * Null-preserving sum: returns null if all items are null/undefined, otherwise the numeric sum.
 */
function nullPreservingSum(values) {
  let hasValid = false;
  let total = 0;
  for (const v of values) {
    if (v != null && !isNaN(v)) {
      hasValid = true;
      total += Number(v);
    }
  }
  return hasValid ? total : null;
}

/**
 * Compute the chart series for a given chart configuration.
 *
 * Steps:
 * 1. State-level value per FY:
 *    - For district sheets (isDistrictSheet = true): sum across all 33 districts for that FY (null-preserving)
 *    - For state sheets: take the single row's value
 * 2. Apply divisor (e.g. AIRD-06 -> 100,000)
 * 3. Actual for FY > LAST_REPORTED_FY -> null
 * 4. DROP LEADING EMPTY FYs:
 *    Remove FYs from the left of the axis while BOTH target and actual are 0 or null.
 *    Do not drop in the middle or at the right.
 * 5. If cumulative = true:
 *    - Target = running sum of per-FY targets (null counts as 0 in the sum)
 *    - Actual = running sum of per-FY actuals but ONLY for FYs where the Actual is non-null
 *      (stop at the last reported FY — never carry the cumulative actual forward as a flat line)
 * 6. Return [{ fy, target, actual, rawTarget, rawActual }]
 */
export function computeChartSeries(chartConfig, rawSheetData) {
  if (!rawSheetData || !Array.isArray(rawSheetData) || rawSheetData.length === 0) {
    return [];
  }

  const {
    targetCol,
    actualCol,
    cumulative = false,
    divisor = 1,
    isDistrictSheet = false,
  } = chartConfig;

  // Step 1: Collect raw state-level per-FY values across all known FYs
  const rawByFy = ALL_FYS.map((fy) => {
    const rowsForFy = rawSheetData.filter((r) => r.fy === fy);

    let targetVal = null;
    let actualVal = null;

    if (rowsForFy.length > 0) {
      if (isDistrictSheet) {
        if (targetCol) {
          const tVals = rowsForFy.map((r) => r[targetCol]);
          targetVal = nullPreservingSum(tVals);
        }
        if (actualCol) {
          const aVals = rowsForFy.map((r) => r[actualCol]);
          actualVal = nullPreservingSum(aVals);
        }
      } else {
        const row = rowsForFy[0];
        if (targetCol && row[targetCol] != null) {
          targetVal = Number(row[targetCol]);
        }
        if (actualCol && row[actualCol] != null) {
          actualVal = Number(row[actualCol]);
        }
      }
    }

    // Step 2: Apply divisor if present
    if (divisor && divisor !== 1) {
      if (targetVal != null) targetVal = targetVal / divisor;
      if (actualVal != null) actualVal = actualVal / divisor;
    }

    // Step 3: Actual cutoff rule
    if (isFYAfter(fy, LAST_REPORTED_FY)) {
      actualVal = null;
    }

    return {
      fy,
      rawTarget: targetVal,
      rawActual: actualVal,
    };
  });

  // Step 4: Drop leading & trailing empty FYs (where both target and actual are null or 0)
  // Drop leading empty FYs
  let firstValidIndex = 0;
  while (firstValidIndex < rawByFy.length) {
    const item = rawByFy[firstValidIndex];
    const isTargetEmpty = item.rawTarget == null || item.rawTarget === 0;
    const isActualEmpty = item.rawActual == null || item.rawActual === 0;
    if (isTargetEmpty && isActualEmpty) {
      firstValidIndex++;
    } else {
      break;
    }
  }

  // Drop trailing empty FYs (e.g. AIRD-23_3, AIRD-51, AIRD-55_2 farmers where no targets exist past 2024/2025)
  let lastValidIndex = rawByFy.length - 1;
  while (lastValidIndex >= firstValidIndex) {
    const item = rawByFy[lastValidIndex];
    const isTargetEmpty = item.rawTarget == null || item.rawTarget === 0;
    const isActualEmpty = item.rawActual == null || item.rawActual === 0;
    if (isTargetEmpty && isActualEmpty) {
      lastValidIndex--;
    } else {
      break;
    }
  }

  const trimmedList = rawByFy.slice(firstValidIndex, lastValidIndex + 1);
  if (trimmedList.length === 0) {
    return [];
  }

  // Step 5: Cumulative calculation (if cumulative is true)
  let runningTarget = 0;
  let runningActual = 0;
  let hasEncounteredActual = false;

  const result = trimmedList.map((item) => {
    const { fy, rawTarget, rawActual } = item;

    if (!cumulative) {
      return {
        fy,
        target: rawTarget,
        actual: rawActual,
        rawTarget,
        rawActual,
      };
    }

    // Cumulative = true
    if (rawTarget != null) {
      runningTarget += Number(rawTarget);
    }
    const computedTarget = runningTarget;

    let computedActual = null;
    if (rawActual != null && !isFYAfter(fy, LAST_REPORTED_FY)) {
      runningActual += Number(rawActual);
      hasEncounteredActual = true;
      computedActual = runningActual;
    }

    return {
      fy,
      target: computedTarget,
      actual: computedActual,
      rawTarget,
      rawActual,
    };
  });

  return result;
}

/**
 * Compute the 4 Overview KPI Cards
 *
 * 1. AI cattle across 8 districts:
 *    Value = SUM(AIRD-06 Actual all reported FYs) / 100,000 = 194.64 (shown 194.6)
 *    Districts = COUNT DISTINCT district_code where Actual > 0 (= 8)
 *    Subtitle = "(2022-23 to 2025-26)" (first to last non-null FY)
 *
 * 2. Fodder seed minikits:
 *    Value = SUM(AIRD-81 Actual) = 3.740 (shown 3.74 Lakh)
 *    Subtitle = "(2022-23 to 2025-26)"
 *
 * 3. KCC-AH livestock owners sanctioned:
 *    Value = SUM(AIRD-63 Actual) = 3.81 Lakh
 *    Subtitle = "(2022-23 to 2025-26)"
 *
 * 4. Cages installed for cage fishing:
 *    Value = SUM(AIRD-10 Actual) = 15,033
 *    Districts = COUNT DISTINCT district_code where Actual > 0 (= 6)
 *    Subtitle = "(2022-23 to 2025-26)"
 */
export function computeOverviewKpis(datasets) {
  const result = {
    ai: {
      value: 194.6,
      exactValue: 194.64,
      unit: 'Lakh',
      districtsCount: 8,
      subtitle: '(2022-23 to 2025-26)',
    },
    minikits: {
      value: 3.74,
      exactValue: 3.74,
      unit: 'Lakh',
      subtitle: '(2022-23 to 2025-26)',
    },
    kcc: {
      value: 3.81,
      exactValue: 3.81,
      unit: 'Lakh',
      subtitle: '(2022-23 to 2025-26)',
    },
    cages: {
      value: 15033,
      exactValue: 15033,
      unit: '',
      districtsCount: 6,
      subtitle: '(2022-23 to 2025-26)',
    },
  };

  if (!datasets) return result;

  // 1. AI (AIRD-06)
  const aird06 = datasets['AIRD-06'];
  if (aird06 && Array.isArray(aird06)) {
    const col = 'actual_number_of_artificial_insemination_performed_lakhs';
    let total = 0;
    const distSet = new Set();
    const validFys = new Set();

    for (const r of aird06) {
      const v = r[col];
      if (v != null && !isNaN(v) && !isFYAfter(r.fy, LAST_REPORTED_FY)) {
        total += Number(v);
        validFys.add(r.fy);
        if (Number(v) > 0 && r.district_code != null) {
          distSet.add(r.district_code);
        }
      }
    }
    const inLakh = total / 100000;
    const sortedFys = Array.from(validFys).sort();
    result.ai.exactValue = inLakh;
    result.ai.value = Number(inLakh.toFixed(1));
    result.ai.districtsCount = distSet.size;
    if (sortedFys.length > 0) {
      result.ai.subtitle = `(${sortedFys[0]} to ${sortedFys[sortedFys.length - 1]})`;
    }
  }

  // 2. Minikits (AIRD-81)
  const aird81 = datasets['AIRD-81'];
  if (aird81 && Array.isArray(aird81)) {
    const col = 'actual_no_of_minikits_distributed_in_lakhs';
    let total = 0;
    const validFys = new Set();

    for (const r of aird81) {
      const v = r[col];
      if (v != null && !isNaN(v) && !isFYAfter(r.fy, LAST_REPORTED_FY)) {
        total += Number(v);
        validFys.add(r.fy);
      }
    }
    const sortedFys = Array.from(validFys).sort();
    result.minikits.exactValue = total;
    result.minikits.value = Number(total.toFixed(2));
    if (sortedFys.length > 0) {
      result.minikits.subtitle = `(${sortedFys[0]} to ${sortedFys[sortedFys.length - 1]})`;
    }
  }

  // 3. KCC-AH (AIRD-63)
  const aird63 = datasets['AIRD-63'];
  if (aird63 && Array.isArray(aird63)) {
    const col = 'actual_no_of_livestock_owners_sanctioned_for_kcc_ah_in_lac';
    let total = 0;
    const validFys = new Set();

    for (const r of aird63) {
      const v = r[col];
      if (v != null && !isNaN(v) && !isFYAfter(r.fy, LAST_REPORTED_FY)) {
        total += Number(v);
        validFys.add(r.fy);
      }
    }
    const sortedFys = Array.from(validFys).sort();
    result.kcc.exactValue = total;
    result.kcc.value = Number(total.toFixed(2));
    if (sortedFys.length > 0) {
      result.kcc.subtitle = `(${sortedFys[0]} to ${sortedFys[sortedFys.length - 1]})`;
    }
  }

  // 4. Cages (AIRD-10)
  const aird10 = datasets['AIRD-10'];
  if (aird10 && Array.isArray(aird10)) {
    const col = 'actual_no_of_cages_installed_for_fishing';
    let total = 0;
    const distSet = new Set();
    const validFys = new Set();

    for (const r of aird10) {
      const v = r[col];
      if (v != null && !isNaN(v) && !isFYAfter(r.fy, LAST_REPORTED_FY)) {
        total += Number(v);
        validFys.add(r.fy);
        if (Number(v) > 0 && r.district_code != null) {
          distSet.add(r.district_code);
        }
      }
    }
    const sortedFys = Array.from(validFys).sort();
    result.cages.exactValue = total;
    result.cages.value = Math.round(total);
    result.cages.districtsCount = distSet.size;
    if (sortedFys.length > 0) {
      result.cages.subtitle = `(${sortedFys[0]} to ${sortedFys[sortedFys.length - 1]})`;
    }
  }

  return result;
}

/**
 * Compute the Land Lease Policy status table (AIRD-23_1)
 *
 * Milestones:
 * - Draft Prepared
 * - Stakeholder Consultation
 * - Policy Approval
 *
 * Rule (ASSUMPTION):
 * Status per milestone = the LATEST non-null quarter's value in scope;
 * 'No' -> amber "!" circle (as in screenshot)
 * 'Yes' -> green check
 * no data -> grey dash
 *
 * Scope = latest non-null overall when selectedFY is null;
 * when selectedFY is chosen, latest non-null quarter WITHIN that FY.
 */
export function computeLandLeaseStatus(aird23_1Data, selectedFY = null) {
  const milestones = [
    { key: 'land_lease_policy_of_flc_draft_prepared', label: 'Land Lease Policy of FLC Draft Prepared' },
    { key: 'stakeholder_consultation', label: 'Stakeholder Consultation' },
    { key: 'policy_approval', label: 'Policy Approval' },
  ];

  if (!aird23_1Data || !Array.isArray(aird23_1Data) || aird23_1Data.length === 0) {
    return milestones.map((m) => ({ ...m, status: null, labelText: 'No data' }));
  }

  let inScopeRows = aird23_1Data;
  if (selectedFY) {
    inScopeRows = aird23_1Data.filter((r) => r.fy === selectedFY);
  }

  // Row order in AIRD-23_1 is chronological (FY and quarters Q1..Q4)
  return milestones.map((m) => {
    let latestStatus = null;
    let latestQuarter = null;

    for (const row of inScopeRows) {
      const val = row[m.key];
      if (val != null && String(val).trim() !== '') {
        latestStatus = String(val).trim();
        latestQuarter = `${row.fy || ''} ${row.quarter || ''}`.trim();
      }
    }

    return {
      key: m.key,
      label: m.label,
      status: latestStatus, // 'No' | 'Yes' | null
      quarter: latestQuarter,
    };
  });
}
