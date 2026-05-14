
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
import Milestones from './views/Milestones';
import Vaccinations from './views/Vaccinations';
import BabyHub from './views/BabyHub';
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
    if (!supabase) {
      loadLocalData();
      return;
    }

    // Listen for Auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      console.log('Supabase Auth Event:', event, session?.user?.email);
      const newUser = session?.user ?? null;
      
      if (event === 'SIGNED_OUT') {
        processSignOut();
      } else if (newUser) {
        setUser(newUser);
        setWasLoggedOut(false);
        fetchSupabaseData(newUser.id);
      } else if (event === 'INITIAL_SESSION' && !session) {
        setUser(null);
        loadLocalData();
      } else if (event === 'SIGNED_IN' && session) {
        // Double check signed in
        setUser(session.user);
        fetchSupabaseData(session.user.id);
      }
    });

    const processSignOut = () => {
      setUser(null);
      setProfile(null);
      setLogs([]);
      setWeightLogs([]);
      localStorage.removeItem('nuvision_profile');
      localStorage.removeItem('nuvision_logs');
      localStorage.removeItem('nuvision_weight_logs');
      setWasLoggedOut(true);
      setIsLoading(false);
    };

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const safeSetItem = (key: string, value: string, silent = false) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      if (!silent) console.warn(`LocalStorage error for ${key}:`, e);
      if (key === 'nuvision_logs') {
        localStorage.removeItem('nuvision_logs');
        try {
          localStorage.setItem(key, value);
          return true;
        } catch (e2) {
          return false;
        }
      }
      return false;
    }
  };

  const safeSaveLogs = (logsToSave: MealLog[]) => {
    // Aggressively prune images for LocalStorage.
    // We ONLY keep the most recent image if it's a data URL.
    // If it's a Supabase URL (starts with http), we keep it as it's small.
    const prunedForStorage = logsToSave.map((log, index) => {
      const isDataUrl = log.imageUrl && log.imageUrl.startsWith('data:');
      // Prune all but the very first data URL to save space
      if (isDataUrl && index > 0) {
        const { imageUrl, ...rest } = log;
        return rest as MealLog;
      }
      return log;
    });

    const success = safeSetItem('nuvision_logs', JSON.stringify(prunedForStorage), true);
    
    if (!success) {
      // If it fails, remove ALL data URLs
      const noDataUrls = logsToSave.map(log => {
        if (log.imageUrl && log.imageUrl.startsWith('data:')) {
          const { imageUrl, ...rest } = log;
          return rest as MealLog;
        }
        return log;
      });
      
      const success2 = safeSetItem('nuvision_logs', JSON.stringify(noDataUrls), true);
      
      if (!success2) {
        // Last resort: only store last 5 logs metadata
        const minimal = noDataUrls.slice(0, 5);
        safeSetItem('nuvision_logs', JSON.stringify(minimal), false);
      }
    }
  };

  useEffect(() => {
    if (logs.length > 0) {
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const filteredLogs = logs.filter(log => log.timestamp >= oneWeekAgo);
      
      // Always save to ensure storage is optimized (pruned of heavy base64)
      safeSaveLogs(filteredLogs);
      
      if (filteredLogs.length !== logs.length) {
        setLogs(filteredLogs);
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

  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchSupabaseData = async (userId: string) => {
    if (!supabase) {
      loadLocalData();
      return;
    }
    
    // We only show full-screen loading if we don't have a profile OR logs yet
    // This makes login feel snappier if they already have local data
    if (!profile && logs.length === 0) {
      setIsLoading(true);
    }
    setFetchError(null);

    // Safety timeout to prevent getting stuck on loading screen
    // Waking up a paused Supabase project can take ~20-30 seconds
    const loadingTimeout = setTimeout(() => {
      console.warn('Supabase data fetch timed out. Falling back to local data.');
      setFetchError('Cloud server is taking a while to wake up. Working in offline mode for now.');
      setIsLoading(false);
      loadLocalData();
    }, 25000); // Increased to 25 seconds for cold starts

    // Set an intermediate warning if it's taking more than 5s
    const warningTimeout = setTimeout(() => {
      setFetchError('Waking up cloud server...');
    }, 5000);

    try {
      // Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId);

      if (profileData && profileData.length > 0) {
        setProfile(profileData[0].data);
      } else if (profileError) {
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
      } else if (logsError && logsError.message?.includes('Failed to fetch')) {
        setFetchError('Connection lost: Supabase server unreachable.');
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
      }

      // Sync local data to cloud if cloud is empty but local has data
      const localLogsStr = localStorage.getItem('nuvision_logs');
      const localLogs: MealLog[] = localLogsStr ? JSON.parse(localLogsStr) : [];
      
      if (cloudLogs.length === 0 && localLogs.length > 0) {
        // Only sync if we didn't get an error fetching cloud logs
        if (!logsError) {
          // Sync in background, don't await the whole loop for UI
          (async () => {
             for (const log of localLogs) {
              await supabase.from('meal_logs').upsert({
                user_id: userId,
                id: log.id,
                timestamp: log.timestamp,
                data: log,
              });
            }
          })();
          setLogs(localLogs);
          safeSaveLogs(localLogs);
        } else {
          setLogs(localLogs);
          safeSaveLogs(localLogs);
        }
      } else {
        setLogs(cloudLogs);
        safeSaveLogs(cloudLogs);
      }

      const localWeightStr = localStorage.getItem('nuvision_weight_logs');
      const localWeight: WeightLog[] = localWeightStr ? JSON.parse(localWeightStr) : [];

      if (cloudWeightLogs.length === 0 && localWeight.length > 0) {
        setWeightLogs(localWeight);
      } else {
        setWeightLogs(cloudWeightLogs);
      }

      clearTimeout(loadingTimeout);
      clearTimeout(warningTimeout);
      setFetchError(null);
    } catch (err: any) {
      clearTimeout(loadingTimeout);
      clearTimeout(warningTimeout);
      console.error('Error in fetchSupabaseData:', err);
      
      if (err.message?.includes('Failed to fetch')) {
        setFetchError('Cannot reach cloud server. Project might be paused or network is down.');
      } else {
        setFetchError('Could not sync with cloud. working offline.');
      }
      
      loadLocalData();
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    safeSetItem('nuvision_theme', newTheme);
  };

  const saveProfile = async (newProfile: UserProfile) => {
    setProfile(newProfile);
    safeSetItem('nuvision_profile', JSON.stringify(newProfile));

    if (user && supabase) {
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
    safeSaveLogs(updatedLogs);

    // Use getUser() directly to ensure we have the most up-to-date auth state
    const currentUser = supabase ? (await supabase.auth.getUser()).data.user : null;
    
    if (currentUser && supabase) {
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
    console.log('deleteLog called with id:', id);
    let logsAfterDelete: MealLog[] = [];
    
    setLogs(prevLogs => {
      logsAfterDelete = prevLogs.filter(log => log.id !== id);
      return logsAfterDelete;
    });

    // Use a small timeout to ensure state has "settled" or just use the calculated value
    // Actually, we calculated logsAfterDelete above, but setLogs is async.
    // Let's just calculate it again from the current logs to be safe for storage.
    const updated = logs.filter(log => log.id !== id);
    safeSaveLogs(updated);

    const currentUser = supabase ? (await supabase.auth.getUser()).data.user : null;
    if (currentUser && supabase) {
      console.log('Deleting from Supabase for user:', currentUser.id);
      const { error } = await supabase.from('meal_logs').delete().eq('id', id).eq('user_id', currentUser.id);
      if (error) {
        console.error('Error deleting log from Supabase:', error);
      } else {
        console.log('Successfully deleted from Supabase');
      }
    }
  };

  const addWeightLog = async (newLog: WeightLog) => {
    const updatedLogs = [newLog, ...weightLogs].sort((a, b) => b.timestamp - a.timestamp);
    setWeightLogs(updatedLogs);
    safeSetItem('nuvision_weight_logs', JSON.stringify(updatedLogs));

    const currentUser = supabase ? (await supabase.auth.getUser()).data.user : null;
    if (currentUser && supabase) {
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
    safeSetItem('nuvision_weight_logs', JSON.stringify(updatedLogs));

    if (user && supabase) {
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
      <div className={`h-full w-full flex flex-col transition-colors duration-300 ${!profile ? 'bg-white' : (theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900')}`}>
        {fetchError && (
          <div className="bg-red-500 text-white text-[10px] py-1 px-4 text-center font-bold animate-in slide-in-from-top duration-500 flex items-center justify-center gap-3">
            <span className="flex-1">{fetchError}</span>
            {user && (
              <button 
                onClick={() => fetchSupabaseData(user.id)}
                className="bg-white/20 hover:bg-white/40 px-2 py-0.5 rounded-md uppercase tracking-widest text-[8px] border border-white/20 transition-all font-black shrink-0"
              >
                Retry
              </button>
            )}
          </div>
        )}
        {profile && <Header theme={theme} onToggleTheme={toggleTheme} user={user} />}
        <main className={`flex-1 overflow-y-auto container mx-auto px-4 max-w-2xl ${profile ? 'py-6 pb-24' : 'py-0'}`}>
          <Routes>
            {!profile ? (
              <Route path="*" element={<Onboarding onComplete={saveProfile} theme={theme} initialLoginMode={wasLoggedOut} user={user} />} />
            ) : (
              <>
                <Route path="/" element={<Dashboard profile={profile} logs={logs} onDeleteLog={deleteLog} theme={theme} />} />
                <Route path="/baby" element={<BabyHub theme={theme} />} />
                <Route path="/milestones" element={<Milestones theme={theme} />} />
                <Route path="/vaccinations" element={<Vaccinations theme={theme} />} />
                <Route path="/scanner" element={<Scanner profile={profile} logs={logs} onLog={addLog} theme={theme} user={user} />} />
                <Route path="/history" element={<MealHistory profile={profile} logs={logs} onDeleteLog={deleteLog} theme={theme} />} />
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
