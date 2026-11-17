import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import OverviewPage from './pages/OverviewPage';
import AnimalHusbandryPage from './pages/AnimalHusbandryPage';
import Fisheries1Page from './pages/Fisheries1Page';
import Fisheries2Page from './pages/Fisheries2Page';
import CoOperativesPage from './pages/CoOperativesPage';
import SummaryPage from './pages/SummaryPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="overview" element={<Navigate to="/" replace />} />
          <Route path="summary" element={<SummaryPage />} />
          <Route path="animal-husbandry" element={<AnimalHusbandryPage />} />
          <Route path="fisheries-1" element={<Fisheries1Page />} />
          <Route path="fisheries-2" element={<Fisheries2Page />} />
          <Route path="co-operatives" element={<CoOperativesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
