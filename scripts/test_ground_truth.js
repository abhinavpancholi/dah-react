/**
 * Ground-Truth Assertion Suite
 * Validates the pipeline output from aggregations.js against the prompt's ground truth table.
 * Run: node scripts/test_ground_truth.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CHART_REGISTRY } from '../src/utils/chartRegistry.js';
import { computeChartSeries, computeOverviewKpis } from '../src/utils/aggregations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../public/data');

function loadJson(sheetCode) {
  const p = path.join(DATA_DIR, `${sheetCode}.json`);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${testName}: ${details}`);
  }
}

function approxEqual(a, b, tol = 0.05) {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return Math.abs(a - b) <= tol;
}

console.log('--- RUNNING DAH GROUND-TRUTH ASSERTIONS ---\n');

// 1. Overview KPI Cards
console.log('1. OVERVIEW KPI CARDS:');
const datasets = {
  'AIRD-06': loadJson('AIRD-06'),
  'AIRD-81': loadJson('AIRD-81'),
  'AIRD-63': loadJson('AIRD-63'),
  'AIRD-10': loadJson('AIRD-10'),
};
const kpis = computeOverviewKpis(datasets);

assert(
  approxEqual(kpis.ai.exactValue, 194.64, 0.1) && kpis.ai.districtsCount === 8,
  'AIRD-06 AI Cattle KPI',
  `Expected ~194.64 / 8 districts, got ${kpis.ai.exactValue?.toFixed(2)} / ${kpis.ai.districtsCount}`
);
assert(
  approxEqual(kpis.minikits.exactValue, 3.74, 0.05),
  'AIRD-81 Minikits KPI',
  `Expected 3.74, got ${kpis.minikits.exactValue}`
);
assert(
  approxEqual(kpis.kcc.exactValue, 3.81, 0.05),
  'AIRD-63 KCC KPI',
  `Expected 3.81, got ${kpis.kcc.exactValue}`
);
assert(
  kpis.cages.exactValue === 15033 && kpis.cages.districtsCount === 6,
  'AIRD-10 Cages KPI',
  `Expected 15033 / 6 districts, got ${kpis.cages.exactValue} / ${kpis.cages.districtsCount}`
);

// Land Lease Status check
import { computeLandLeaseStatus } from '../src/utils/aggregations.js';
const llData = loadJson('AIRD-23_1');
const llStatus = computeLandLeaseStatus(llData, null);
assert(
  llStatus.length === 3 && llStatus.every((m) => m.status === 'No'),
  'AIRD-23_1 Land Lease Status Table',
  `Expected 3 milestones all with status 'No', got ${JSON.stringify(llStatus)}`
);

// 2. Ground Truth Chart Series
console.log('\n2. CHART SERIES GROUND-TRUTH:');

function testChart(chartId, expectedTargets, expectedActuals) {
  const cfg = CHART_REGISTRY.find((c) => c.id === chartId);
  if (!cfg) {
    assert(false, `Chart config ${chartId} exists`);
    return;
  }
  const rawData = loadJson(cfg.sheetCode);
  const series = computeChartSeries(cfg, rawData);

  // Compare targets
  let targetMatch = true;
  let targetMismatchDetail = '';
  if (expectedTargets) {
    if (series.length !== expectedTargets.length) {
      targetMatch = false;
      targetMismatchDetail = `Length mismatch: expected ${expectedTargets.length}, got ${series.length}`;
    } else {
      for (let i = 0; i < expectedTargets.length; i++) {
        const exp = expectedTargets[i];
        const act = series[i].target;
        if (!approxEqual(act, exp, 0.05)) {
          targetMatch = false;
          targetMismatchDetail = `At idx ${i} (${series[i].fy}): expected ${exp}, got ${act}`;
          break;
        }
      }
    }
  }

  // Compare actuals
  let actualMatch = true;
  let actualMismatchDetail = '';
  if (expectedActuals) {
    if (series.length !== expectedActuals.length) {
      actualMatch = false;
      actualMismatchDetail = `Length mismatch: expected ${expectedActuals.length}, got ${series.length}`;
    } else {
      for (let i = 0; i < expectedActuals.length; i++) {
        const exp = expectedActuals[i];
        const act = series[i].actual;
        if (!approxEqual(act, exp, 0.05)) {
          actualMatch = false;
          actualMismatchDetail = `At idx ${i} (${series[i].fy}): expected ${exp}, got ${act}`;
          break;
        }
      }
    }
  }

  assert(
    targetMatch && actualMatch,
    `${cfg.title} (${cfg.sheetCode})`,
    `${targetMismatchDetail} ${actualMismatchDetail}`
  );
}

// AIRD-06 AI (YoY, not cum)
// Target: 42.00, 43.00, 45.00, 47.00, 47.25, 48.00, 48.50, 49.25
// Actual: 48.63, 48.55, 46.50, 50.97, null, null, null, null
testChart(
  'overview-aird06-ai',
  [42.0, 43.0, 45.0, 47.0, 47.25, 48.0, 48.5, 49.25],
  [48.63, 48.55, 46.5, 50.97, null, null, null, null]
);

// AIRD-07 Dairy 12 milch (cum): T 800,1650,2550,3475,4425,5400,6400,7450 | A 793,1908,2852,2995
testChart(
  'ah-aird07-dairy12',
  [800, 1650, 2550, 3475, 4425, 5400, 6400, 7450],
  [793, 1908, 2852, 2995, null, null, null, null]
);

// AIRD-07 Dairy 25-50 milch (cum): T 10,20,30,45,65,90,115,145 | A 5,13,17,17
testChart(
  'ah-aird07-dairy50',
  [10, 20, 30, 45, 65, 90, 115, 145],
  [5, 13, 17, 17, null, null, null, null]
);

// AIRD-08 Heifer Rearing (cum, starts 2026-27): T 1,3,4,5 | A none
testChart('ah-aird08-heifer', [1, 3, 4, 5], [null, null, null, null]);

// AIRD-09 Brackish water Ha (not cum, starts 2025-26): T 25000,50000,59750,69500,79250 | A 0
testChart(
  'f1-aird09-brackish',
  [25000, 50000, 59750, 69500, 79250],
  [0, null, null, null, null]
);

// AIRD-10 Cages for fishing (cum): T 4309,7050,12453,13953,15453,17453,19453,20953 | A 3970,4546,9949,15033
testChart(
  'overview-aird10-cages',
  [4309, 7050, 12453, 13953, 15453, 17453, 19453, 20953],
  [3970, 4546, 9949, 15033, null, null, null, null]
);

// AIRD-11 Bio Floc Units (cum): T 8,10,12,22,32,47,62,77 | A 8,10,12,12
testChart(
  'f1-aird11-biofloc',
  [8, 10, 12, 22, 32, 47, 62, 77],
  [8, 10, 12, 12, null, null, null, null]
);

// AIRD-11 Hatcheries (cum): T 1,1,1,2,3,4,4,5 | A 1,1,1,2
testChart(
  'overview-aird11-hatcheries',
  [1, 1, 1, 2, 3, 4, 4, 5],
  [1, 1, 1, 2, null, null, null, null]
);

// AIRD-15 Seed rearing area Ha (cum, from 2025-26): T 5,10,15,20,25 | A 0
testChart('f1-aird15-seed', [5, 10, 15, 20, 25], [0, null, null, null, null]);

// AIRD-17 Yearling (cum, from 2025-26): T 1000000,1200000,1400000,1650000,1850000 | A 0
testChart(
  'f1-aird17-yearling',
  [1000000, 1200000, 1400000, 1650000, 1850000],
  [0, null, null, null, null]
);

// AIRD-22 % Milk Procurement: T 46,47,48,50,52,54,56,58 | A 46.69, 45.90, 45.64, null...
testChart(
  'ah-aird22-procurement',
  [46, 47, 48, 50, 52, 54, 56, 58],
  [46.69, 45.9, 45.64, null, null, null, null, null]
);

// AIRD-22 % Milk Processing: T 71.20,71.30,71.40,71.55,71.65,71.75,71.85,71.90 | A 71.17, 71.32, 69.52, null...
testChart(
  'ah-aird22-processing',
  [71.2, 71.3, 71.4, 71.55, 71.65, 71.75, 71.85, 71.9],
  [71.17, 71.32, 69.52, null, null, null, null, null]
);

// AIRD-23_2 Fish Harbors (not cum, from 2024-25): T 2,5,5,6,8,16 | A 0,1
testChart('f2-aird23-harbors', [2, 5, 5, 6, 8, 16], [0, 1, null, null, null, null]);

// AIRD-23_3 Cold chain MT: 86800, 91000, 94500 (actual only)
testChart('f2-aird23-coldchain', null, [86800, 91000, 94500]);

// AIRD-24 Training (not cum): T 10,10,10,10 | A none
testChart('f1-aird24-training', [10, 10, 10, 10], [null, null, null, null]);

// AIRD-36 all 4 charts (cum, 2026-27..29-30)
testChart('f2-aird36-marine', [2, 3, 4, 6], [null, null, null, null]);
testChart('f2-aird36-diagnostic', [2, 4, 5, 7], [null, null, null, null]);
testChart('f2-aird36-research', [3, 5, 7, 10], [null, null, null, null]);
testChart('f2-aird36-conservation', [2, 3, 5, 7], [null, null, null, null]);

// AIRD-37_1 Super Intensive Aquaculture (not cum, from 2025-26): T 10,20,30,40,50 | A 4
testChart('f1-aird37-aquaculture', [10, 20, 30, 40, 50], [4, null, null, null, null]);

// AIRD-37_1 FMD Free Zone (cum, from 2028-29): T 1,2 | A none
testChart('ah-aird37-fmd', [1, 2], [null, null]);

// AIRD-37_2 GI Fish Seed Stocking (cum, from 2026-27): T 100000, 200000, 300000, 400000
testChart('f1-aird37-fishseed', [100000, 200000, 300000, 400000], [null, null, null, null]);

// AIRD-50 Markets (not cum, from 2025-26): T 1,3,5,8,12 | A 1
testChart('co-aird50-markets', [1, 3, 5, 8, 12], [1, null, null, null, null]);

// AIRD-50 Buyers e-NAM: T 10,25,40,55,80 | A 71
testChart('overview-aird50-buyers', [10, 25, 40, 55, 80], [71, null, null, null, null]);

// AIRD-50 APMCs: T 15,33,51,71,91 | A 11
testChart('co-aird50-apmc', [15, 33, 51, 71, 91], [11, null, null, null, null]);

// AIRD-50 Refrigerated Van: T 1,1,3,5,5 | A 0
testChart('co-aird50-van', [1, 1, 3, 5, 5], [0, null, null, null, null]);

// AIRD-51 Farmers price discovery: T 10000 (2025-26 only) | A null
testChart('co-aird51-price', [10000], [null]);

// AIRD-54 Broiler 1000 birds (cum, from 2024-25): T 30,105,185,270,365,465 | A 30,105
testChart(
  'overview-aird54-broiler',
  [30, 105, 185, 270, 365, 465],
  [30, 105, null, null, null, null]
);

// AIRD-54 Processing plants GNFSU (cum, from 2023-24): T 2,7,23,25,27,29,31 | A 2,7,9
testChart(
  'f2-aird54-gnfsu',
  [2, 7, 23, 25, 27, 29, 31],
  [2, 7, 9, null, null, null, null]
);

// AIRD-54 Units value added (cum, from 2023-24): T 3,5,13,15,19,23,27 | A 3,5,10
testChart(
  'f2-aird54-valueadded',
  [3, 5, 13, 15, 19, 23, 27],
  [3, 5, 10, null, null, null, null]
);

// AIRD-54 Fish market (cum, from 2023-24): T 1,2,3,4,5,6,7 | A 0,0,1
testChart(
  'f2-aird54-fishmarket',
  [1, 2, 3, 4, 5, 6, 7],
  [0, 0, 1, null, null, null, null]
);

// AIRD-55_1 Marketing yards: T 15,30,45,60,72 | A 11
testChart('co-aird55-yards', [15, 30, 45, 60, 72], [11, null, null, null, null]);

// AIRD-55_1 Training ONLINE: T 8,10,15,20,25 | A 8
testChart('co-aird55-online', [8, 10, 15, 20, 25], [8, null, null, null, null]);

// AIRD-55_1 Training OFFLINE: T 4,6,9,12,15 | A 1
testChart('co-aird55-offline', [4, 6, 9, 12, 15], [1, null, null, null, null]);

// AIRD-55_2 Farmers: T 1000 | A 103
testChart('co-aird55-farmers', [1000], [103]);

// AIRD-55_2 Traders: T 800,1800,3000,4800,6800 | A 71
testChart(
  'co-aird55-traders',
  [800, 1800, 3000, 4800, 6800],
  [71, null, null, null, null]
);

// AIRD-55_2 Value of trade (Rs Cr): T 2000,4200,6700,9500,12500 | A 1567
testChart(
  'co-aird55-trade',
  [2000, 4200, 6700, 9500, 12500],
  [1567.3, null, null, null, null]
);

// AIRD-63 KCC (cum): T 0.50,1.00,1.50,2.00,2.50,3.00,3.50,4.00 | A 0.70,1.15,2.23,3.81
testChart(
  'overview-aird63-kcc',
  [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0],
  [0.7, 1.15, 2.23, 3.81, null, null, null, null]
);

// AIRD-63 Interest subvention (Rs Cr, cum): T 115,230,345,460,575,690,805,920 | A 114.76, 244.81, 278.98
testChart(
  'ah-aird63-interest',
  [115, 230, 345, 460, 575, 690, 805, 920],
  [114.76, 244.81, 278.98, null, null, null, null, null]
);

// AIRD-81 Minikits (cum): T 0.76,1.56,2.37,4.08,4.94,5.79,6.65,7.50 | A 0.76,1.56,2.43,3.74
testChart(
  'ah-aird81-minikits',
  [0.76, 1.56, 2.37, 4.08, 4.94, 5.79, 6.65, 7.5],
  [0.76, 1.56, 2.43, 3.74, null, null, null, null]
);

// AIRD-93 Chaff cutters (cum): T 1940,3900,5790,9095,11945,14795,17645,20495 | A 1347,2992,4626,6176
testChart(
  'ah-aird93-chaff',
  [1940, 3900, 5790, 9095, 11945, 14795, 17645, 20495],
  [1347, 2992, 4626, 6176, null, null, null, null]
);

console.log(`\n========================================`);
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
