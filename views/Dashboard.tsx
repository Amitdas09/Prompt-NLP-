
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, MealLog } from '../types';
import { GOAL_COLORS } from '../constants';
import { TrendingUp, Clock, Flame, X, Info, Zap, Trash2, AlertCircle } from 'lucide-react';

interface DashboardProps {
  profile: UserProfile;
  logs: MealLog[];
  onDeleteLog: (id: string) => void;
  theme: 'light' | 'dark';
}

const Dashboard: React.FC<DashboardProps> = ({ profile, logs, onDeleteLog, theme }) => {
  const [selectedMeal, setSelectedMeal] = useState<MealLog | null>(null);
  const [mealToDelete, setMealToDelete] = useState<MealLog | null>(null);
  const longPressTimer = useRef<number | null>(null);

  const today = new Date().setHours(0, 0, 0, 0);
  const todaysLogs = logs.filter(l => l.timestamp >= today);

  const consumed = todaysLogs.reduce((acc, log) => ({
    calories: acc.calories + log.data.calories,
    protein: acc.protein + log.data.protein,
    carbs: acc.carbs + log.data.carbs,
    fat: acc.fat + log.data.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const macroData = [
    { name: 'Protein', value: consumed.protein, target: profile.macroTargets.protein, color: '#10b981' },
    { name: 'Carbs', value: consumed.carbs, target: profile.macroTargets.carbs, color: '#3b82f6' },
    { name: 'Fat', value: consumed.fat, target: profile.macroTargets.fat, color: '#f59e0b' },
  ];

  const calPercentage = Math.min(Math.round((consumed.calories / profile.dailyCalorieTarget) * 100), 100);

  const handleLongPress = (meal: MealLog) => {
    // Vibrate if supported
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    setMealToDelete(meal);
  };

  const startPress = (meal: MealLog) => {
    longPressTimer.current = window.setTimeout(() => handleLongPress(meal), 600);
  };

  const cancelPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleRightClick = (e: React.MouseEvent, meal: MealLog) => {
    e.preventDefault();
    setMealToDelete(meal);
  };

  const confirmDelete = () => {
    if (mealToDelete) {
      onDeleteLog(mealToDelete.id);
      setMealToDelete(null);
      if (selectedMeal?.id === mealToDelete.id) {
        setSelectedMeal(null);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h2 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Hello, {profile.name}!</h2>
          <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} text-xs font-bold uppercase tracking-widest`}>Goal: {profile.goal}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Streak</p>
          <div className="flex items-center gap-1.5 text-orange-500 font-black">
            <Flame size={20} fill="currentColor" />
            <span className="text-lg">12 Days</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className={`p-8 rounded-[2.5rem] shadow-xl border relative overflow-hidden transition-all duration-500 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-slate-200/50'}`}>
          <div className="flex justify-between items-start relative z-10">
            <div className="space-y-1">
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Energy Budget</p>
              <h3 className={`text-4xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {consumed.calories} <span className="text-xl font-bold text-slate-400 tracking-normal">/ {profile.dailyCalorieTarget} kcal</span>
              </h3>
            </div>
            <div className={`p-3 rounded-2xl shadow-lg ${calPercentage > 90 ? 'bg-rose-100 text-rose-600' : (theme === 'dark' ? 'bg-emerald-950 text-emerald-400' : 'bg-emerald-50 text-emerald-600')}`}>
              <TrendingUp size={24} />
            </div>
          </div>
          <div className={`mt-6 w-full h-3 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <div 
              className={`h-full transition-all duration-1000 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)] ${calPercentage > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`}
              style={{ width: `${calPercentage}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {macroData.map((macro) => (
            <div key={macro.name} className={`p-4 rounded-[2rem] shadow-sm border text-center transition-all hover:scale-[1.02] ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-slate-200/40'}`}>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{macro.name}</p>
              <p className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{macro.value}g</p>
              <div className={`w-full h-1.5 rounded-full mt-2 overflow-hidden ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <div 
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min((macro.value / macro.target) * 100, 100)}%`, backgroundColor: macro.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-5">
          <h4 className={`text-lg font-black tracking-tight ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Daily Activity</h4>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">{todaysLogs.length} Records</span>
        </div>
        
        <div className="space-y-4">
          {todaysLogs.length === 0 ? (
            <div className={`border-2 border-dashed rounded-[2.5rem] p-12 text-center transition-all ${theme === 'dark' ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-inner'}`}>
              <Zap size={40} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-400 font-bold tracking-tight">Your food log is empty.</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Scan a meal to analyze macros</p>
            </div>
          ) : (
            todaysLogs.map((log) => (
              <button 
                key={log.id} 
                onClick={() => setSelectedMeal(log)}
                onContextMenu={(e) => handleRightClick(e, log)}
                onTouchStart={() => startPress(log)}
                onTouchEnd={cancelPress}
                onMouseDown={() => startPress(log)}
                onMouseUp={cancelPress}
                onMouseLeave={cancelPress}
                className={`w-full p-5 rounded-[2.25rem] shadow-sm border-2 flex items-center gap-5 transition-all text-left group active:scale-[0.98] relative overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border-slate-800 hover:border-emerald-900' : 'bg-white border-slate-100 hover:border-emerald-200 shadow-slate-200/50'}`}
              >
                <div className={`w-20 h-20 rounded-[1.5rem] overflow-hidden flex-shrink-0 shadow-lg border-2 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-white'}`}>
                  {log.imageUrl ? (
                    <img src={log.imageUrl} alt={log.data.itemName} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Clock size={28} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h5 className={`text-lg font-black truncate tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{log.data.itemName}</h5>
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border-2 uppercase tracking-widest ${GOAL_COLORS[log.data.goalScore]}`}>
                      {log.data.goalScore}
                    </span>
                  </div>
                  <div className={`flex gap-4 mt-1 text-[11px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                    <span className="flex items-center gap-1"><Flame size={12} className="text-orange-500" /> {log.data.calories} kcal</span>
                    <span className="flex items-center gap-1"><Info size={12} className="text-emerald-500" /> {log.data.protein}g P</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedMeal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className={`w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-12 duration-500 flex flex-col max-h-[85vh] ${theme === 'dark' ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <div className="relative h-60 flex-shrink-0">
              <img src={selectedMeal.imageUrl} className="w-full h-full object-cover" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
              <button 
                onClick={() => setSelectedMeal(null)}
                className="absolute top-6 right-6 bg-white/20 backdrop-blur-md text-white p-2.5 rounded-full hover:bg-white/40 transition-all active:scale-90"
              >
                <X size={20} strokeWidth={3} />
              </button>
              <button 
                onClick={() => setMealToDelete(selectedMeal)}
                className="absolute top-6 left-6 bg-rose-500 text-white p-2.5 rounded-full hover:bg-rose-600 transition-all active:scale-90 shadow-xl"
              >
                <Trash2 size={20} strokeWidth={3} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className={`text-3xl font-black tracking-tight leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{selectedMeal.data.itemName}</h3>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full border-2 uppercase tracking-widest ${GOAL_COLORS[selectedMeal.data.goalScore]}`}>
                      {selectedMeal.data.goalScore}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confidence: {selectedMeal.data.honestyScore}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black text-emerald-500 leading-none">{selectedMeal.data.calories}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">kcal</p>
                </div>
              </div>

              <div className={`grid grid-cols-4 gap-3 py-6 border-y-2 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-50'}`}>
                {[
                  { label: 'Protein', value: selectedMeal.data.protein, color: 'bg-emerald-500' },
                  { label: 'Carbs', value: selectedMeal.data.carbs, color: 'bg-blue-500' },
                  { label: 'Fat', value: selectedMeal.data.fat, color: 'bg-amber-500' },
                  { label: 'Fiber', value: selectedMeal.data.fiber, color: 'bg-purple-500' },
                ].map(m => (
                  <div key={m.label} className="text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">{m.label}</p>
                    <p className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{m.value}g</p>
                    <div className={`h-1.5 w-full rounded-full mt-2 ${m.color} opacity-20`} />
                  </div>
                ))}
              </div>

              <div className={`p-6 rounded-[2rem] border-2 transition-all ${theme === 'dark' ? 'bg-emerald-950/10 border-emerald-900/30' : 'bg-emerald-50/50 border-emerald-100'}`}>
                <p className={`text-[10px] font-black uppercase mb-4 flex items-center gap-2 tracking-[0.15em] ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-800'}`}>
                  <Zap size={16} className="text-emerald-500 fill-emerald-500" /> Vision Corrections
                </p>
                <ul className="space-y-3">
                  {selectedMeal.data.suggestions.map((s, idx) => (
                    <li key={idx} className={`text-sm flex items-start gap-3 leading-relaxed font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-emerald-900/80'}`}>
                      <div className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className={`p-6 border-t-2 ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
              <button 
                onClick={() => setSelectedMeal(null)}
                className={`w-full font-black text-sm uppercase tracking-widest py-5 rounded-[2rem] transition-all shadow-xl active:scale-95 ${theme === 'dark' ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {mealToDelete && (
        <div className="fixed inset-0 z-[70] bg-slate-900/80 backdrop-blur-lg flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className={`w-full max-w-sm rounded-[2.5rem] p-8 space-y-6 text-center shadow-2xl animate-in zoom-in-95 duration-300 ${theme === 'dark' ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <div className="inline-flex p-5 rounded-[1.5rem] bg-rose-50 text-rose-500 border-2 border-rose-100">
              <Trash2 size={40} strokeWidth={2.5} />
            </div>
            
            <div className="space-y-2">
              <h3 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Remove Record?</h3>
              <p className="text-sm font-bold text-slate-400 leading-relaxed uppercase tracking-wider">Are you sure you want to delete <span className="text-slate-500">"{mealToDelete.data.itemName}"</span>? This cannot be undone.</p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmDelete}
                className="w-full bg-rose-500 text-white font-black py-4 rounded-2xl hover:bg-rose-600 transition-all shadow-xl active:scale-95 text-sm uppercase tracking-widest"
              >
                Yes, Delete it
              </button>
              <button 
                onClick={() => setMealToDelete(null)}
                className={`w-full font-black py-4 rounded-2xl transition-all text-sm uppercase tracking-widest ${theme === 'dark' ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
