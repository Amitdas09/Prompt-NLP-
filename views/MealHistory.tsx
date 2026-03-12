
import React, { useState, useMemo } from 'react';
import { UserProfile, MealLog } from '../types';
import { Calendar, ChevronRight, Flame, Zap, Clock, Info, TrendingUp, AlertCircle, History as HistoryIcon } from 'lucide-react';
import { analyzeDailyIntake } from '../geminiService';
import { GOAL_COLORS } from '../constants';

interface MealHistoryProps {
  profile: UserProfile;
  logs: MealLog[];
  theme: 'light' | 'dark';
}

const MealHistory: React.FC<MealHistoryProps> = ({ profile, logs, theme }) => {
  const [analyzingDate, setAnalyzingDate] = useState<string | null>(null);
  const [dailyAnalysis, setDailyAnalysis] = useState<Record<string, string>>({});

  const groupedLogs = useMemo(() => {
    const groups: Record<string, MealLog[]> = {};
    logs.forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(log);
    });
    return groups;
  }, [logs]);

  const dates = Object.keys(groupedLogs).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const handleAnalyzeDay = async (date: string) => {
    const dayLogs = groupedLogs[date];
    setAnalyzingDate(date);
    try {
      const analysis = await analyzeDailyIntake(dayLogs, profile);
      setDailyAnalysis(prev => ({ ...prev, [date]: analysis }));
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setAnalyzingDate(null);
    }
  };

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-700">
      <div className="flex items-center gap-4 px-2">
        <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
          <HistoryIcon size={28} />
        </div>
        <div>
          <h2 className={`text-3xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Meal History</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Track your consistency over time</p>
        </div>
      </div>

      {dates.length === 0 ? (
        <div className={`p-12 rounded-[3rem] border-2 border-dashed text-center ${theme === 'dark' ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <Clock size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-400 font-bold">No meals logged yet.</p>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Your history will appear here</p>
        </div>
      ) : (
        <div className="space-y-10">
          {dates.map(date => {
            const dayLogs = groupedLogs[date];
            const totalCals = dayLogs.reduce((sum, l) => sum + l.data.calories, 0);
            const isOverTarget = totalCals > profile.dailyCalorieTarget;
            const calDiff = Math.abs(totalCals - profile.dailyCalorieTarget);
            
            return (
              <div key={date} className="space-y-4">
                <div className="flex justify-between items-end px-2">
                  <div>
                    <h3 className={`text-xl font-black tracking-tight ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>{date}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                        isOverTarget ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {totalCals} / {profile.dailyCalorieTarget} kcal
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleAnalyzeDay(date)}
                    disabled={analyzingDate === date}
                    className={`p-2 rounded-xl transition-all active:scale-90 ${
                      theme === 'dark' ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700' : 'bg-white border border-slate-100 text-emerald-600 shadow-sm hover:bg-slate-50'
                    }`}
                  >
                    {analyzingDate === date ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-500 border-t-transparent" />
                    ) : (
                      <Zap size={20} className={dailyAnalysis[date] ? 'fill-emerald-500' : ''} />
                    )}
                  </button>
                </div>

                {dailyAnalysis[date] && (
                  <div className={`p-6 rounded-[2rem] border-2 animate-in slide-in-from-top-4 duration-500 ${
                    theme === 'dark' ? 'bg-emerald-950/10 border-emerald-900/20' : 'bg-emerald-50 border-emerald-100'
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Zap size={14} className="text-emerald-500 fill-emerald-500" />
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">AI Daily Analysis</span>
                    </div>
                    <p className={`text-sm font-bold leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-emerald-900/80'}`}>
                      {dailyAnalysis[date]}
                    </p>
                  </div>
                )}

                <div className="grid gap-3">
                  {dayLogs.map(log => (
                    <div key={log.id} className={`p-4 rounded-3xl border-2 flex items-center gap-4 transition-all ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
                    }`}>
                      <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-white dark:border-slate-800 shadow-sm">
                        {log.imageUrl ? (
                          <img src={log.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <Clock size={20} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className={`text-sm font-black truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{log.data.itemName}</h4>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border uppercase tracking-widest ${GOAL_COLORS[log.data.goalScore]}`}>
                            {log.data.goalScore}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <Flame size={10} className="text-orange-500" /> {log.data.calories}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <Info size={10} className="text-emerald-500" /> {log.data.protein}g P
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MealHistory;
