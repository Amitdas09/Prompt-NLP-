
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProfile, MealLog, WeightLog } from './types';
import Dashboard from './views/Dashboard';
import Scanner from './views/Scanner';
import Coach from './views/Coach';
import Profile from './views/Profile';
import WeightTracker from './views/WeightTracker';
import MealHistory from './views/MealHistory';
import Onboarding from './views/Onboarding';
import Header from './components/Header';
import Navbar from './components/Navbar';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [wasLoggedOut, setWasLoggedOut] = useState(false);

  useEffect(() => {
    // Listen for Auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setLogs([]);
        setWeightLogs([]);
        localStorage.removeItem('nuvision_profile');
        localStorage.removeItem('nuvision_logs');
        localStorage.removeItem('nuvision_weight_logs');
        setWasLoggedOut(true);
      } else if (newUser) {
        fetchSupabaseData(newUser.id);
        setWasLoggedOut(false);
      } else if (event === 'INITIAL_SESSION' && !session) {
        loadLocalData();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (logs.length > 0) {
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const filteredLogs = logs.filter(log => log.timestamp >= oneWeekAgo);
      if (filteredLogs.length !== logs.length) {
        setLogs(filteredLogs);
        localStorage.setItem('nuvision_logs', JSON.stringify(filteredLogs));
      }
    }
  }, [logs]);

  const loadLocalData = () => {
    const savedProfile = localStorage.getItem('nuvision_profile');
    const savedLogs = localStorage.getItem('nuvision_logs');
    const savedWeightLogs = localStorage.getItem('nuvision_weight_logs');
    const savedTheme = localStorage.getItem('nuvision_theme') as 'light' | 'dark';
    
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    }
    if (savedWeightLogs) {
      setWeightLogs(JSON.parse(savedWeightLogs));
    }
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
    setIsLoading(false);
  };

  const fetchSupabaseData = async (userId: string) => {
    setIsLoading(true);
    try {
      // Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileData) {
        setProfile(profileData.data);
      } else if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      }

      // Fetch Logs
      const { data: logsData, error: logsError } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      let cloudLogs: MealLog[] = [];
      if (logsData) {
        cloudLogs = logsData.map((l: any) => l.data);
      } else if (logsError) {
        console.error('Error fetching logs:', logsError);
      }

      // Fetch Weight Logs
      const { data: weightData, error: weightError } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      let cloudWeightLogs: WeightLog[] = [];
      if (weightData) {
        cloudWeightLogs = weightData.map((l: any) => l.data);
      } else if (weightError) {
        console.error('Error fetching weight logs:', weightError);
      }

      // Sync local data to cloud if cloud is empty but local has data
      const localLogsStr = localStorage.getItem('nuvision_logs');
      const localLogs: MealLog[] = localLogsStr ? JSON.parse(localLogsStr) : [];
      
      if (cloudLogs.length === 0 && localLogs.length > 0) {
        // Only sync if we didn't get an error fetching cloud logs
        if (!logsError) {
          for (const log of localLogs) {
            await supabase.from('meal_logs').upsert({
              user_id: userId,
              id: log.id,
              timestamp: log.timestamp,
              data: log,
            });
          }
          setLogs(localLogs);
        } else {
          setLogs(localLogs); // Fallback to local if cloud fetch failed
        }
      } else {
        setLogs(cloudLogs);
      }

      const localWeightStr = localStorage.getItem('nuvision_weight_logs');
      const localWeight: WeightLog[] = localWeightStr ? JSON.parse(localWeightStr) : [];

      if (cloudWeightLogs.length === 0 && localWeight.length > 0) {
        if (!weightError) {
          for (const log of localWeight) {
            await supabase.from('weight_logs').upsert({
              user_id: userId,
              id: log.id,
              timestamp: log.timestamp,
              data: log,
            });
          }
          setWeightLogs(localWeight);
        } else {
          setWeightLogs(localWeight);
        }
      } else {
        setWeightLogs(cloudWeightLogs);
      }

    } catch (err) {
      console.error('Error in fetchSupabaseData:', err);
      loadLocalData();
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('nuvision_theme', newTheme);
  };

  const saveProfile = async (newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem('nuvision_profile', JSON.stringify(newProfile));

    if (user) {
      const { error } = await supabase.from('profiles').upsert({
        user_id: user.id,
        data: newProfile,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      
      if (error) {
        console.error('Error saving profile to Supabase:', error);
      }
    }
  };

  const addLog = async (newLog: MealLog) => {
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem('nuvision_logs', JSON.stringify(updatedLogs));

    // Use getUser() directly to ensure we have the most up-to-date auth state
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (currentUser) {
      try {
        const { error } = await supabase.from('meal_logs').upsert({
          user_id: currentUser.id,
          id: newLog.id,
          timestamp: newLog.timestamp,
          data: newLog,
        });
        
        if (error) {
          console.error('Error saving log to Supabase:', error);
          // Fallback to simple insert if upsert fails
          await supabase.from('meal_logs').insert({
            user_id: currentUser.id,
            id: newLog.id,
            timestamp: newLog.timestamp,
            data: newLog,
          });
        }
      } catch (err) {
        console.error('Failed to save log to cloud:', err);
      }
    }
  };

  const deleteLog = async (id: string) => {
    const updatedLogs = logs.filter(log => log.id !== id);
    setLogs(updatedLogs);
    localStorage.setItem('nuvision_logs', JSON.stringify(updatedLogs));

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      const { error } = await supabase.from('meal_logs').delete().eq('id', id).eq('user_id', currentUser.id);
      if (error) {
        console.error('Error deleting log from Supabase:', error);
      }
    }
  };

  const addWeightLog = async (newLog: WeightLog) => {
    const updatedLogs = [newLog, ...weightLogs].sort((a, b) => b.timestamp - a.timestamp);
    setWeightLogs(updatedLogs);
    localStorage.setItem('nuvision_weight_logs', JSON.stringify(updatedLogs));

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      try {
        const { error } = await supabase.from('weight_logs').upsert({
          user_id: currentUser.id,
          id: newLog.id,
          timestamp: newLog.timestamp,
          data: newLog,
        });
        
        if (error) {
          console.error('Error saving weight log to Supabase:', error);
        }
      } catch (err) {
        console.error('Failed to save weight log:', err);
      }
    }
  };

  const deleteWeightLog = async (id: string) => {
    const updatedLogs = weightLogs.filter(log => log.id !== id);
    setWeightLogs(updatedLogs);
    localStorage.setItem('nuvision_weight_logs', JSON.stringify(updatedLogs));

    if (user) {
      const { error } = await supabase.from('weight_logs').delete().eq('id', id).eq('user_id', user.id);
      if (error) {
        console.error('Error deleting weight log from Supabase:', error);
      }
    }
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
        {profile && <Header theme={theme} onToggleTheme={toggleTheme} user={user} />}
        <main className={`flex-1 container mx-auto px-4 max-w-2xl ${profile ? 'py-6' : 'py-0'}`}>
          <Routes>
            {!profile ? (
              <Route path="*" element={<Onboarding onComplete={saveProfile} theme={theme} initialLoginMode={wasLoggedOut} user={user} />} />
            ) : (
              <>
                <Route path="/" element={<Dashboard profile={profile} logs={logs} onDeleteLog={deleteLog} theme={theme} />} />
                <Route path="/scanner" element={<Scanner profile={profile} logs={logs} onLog={addLog} theme={theme} />} />
                <Route path="/history" element={<MealHistory profile={profile} logs={logs} theme={theme} />} />
                <Route path="/weight" element={<WeightTracker profile={profile} weightLogs={weightLogs} onAddLog={addWeightLog} onDeleteLog={deleteWeightLog} theme={theme} />} />
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
