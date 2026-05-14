
import React, { useState } from 'react';
import { UserProfile, UserGoal, ActivityLevel } from '../types';
import { Zap, ChevronRight, LogIn, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  theme: 'light' | 'dark';
  initialLoginMode?: boolean;
  user: any;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, theme, initialLoginMode = false, user }) => {
  const [isLoginMode, setIsLoginMode] = useState(initialLoginMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    age: 25,
    weight: 70,
    height: 175,
    gender: 'male' as const,
    goal: UserGoal.MAINTENANCE,
    activityLevel: ActivityLevel.MODERATE
  });

  // If we are authenticated but still "loading" auth, stop it
  React.useEffect(() => {
    if (user && isAuthLoading) {
      setIsAuthLoading(false);
      setAuthError(null);
    }
  }, [user, isAuthLoading]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthLoading(true);

    // Set a timeout to prevent infinite "Processing..." state
    const timeoutId = setTimeout(() => {
      setIsAuthLoading(loading => {
        if (loading) {
          setAuthError("Authentication is taking longer than expected. If this is your first time, the server might be waking up (can take up to 60s).");
          return false;
        }
        return loading;
      });
    }, 45000); // 45 seconds for project wake-up

    try {
      if (!supabase) {
        clearTimeout(timeoutId);
        throw new Error('Authentication service is currently unavailable. Please check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY variables.');
      }

      // Check for secret key usage - common mistake
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
      if (anonKey.startsWith('sb_secret_')) {
        clearTimeout(timeoutId);
        throw new Error('You are using a "Service Role" secret key. Authentication only works with the public "anon" key. Please check your Supabase dashboard for the Anon key.');
      }
      
      console.log(`Supabase Auth Attempt: ${isLoginMode ? 'Login' : 'Signup'} for ${email}`);
      const { data, error } = isLoginMode 
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

      clearTimeout(timeoutId);
      
      if (error) {
        console.error('Supabase Auth Error:', error);
        if (error.message?.includes('Failed to fetch')) {
          throw new Error('Network error: Could not reach Supabase. Check your internet or project URL.');
        }
        throw new Error(error.message || 'Authentication failed');
      }

      if (!isLoginMode && data?.user && !data.session) {
        alert('Success! Please check your email for the confirmation link to activate your account.');
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      setAuthError(err.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const calculateTargets = () => {
    let bmr = 10 * formData.weight + 6.25 * formData.height - 5 * formData.age;
    bmr = formData.gender === 'male' ? bmr + 5 : bmr - 161;

    const multipliers = {
      [ActivityLevel.SEDENTARY]: 1.2,
      [ActivityLevel.LIGHT]: 1.375,
      [ActivityLevel.MODERATE]: 1.55,
      [ActivityLevel.VERY]: 1.725,
      [ActivityLevel.EXTREME]: 1.9
    };

    let tdee = bmr * multipliers[formData.activityLevel];

    if (formData.goal === UserGoal.FAT_LOSS) tdee -= 500;
    if (formData.goal === UserGoal.MUSCLE_GAIN || formData.goal === UserGoal.WEIGHT_GAIN) tdee += 300;

    const protein = formData.weight * 2;
    const fat = (tdee * 0.25) / 9;
    const carbs = (tdee - (protein * 4 + fat * 9)) / 4;

    return {
      dailyCalorieTarget: Math.round(tdee),
      macroTargets: {
        protein: Math.round(protein),
        carbs: Math.round(carbs),
        fat: Math.round(fat)
      }
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targets = calculateTargets();
    onComplete({
      ...formData,
      ...targets
    });
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-white flex flex-col items-center px-6 py-12">
      <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-4 bg-emerald-600 rounded-3xl shadow-2xl shadow-emerald-200 mb-2">
            <Zap size={36} fill="white" className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">NuVision AI</h1>
          <p className="text-slate-500 font-medium tracking-tight">Shishu-Sneh: Advanced Nutrition & Wellness Intelligence</p>
        </div>

        <div className="bg-white p-8 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 space-y-6">
          {!user ? (
            <>
              <div className="flex p-1 bg-slate-100 rounded-2xl">
                <button 
                  onClick={() => setIsLoginMode(false)}
                  className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!isLoginMode ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                >
                  Sign Up
                </button>
                <button 
                  onClick={() => setIsLoginMode(true)}
                  className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isLoginMode ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                >
                  Log In
                </button>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email</label>
                  <input
                    type="email"
                    required
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none font-bold pr-12"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                {authError && (
                  <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                    <p className="text-red-600 text-[10px] font-bold">{authError}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-slate-400 text-[9px] italic flex-1">Tip: You can always "Continue as Guest" below if login is failing.</p>
                      <button 
                        type="button"
                        onClick={() => {
                          localStorage.clear();
                          window.location.reload();
                        }}
                        className="text-[9px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 whitespace-nowrap"
                      >
                        Reset App
                      </button>
                    </div>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isAuthLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    <>
                      {isLoginMode ? 'Log In' : 'Sign Up'}
                      <LogIn size={18} />
                    </>
                  )}
                </button>
              </form>

              <div className="relative pt-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest"><span className="bg-white px-4 text-slate-300">Or use without account</span></div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const element = document.getElementById('profile-form-start');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full bg-slate-50 text-slate-500 font-bold py-3 rounded-2xl border-2 border-slate-100 hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
              >
                Continue as Guest
                <ChevronRight size={16} />
              </button>
            </>
          ) : (
            <div className="text-center py-2">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-emerald-600 font-black text-[10px] uppercase tracking-widest">Authenticated</p>
              </div>
              <p className="text-slate-900 font-bold truncate px-4">{user.email}</p>
              <button 
                onClick={() => supabase?.auth.signOut()}
                className="text-[10px] text-slate-400 hover:text-red-500 font-bold uppercase tracking-widest mt-2 underline"
              >
                Sign Out / Switch Account
              </button>
              <div className="h-px bg-slate-100 my-4"></div>
              <p className="text-slate-500 text-xs font-medium px-4">Great! Now just complete your profile details below to get started.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" id="profile-form-start">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
              <input
                type="text"
                required
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 font-bold text-lg"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Alex Johnson"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Age</label>
                <input
                  type="number"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-lg"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Gender</label>
                <select
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer font-bold text-lg"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Weight (kg)</label>
                <input
                  type="number"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-lg"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Height (cm)</label>
                <input
                  type="number"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-lg"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Fitness Goal</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(UserGoal).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setFormData({ ...formData, goal: g })}
                    className={`px-3 py-3 rounded-2xl text-[11px] font-black transition-all border-2 ${formData.goal === g ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-200' : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-200 hover:bg-slate-50'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Activity Level</label>
              <select
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer font-bold"
                value={formData.activityLevel}
                onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value as ActivityLevel })}
              >
                {Object.values(ActivityLevel).map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 text-white font-black py-5 rounded-[2rem] hover:bg-emerald-600 transition-all shadow-2xl flex items-center justify-center gap-2 mt-2 text-xl active:scale-95 transform"
            >
              Create Profile
              <ChevronRight size={24} />
            </button>
          </form>
        </div>

        <p className="text-center text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
          Powered by NuVision AI (Shishu-Sneh) • v1.0
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
