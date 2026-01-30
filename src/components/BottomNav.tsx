import React from 'react';
import { Home, BarChart3 } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'home' | 'stats';
  onTabChange: (tab: 'home' | 'stats') => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-pb">
      <div className="flex justify-around items-center max-w-md mx-auto">
        <button
          onClick={() => onTabChange('home')}
          className={`nav-item flex-1 py-4 ${activeTab === 'home' ? 'active' : ''}`}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs font-medium">Home</span>
        </button>
        <button
          onClick={() => onTabChange('stats')}
          className={`nav-item flex-1 py-4 ${activeTab === 'stats' ? 'active' : ''}`}
        >
          <BarChart3 className="w-6 h-6" />
          <span className="text-xs font-medium">Stats</span>
        </button>
      </div>
    </nav>
  );
}
