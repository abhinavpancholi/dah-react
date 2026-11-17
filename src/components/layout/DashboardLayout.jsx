import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useDahStore } from '../../context/DahStore';

export default function DashboardLayout() {
  const { loadAllData, isLoaded, isLoading } = useDahStore();

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return (
    <div className="dah-layout">
      <Sidebar />
      <div className="dah-main">
        <Header />
        <main className="dah-content">
          {isLoading && !isLoaded ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#64748b',
                fontSize: '0.85rem',
              }}
            >
              Loading DAH Dashboard data...
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
