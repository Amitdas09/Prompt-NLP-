
import React from 'react';
import { Baby, Syringe, Star, ShieldCheck, ChevronRight, Utensils } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BabyHubProps {
  theme: 'light' | 'dark';
}

const BabyHub: React.FC<BabyHubProps> = ({ theme }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className={`text-3xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          Baby Care Hub
        </h1>
        <p className="text-slate-500 font-bold text-sm uppercase tracking-wider mt-1">
          NuVision AI (Shishu-Sneh) • Digital Elder
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {/* Milestones Card */}
        <button 
          onClick={() => navigate('/milestones')}
          className={`p-6 rounded-[2.5rem] border-2 text-left transition-all active:scale-[0.98] flex items-center gap-6 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-emerald-200/30'}`}
        >
          <div className="w-16 h-16 rounded-3xl bg-emerald-500 text-white flex items-center justify-center shadow-lg relative shrink-0">
            <Baby size={32} />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 border-2 border-white rounded-full flex items-center justify-center">
              <Star size={10} fill="white" className="text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className={`font-black text-xl tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Developmental Milestones</h3>
            <p className="text-xs font-bold text-slate-500 mt-1">Track growth & weekly developmental goals</p>
          </div>
          <ChevronRight size={20} className="text-slate-300" />
        </button>

        {/* Vaccines Card */}
        <button 
          onClick={() => navigate('/vaccinations')}
          className={`p-6 rounded-[2.5rem] border-2 text-left transition-all active:scale-[0.98] flex items-center gap-6 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-blue-200/30'}`}
        >
          <div className="w-16 h-16 rounded-3xl bg-blue-500 text-white flex items-center justify-center shadow-lg relative shrink-0">
            <Syringe size={32} />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 border-2 border-white rounded-full flex items-center justify-center">
              <ShieldCheck size={10} className="text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className={`font-black text-xl tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Vaccination Alerts</h3>
            <p className="text-xs font-bold text-slate-500 mt-1">Upcoming shots & immunization calendar</p>
          </div>
          <ChevronRight size={20} className="text-slate-300" />
        </button>
      </div>

      {/* Quick Feeding Tips */}
      <div className={`p-6 rounded-[2.5rem] border-2 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-lg'}`}>
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-2xl bg-amber-500 text-white">
            <Utensils size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth Vision</p>
            <h4 className={`text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Feeding Guide</h4>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-50'}`}>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Impact Goal: Stunting Prevention</p>
            <p className="text-sm font-bold text-slate-500 leading-relaxed">
              Timely nutrition for mother and baby ensures healthy brain and body development.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BabyHub;
