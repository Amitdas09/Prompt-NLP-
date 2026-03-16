
import React, { useState, useMemo } from 'react';
import { UserProfile, MealLog } from '../types';
import { Calendar, ChevronRight, Flame, Zap, Clock, Info, TrendingUp, AlertCircle, History as HistoryIcon, X, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';
import { analyzeDailyIntake } from '../geminiService';
import { GOAL_COLORS } from '../constants';

interface MealHistoryProps {
  profile: UserProfile;
  logs: MealLog[];
  onDeleteLog: (id: string) => void;
  theme: 'light' | 'dark';
}

const MealHistory: React.FC<MealHistoryProps> = ({ profile, logs, onDeleteLog, theme }) => {
  const [analyzingDate, setAnalyzingDate] = useState<string | null>(null);
  const [dailyAnalysis, setDailyAnalysis] = useState<Record<string, string>>({});
  const [selectedLog, setSelectedLog] = useState<MealLog | null>(null);
  const [logToDelete, setLogToDelete] = useState<string | null>(null);

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
    <div className="animate-in fade-in duration-700">
      <div className="sticky top-0 z-10 pt-4 pb-4 px-4 bg-inherit backdrop-blur-md bg-opacity-80">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
            <HistoryIcon size={24} />
          </div>
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Meal History</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your nutrition journey</p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-8 pb-10">
        {dates.length === 0 ? (
          <div className={`mt-10 p-12 rounded-[2.5rem] border-2 border-dashed text-center ${theme === 'dark' ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <Clock size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-400 font-bold">No meals logged yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {dates.map(date => {
              const dayLogs = groupedLogs[date];
              const totalCals = dayLogs.reduce((sum, l) => sum + l.data.calories, 0);
              const isOverTarget = totalCals > profile.dailyCalorieTarget;
              
              return (
                <div key={date} className="space-y-3">
                  <div className="sticky top-[88px] z-10 py-2 flex justify-between items-center bg-inherit">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                      <h3 className={`text-sm font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{date}</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                        isOverTarget ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {totalCals} kcal
                      </span>
                      <button 
                        onClick={() => handleAnalyzeDay(date)}
                        disabled={analyzingDate === date}
                        className={`p-1.5 rounded-lg transition-all active:scale-90 ${
                          theme === 'dark' ? 'bg-slate-800 text-emerald-400' : 'bg-white border border-slate-100 text-emerald-600 shadow-sm'
                        }`}
                      >
                        {analyzingDate === date ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent" />
                        ) : (
                          <Zap size={16} className={dailyAnalysis[date] ? 'fill-emerald-500' : ''} />
                        )}
                      </button>
                    </div>
                  </div>

                  {dailyAnalysis[date] && (
                    <div className={`p-4 rounded-2xl border-l-4 border-emerald-500 animate-in slide-in-from-left-2 duration-500 ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-emerald-50 border-emerald-100'
                    }`}>
                      <p className={`text-xs font-medium leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-emerald-900/80'}`}>
                        {dailyAnalysis[date]}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {dayLogs.map(log => (
                      <div 
                        key={log.id} 
                        onClick={() => setSelectedLog(log)}
                        className={`p-4 rounded-2xl border flex items-center gap-4 transition-all active:scale-[0.98] cursor-pointer ${
                          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-md shadow-slate-200/50'
                        }`}
                      >
                        <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {log.imageUrl ? (
                            <img src={log.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Clock size={18} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <h4 className={`text-sm font-black truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{log.data.itemName}</h4>
                            <div className="flex items-center gap-2">
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest ${GOAL_COLORS[log.data.goalScore]}`}>
                                {log.data.goalScore}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLogToDelete(log.id);
                                }}
                                className={`p-1.5 rounded-lg transition-all hover:bg-rose-500/10 text-rose-500`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1">
                              <Flame size={10} className="text-orange-500" />
                              <span className="text-[10px] font-bold text-slate-400">{log.data.calories} kcal</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-1 h-1 rounded-full bg-slate-300" />
                              <span className="text-[10px] font-bold text-slate-400">{log.data.protein}g P</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-1 h-1 rounded-full bg-slate-300" />
                              <span className="text-[10px] font-bold text-slate-400">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
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

      {/* Meal Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setSelectedLog(null)} />
          
          <div className={`relative w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-500 ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
            <button 
              onClick={() => setSelectedLog(null)}
              className="absolute top-6 right-6 z-20 p-2 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-all"
            >
              <X size={20} />
            </button>

            <div className="aspect-square w-full relative overflow-hidden">
              {selectedLog.imageUrl ? (
                <img src={selectedLog.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300">
                  <HistoryIcon size={64} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-8 right-8">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${GOAL_COLORS[selectedLog.data.goalScore]}`}>
                    {selectedLog.data.goalScore} Score
                  </span>
                  <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">
                    {new Date(selectedLog.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h3 className="text-3xl font-black text-white tracking-tight leading-tight">{selectedLog.data.itemName}</h3>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-4 gap-4">
                <div className={`p-4 rounded-3xl text-center border-2 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cals</p>
                  <p className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{selectedLog.data.calories}</p>
                </div>
                <div className={`p-4 rounded-3xl text-center border-2 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Prot</p>
                  <p className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{selectedLog.data.protein}g</p>
                </div>
                <div className={`p-4 rounded-3xl text-center border-2 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Carb</p>
                  <p className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{selectedLog.data.carbs}g</p>
                </div>
                <div className={`p-4 rounded-3xl text-center border-2 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fat</p>
                  <p className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{selectedLog.data.fat}g</p>
                </div>
              </div>

              <div className={`p-6 rounded-[2rem] border-2 ${theme === 'dark' ? 'bg-emerald-950/10 border-emerald-900/20' : 'bg-emerald-50 border-emerald-100'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={16} className="text-emerald-500 fill-emerald-500" />
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">AI Analysis</span>
                </div>
                <p className={`text-sm font-bold leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-emerald-900/80'}`}>
                  {selectedLog.data.analysis}
                </p>
              </div>

              <div className="space-y-4">
                <p className={`text-[10px] font-black uppercase tracking-widest px-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Health Suggestions</p>
                <div className="space-y-3">
                  {selectedLog.data.suggestions.map((s, idx) => (
                    <div key={idx} className={`flex items-start gap-3 p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      <p className={`text-xs font-bold leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{s}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setLogToDelete(selectedLog.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-5 rounded-[2rem] font-black transition-all uppercase tracking-widest text-sm border-2 ${
                    theme === 'dark' ? 'border-rose-500/20 text-rose-500 hover:bg-rose-500/10' : 'border-rose-100 text-rose-600 hover:bg-rose-50 shadow-sm'
                  }`}
                >
                  <Trash2 size={18} />
                  Delete
                </button>
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="flex-[2] bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black py-5 rounded-[2rem] shadow-xl active:scale-95 transition-all uppercase tracking-widest text-sm"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {logToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setLogToDelete(null)} />
          <div className={`relative w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-300 ${theme === 'dark' ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className={`text-xl font-black text-center mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Delete Meal?</h3>
            <p className={`text-sm font-bold text-center mb-8 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              This action cannot be undone. Are you sure you want to remove this meal from your history?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  console.log('Confirming delete for:', logToDelete);
                  if (logToDelete) {
                    onDeleteLog(logToDelete);
                  }
                  setLogToDelete(null);
                  setSelectedLog(null);
                }}
                className="w-full py-4 bg-rose-500 text-white font-black rounded-2xl shadow-lg shadow-rose-500/20 active:scale-95 transition-all uppercase tracking-widest text-xs"
              >
                Yes, Delete Meal
              </button>
              <button
                onClick={() => setLogToDelete(null)}
                className={`w-full py-4 font-black rounded-2xl active:scale-95 transition-all uppercase tracking-widest text-xs ${
                  theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                }`}
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

export default MealHistory;
