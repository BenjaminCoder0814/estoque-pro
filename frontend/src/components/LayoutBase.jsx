import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function LayoutBase({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background relative">
      {/* ===== RIBBON BETA ===== */}
      <div
        className="fixed top-0 right-0 z-[9999] select-none overflow-hidden"
        style={{ width: 130, height: 130, pointerEvents: 'none' }}
      >
        <div
          style={{
            position: 'absolute',
            top: 28,
            right: -36,
            width: 160,
            textAlign: 'center',
            transform: 'rotate(45deg)',
            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.18em',
            padding: '5px 0',
            boxShadow: '0 2px 12px 0 rgba(239,68,68,0.45)',
            textTransform: 'uppercase',
          }}
        >
          BETA
        </div>
      </div>

      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Topbar />
        <main className="flex-1 p-6 md:p-8 bg-background overflow-y-auto animate-fadein">
          {children}
        </main>
      </div>
    </div>
  );
}
