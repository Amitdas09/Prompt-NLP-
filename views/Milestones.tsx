
import React, { useState } from 'react';
import { Milestone } from '../types';
import { CheckCircle2, ChevronRight, Info, Star, Utensils } from 'lucide-react';
import { motion } from 'motion/react';

interface MilestonesProps {
  theme: 'light' | 'dark';
}

const DEFAULT_MILESTONES: Milestone[] = [
  { id: '1', week: 2, title: 'First Smile', description: 'Baby smiles in response to your voice or smile.', achieved: false },
  { id: '2', week: 4, title: 'Following Objects', description: 'Baby begins to follow moving objects with their eyes.', achieved: false },
  { id: '3', week: 8, title: 'Cooing Sounds', description: 'Baby starts making "cooing" and gurgling sounds.', achieved: false },
  { id: '4', week: 12, title: 'Head Control', description: 'Baby can hold their head up while on their tummy.', achieved: false },
  { id: '5', week: 16, title: 'Reaching for Toys', description: 'Baby starts reaching for objects with one hand.', achieved: false },
  { id: '6', week: 24, title: 'Sitting with Support', description: 'Baby can sit up for a short time with support.', achieved: false },
];

const Milestones: React.FC<MilestonesProps> = ({ theme }) => {
  const [milestones, setMilestones] = useState<Milestone[]>(DEFAULT_MILESTONES);

  const toggleMilestone = (id: string) => {
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, achieved: !m.achieved } : m));
  };

  const progress = Math.round((milestones.filter(m => m.achieved).length / milestones.length) * 100);

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className={`text-3xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          Baby Milestones
        </h1>
        <p className="text-slate-500 font-bold text-sm uppercase tracking-wider mt-1">
          Tracking Development • NuVision AI (Shishu-Sneh)
        </p>
      </header>

      {/* Impact Goal Banner */}
      <div className={`p-4 rounded-3xl border-2 border-emerald-500/20 bg-emerald-500/5 ${theme === 'dark' ? 'bg-emerald-500/10' : ''}`}>
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
            <Star size={20} />
          </div>
          <div>
            <p className={`text-sm font-black ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}`}>Developmental Vision</p>
            <p className="text-xs text-slate-500 font-bold leading-relaxed mt-1">
              "Baby should smile now." We guide you through every vital step of your baby's first year.
            </p>
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <div className={`p-6 rounded-[2.5rem] border-2 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'}`}>
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Growth Journey</p>
            <h2 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Completion</h2>
          </div>
          <p className="text-4xl font-black text-emerald-500">{progress}%</p>
        </div>
        <div className={`w-full h-4 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-emerald-500"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className={`text-lg font-black px-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>Weekly Milestones</h3>
        {milestones.map((m, index) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => toggleMilestone(m.id)}
            className={`group p-5 rounded-[2rem] border-2 cursor-pointer transition-all active:scale-[0.98] ${
              m.achieved 
                ? (theme === 'dark' ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-100') 
                : (theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm hover:shadow-md')
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                m.achieved ? 'bg-emerald-500 text-white' : (theme === 'dark' ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400')
              }`}>
                {m.achieved ? <CheckCircle2 size={24} /> : <span className="text-lg font-black">{m.week}</span>}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className={`font-black tracking-tight ${m.achieved ? 'text-emerald-600' : (theme === 'dark' ? 'text-white' : 'text-slate-800')}`}>{m.title}</h4>
                  {!m.achieved && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase">Week {m.week}</span>}
                </div>
                <p className="text-xs text-slate-500 font-bold mt-0.5">{m.description}</p>
              </div>
              <ChevronRight size={18} className={m.achieved ? 'text-emerald-400' : 'text-slate-300'} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Feeding Guide Section */}
      <div className="pt-4">
        <h3 className={`text-lg font-black px-2 mb-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>Feeding & Nutrition</h3>
        <div className={`p-6 rounded-[2.5rem] border-2 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-lg'}`}>
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-2xl bg-amber-500 text-white">
              <Utensils size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Tips</p>
              <h4 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Nutrition Guide</h4>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'}`}>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">For Mother</p>
              <p className="text-xs font-bold text-slate-500 leading-relaxed">
                Ensure hydration! Drink at least 3 liters of water daily. Focus on iron-rich foods like spinach and lean proteins.
              </p>
            </div>
            <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'}`}>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">For Baby</p>
              <p className="text-xs font-bold text-slate-500 leading-relaxed">
                Exclusive breastfeeding for the first 6 months is vital for immunity and brain development.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Milestones;
