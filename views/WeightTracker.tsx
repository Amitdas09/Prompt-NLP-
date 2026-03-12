
import React, { useState, useMemo } from 'react';
import { Scale, Plus, TrendingUp, TrendingDown, Info, Zap, Calendar, Trash2, ChevronRight, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { UserProfile, WeightLog, WeightAnalysis } from '../types';
import { analyzeWeightProgress } from '../geminiService';

interface WeightTrackerProps {
  profile: UserProfile;
  weightLogs: WeightLog[];
  onAddLog: (log: WeightLog) => void;
  onDeleteLog: (id: string) => void;
  theme: 'light' | 'dark';
}

const WeightTracker: React.FC<WeightTrackerProps> = ({ profile, weightLogs, onAddLog, onDeleteLog, theme }) => {
  const [newWeight, setNewWeight] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<WeightAnalysis | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const currentBMI = useMemo(() => {
    if (weightLogs.length === 0) return 0;
    // Find the latest log by timestamp
    const latestLog = [...weightLogs].sort((a, b) => b.timestamp - a.timestamp)[0];
    return latestLog.bmi;
  }, [weightLogs]);

  const bmiStatus = useMemo(() => {
    if (currentBMI === 0) return 'No data';
    if (currentBMI < 18.5) return 'Underweight';
    if (currentBMI < 25) return 'Normal';
    if (currentBMI < 30) return 'Overweight';
    return 'Obese';
  }, [currentBMI]);

  const handleAddWeight = () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) return;

    const heightInMeters = profile.height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);

    // Create timestamp from selected date at current time
    const dateObj = new Date(selectedDate);
    const now = new Date();
    dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    const log: WeightLog = {
      id: crypto.randomUUID(),
      timestamp: dateObj.getTime(),
      weight,
      bmi: parseFloat(bmi.toFixed(1))
    };

    onAddLog(log);
    setNewWeight('');
  };

  const handleAnalyze = async () => {
    if (weightLogs.length < 2) {
      alert("Please log at least 2 weight entries to analyze progress.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const result = await analyzeWeightProgress([...weightLogs].reverse(), profile);
      setAnalysis(result);
    } catch (error) {
      console.error("Analysis failed", error);
      alert("Failed to analyze progress. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const chartData = useMemo(() => {
    return [...weightLogs].reverse().map(log => ({
      date: new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: log.weight,
      bmi: log.bmi
    }));
  }, [weightLogs]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-6 rounded-[2.5rem] border-2 transition-all ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Scale size={20} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Weight</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {weightLogs.length > 0 ? weightLogs[0].weight : profile.weight}
            </span>
            <span className="text-xs font-bold text-slate-400">kg</span>
          </div>
        </div>

        <div className={`p-6 rounded-[2.5rem] border-2 transition-all ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Activity size={20} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current BMI</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {currentBMI || '--'}
            </span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ml-2 uppercase ${
              bmiStatus === 'Normal' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}>
              {bmiStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className={`p-8 rounded-[3rem] border-2 transition-all ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'}`}>
        <h3 className={`text-xl font-black mb-6 tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Log Weight</h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <input
                type="number"
                step="0.1"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                placeholder="Weight in kg"
                className={`w-full pl-6 pr-12 py-4 rounded-3xl border-2 font-bold outline-none transition-all ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-emerald-500'
                }`}
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 uppercase">kg</span>
            </div>
            <div className="flex-1 relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`w-full px-6 py-4 rounded-3xl border-2 font-bold outline-none transition-all ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-emerald-500'
                }`}
              />
            </div>
          </div>
          <button
            onClick={handleAddWeight}
            className="w-full bg-emerald-600 text-white py-4 rounded-3xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Add Entry
          </button>
        </div>
      </div>

      {/* Chart Section */}
      {weightLogs.length > 0 && (
        <div className={`p-8 rounded-[3rem] border-2 transition-all ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'}`}>
          <div className="flex justify-between items-center mb-8">
            <h3 className={`text-xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Weight Progress</h3>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Calendar size={14} />
              <span>Last {weightLogs.length} entries</span>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                />
                <YAxis 
                  hide 
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                    color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                    fontWeight: 'bold'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#10b981" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorWeight)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* AI Analysis Section */}
      <div className="space-y-4">
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || weightLogs.length < 2}
          className={`w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-2xl ${
            isAnalyzing ? 'bg-slate-800 text-slate-500' : 'bg-slate-900 text-white hover:bg-emerald-600 active:scale-95'
          }`}
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-600 border-t-emerald-500" />
              Analyzing Progress...
            </>
          ) : (
            <>
              <Zap size={20} className="fill-emerald-500 text-emerald-500" />
              Analyze Fitness Goal
            </>
          )}
        </button>

        {analysis && (
          <div className={`p-8 rounded-[3rem] border-2 animate-in slide-in-from-bottom-6 duration-700 transition-all ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'}`}>
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <h4 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{analysis.status}</h4>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                    analysis.onTrack ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {analysis.onTrack ? 'On Track' : 'Needs Adjustment'}
                  </span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {analysis.daysLogged} Days Logged
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-black ${analysis.weightChange < 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {analysis.weightChange > 0 ? '+' : ''}{analysis.weightChange}kg
                </p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Change</p>
              </div>
            </div>

            <div className={`p-6 rounded-3xl mb-6 ${theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
              <p className={`text-sm font-bold leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                {analysis.summary}
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personalized Tips</p>
              <div className="grid gap-3">
                {analysis.tips.map((tip, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl flex items-start gap-4 transition-colors ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-white border border-slate-100'}`}>
                    <div className="mt-1 p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                      <Zap size={14} />
                    </div>
                    <p className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* History List */}
      <div className="space-y-4">
        <h3 className={`text-xl font-black tracking-tight px-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>History</h3>
        <div className="space-y-3">
          {weightLogs.map((log) => (
            <div key={log.id} className={`p-5 rounded-[2rem] border-2 flex items-center justify-between transition-all ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-lg shadow-slate-200/30'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                  <Calendar size={20} />
                </div>
                <div>
                  <p className={`text-sm font-black ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                    {new Date(log.timestamp).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">BMI: {log.bmi}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{log.weight}kg</p>
                <div className="flex items-center">
                  {deletingId === log.id ? (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                      <button
                        onClick={() => {
                          onDeleteLog(log.id);
                          setDeletingId(null);
                        }}
                        className="px-3 py-1 bg-rose-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest hover:bg-rose-600 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setDeletingId(log.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeightTracker;
