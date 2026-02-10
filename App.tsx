
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProfile, MealLog } from './types';
import Dashboard from './views/Dashboard';
import Scanner from './views/Scanner';
import Coach from './views/Coach';
import Profile from './views/Profile';
import Onboarding from './views/Onboarding';
import Header from './components/Header';
import Navbar from './components/Navbar';

const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedProfile = localStorage.getItem('nuvision_profile');
    const savedLogs = localStorage.getItem('nuvision_logs');
    const savedTheme = localStorage.getItem('nuvision_theme') as 'light' | 'dark';
    
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    }
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
    setIsLoading(false);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('nuvision_theme', newTheme);
  };

  const saveProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem('nuvision_profile', JSON.stringify(newProfile));
  };

  const addLog = (newLog: MealLog) => {
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem('nuvision_logs', JSON.stringify(updatedLogs));
  };

  const deleteLog = (id: string) => {
    const updatedLogs = logs.filter(log => log.id !== id);
    setLogs(updatedLogs);
    localStorage.setItem('nuvision_logs', JSON.stringify(updatedLogs));
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className={`min-h-screen flex flex-col pb-20 md:pb-0 transition-colors duration-300 ${!profile ? 'bg-white' : (theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900')}`}>
        {profile && <Header theme={theme} onToggleTheme={toggleTheme} />}
        <main className={`flex-1 container mx-auto px-4 max-w-2xl ${profile ? 'py-6' : 'py-0'}`}>
          <Routes>
            {!profile ? (
              <Route path="*" element={<Onboarding onComplete={saveProfile} theme={theme} />} />
            ) : (
              <>
                <Route path="/" element={<Dashboard profile={profile} logs={logs} onDeleteLog={deleteLog} theme={theme} />} />
                <Route path="/scanner" element={<Scanner profile={profile} onLog={addLog} theme={theme} />} />
                <Route path="/coach" element={<Coach profile={profile} logs={logs} theme={theme} />} />
                <Route path="/profile" element={<Profile profile={profile} onUpdate={saveProfile} theme={theme} />} />
                <Route path="*" element={<Navigate to="/" />} />
              </>
            )}
          </Routes>
        </main>
        {profile && <Navbar theme={theme} />}
      </div>
    </Router>
  );
};

export default App;
