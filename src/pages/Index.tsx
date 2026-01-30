import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { PinEntry } from '@/components/PinEntry';
import { HomeScreen } from '@/components/HomeScreen';
import { StatsScreen } from '@/components/StatsScreen';
import { BottomNav } from '@/components/BottomNav';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'stats'>('home');
  const [isDark, setIsDark] = useState(false);

  // Initialize theme
  useEffect(() => {
    const stored = localStorage.getItem('chitti_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = stored ? stored === 'dark' : prefersDark;
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
  }, []);

  const handleThemeToggle = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle('dark', newDark);
    localStorage.setItem('chitti_theme', newDark ? 'dark' : 'light');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show PIN entry
  if (!isAuthenticated) {
    return <PinEntry />;
  }

  // Authenticated - show main app
  return (
    <>
      {activeTab === 'home' ? (
        <HomeScreen isDark={isDark} onThemeToggle={handleThemeToggle} />
      ) : (
        <StatsScreen isDark={isDark} onThemeToggle={handleThemeToggle} />
      )}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </>
  );
}

const Index = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;
