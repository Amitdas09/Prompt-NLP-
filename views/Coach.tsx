
import React, { useState, useEffect } from 'react';
import { UserProfile, MealLog } from '../types';
import { getCoachInsights } from '../geminiService';
import { Sparkles, Trophy, Calendar, ChevronRight, X, Star, TrendingUp, CheckCircle } from 'lucide-react';

interface CoachProps {
  profile: UserProfile;
  logs: MealLog[];
  theme: 'light' | 'dark';
}

interface MilestoneDetail {
  id: string;
  title: string;
  desc: string;
  fullDesc: string;
  icon: React.ReactNode;
  status: 'Achieved' | 'In Progress' | 'Unlocked' | 'Locked';
  progress: number;
  requirement: string;
  tip: string;
}

const Coach: React.FC<CoachProps> = ({ profile, logs, theme }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneDetail | null>(null);

  useEffect(() => {
    if (logs.length > 0 && !insight) {
      loadInsight();
    }
  }, [logs]);

  const loadInsight = async () => {
    setLoading(true);
    try {
      const result = await getCoachInsights(logs.slice(0, 10), profile);
      setInsight(result);
    } catch (error) {
      setInsight("I'm having trouble analyzing your data right now. Try again later!");
    } finally {
      setLoading(false);
    }
  };

  const milestones: MilestoneDetail[] = [
    { 
      id: 'protein',
      title: 'Protein Consistent', 
      desc: 'Met protein goal 3 days in a row', 
      fullDesc: 'Consistency is the key to muscle maintenance and growth. You have shown remarkable discipline in reaching your daily protein targets.',
      icon: <Trophy className="text-amber-500" />, 
      status: 'Achieved',
      progress: 100,
      requirement: 'Reach daily protein target for 3 consecutive days.',
      tip: 'Try adding Greek yogurt or eggs to your breakfast to maintain this streak!'
    },
    { 
      id: 'sugar',
      title: 'Low Sugar Streak', 
      desc: 'No high-sugar products scanned this week', 
      fullDesc: 'Avoiding processed sugars reduces inflammation and stabilizes energy levels. You are currently on a 5-day streak of clean scanning.',
      icon: <TrendingUp className="text-emerald-500" />, 
      status: 'In Progress',
      progress: 70,
      requirement: 'Scan only low-sugar (under 5g/100g) products for 7 days.',
      tip: 'Check labels for hidden names like maltodextrin or dextrose.'
    },
    { 
      id: 'master',
      title: 'Meal Master', 
      desc: 'Logged 20+ meals with photo analysis', 
      fullDesc: 'Logging your meals with NuVision AI helps the engine understand your unique portion sizes and preferences.',
      icon: <Calendar className="text-blue-500" />, 
      status: 'Unlocked',
      progress: 45,
      requirement: 'Successfully log 20 meals using the Photo Analysis tool.',
      tip: 'Take photos in natural light for the best nutrition estimation accuracy.'
    },
    { 
      id: 'visionary',
      title: 'NuVision Visionary', 
      desc: 'Scan 10 unique food categories', 
      fullDesc: 'Diversity in your diet ensures a wide spectrum of micronutrients. You have explored 4 out of 10 major food groups.',
      icon: <Star className="text-purple-500" />, 
      status: 'Locked',
      progress: 40,
      requirement: 'Scan items from 10 different categories (e.g. Greens, Grains, Dairy, Legumes).',
      tip: 'Try scanning a tropical fruit or a fermented food category to progress.'
    },
  ];

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-[2.5rem] text-white shadow-2xl transition-all relative overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border border-emerald-900/30' : 'bg-slate-900 shadow-slate-200'}`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-emerald-500 p-3 rounded-2xl shadow-lg shadow-emerald-500/20">
            <Sparkles size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight">AI Coach</h2>
            <p className="text-emerald-400/80 text-xs font-bold uppercase tracking-widest">Personalized Insights</p>
          </div>
        </div>

        <div className={`backdrop-blur-xl rounded-3xl p-6 border transition-colors ${theme === 'dark' ? 'bg-slate-800/40 border-white/5' : 'bg-white/5 border-white/10'}`}>
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-400"></div>
              <p className="text-sm font-bold text-emerald-400 tracking-wide uppercase">Scanning History...</p>
            </div>
          ) : insight ? (
            <div className="prose prose-invert prose-sm max-w-none">
              <div className="text-slate-200 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: insight.replace(/\n/g, '<br/>') }} />
            </div>
          ) : (
            <p className="text-center text-sm font-bold text-slate-400 py-8 uppercase tracking-widest">Log meals to wake up your coach</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className={`text-lg font-black tracking-tight ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>Milestone Progress</h3>
        <div className="grid grid-cols-1 gap-3">
          {milestones.map((m) => (
            <button 
              key={m.id} 
              onClick={() => setSelectedMilestone(m)}
              className={`p-4 rounded-3xl shadow-sm border flex items-center gap-4 transition-all text-left group hover:scale-[1.02] active:scale-95 ${theme === 'dark' ? 'bg-slate-900 border-slate-800 hover:border-emerald-900' : 'bg-white border-slate-100 hover:border-emerald-100 hover:shadow-md'}`}
            >
              <div className={`p-4 rounded-2xl transition-colors ${theme === 'dark' ? 'bg-slate-800 group-hover:bg-slate-700' : 'bg-slate-50 group-hover:bg-emerald-50'}`}>
                {m.icon}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`text-sm font-black tracking-tight ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{m.title}</h4>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${m.status === 'Achieved' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    {m.status}
                  </span>
                </div>
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{m.desc}</p>
                <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${m.status === 'Achieved' ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                    style={{ width: `${m.progress}%` }} 
                  />
                </div>
              </div>
              <ChevronRight className="text-slate-300" size={20} />
            </button>
          ))}
        </div>
      </div>

      {/* Milestone Modal */}
      {selectedMilestone && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className={`w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 ${theme === 'dark' ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <div className="p-8 text-center space-y-6">
              <div className={`inline-flex p-6 rounded-3xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'}`}>
                {/* Use permissive cast to any to allow size prop injection without build error */}
                {React.cloneElement(selectedMilestone.icon as React.ReactElement<any>, { size: 48 })}
              </div>
              
              <div>
                <h3 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{selectedMilestone.title}</h3>
                <p className="text-sm font-bold text-emerald-500 uppercase tracking-widest mt-1">{selectedMilestone.status}</p>
              </div>

              <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                {selectedMilestone.fullDesc}
              </p>

              <div className={`p-4 rounded-2xl text-left space-y-3 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                <div className="flex items-start gap-3">
                  <CheckCircle size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Requirement</p>
                    <p className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{selectedMilestone.requirement}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Coach Tip</p>
                    <p className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{selectedMilestone.tip}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  <span>Current Progress</span>
                  <span>{selectedMilestone.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-700" 
                    style={{ width: `${selectedMilestone.progress}%` }} 
                  />
                </div>
              </div>

              <button 
                onClick={() => setSelectedMilestone(null)}
                className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-emerald-600 transition-all shadow-xl"
              >
                Keep Going
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coach;
