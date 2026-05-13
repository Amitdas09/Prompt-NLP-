
import React, { useState } from 'react';
import { Vaccine } from '../types';
import { Calendar, Syringe, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface VaccinationsProps {
  theme: 'light' | 'dark';
}

const DEFAULT_VACCINES: Vaccine[] = [
  { id: 'v1', name: 'BCG', disease: 'Tuberculosis', recommendedAge: 'At Birth', status: 'pending' },
  { id: 'v2', name: 'Hep B', disease: 'Hepatitis B', recommendedAge: 'At Birth', status: 'pending' },
  { id: 'v3', name: 'Oral Polio (OPV-0)', disease: 'Polio', recommendedAge: 'At Birth', status: 'pending' },
  { id: 'v4', name: 'Pentavalent 1', disease: 'Diptheria, Pertussis, Tetanus, HepB, Hib', recommendedAge: '6 Weeks', status: 'pending' },
  { id: 'v5', name: 'Rotavirus 1', disease: 'Diarrhea', recommendedAge: '6 Weeks', status: 'pending' },
  { id: 'v6', name: 'PCV 1', disease: 'Pneumonia', recommendedAge: '6 Weeks', status: 'pending' },
  { id: 'v7', name: 'Polio (IPV-1)', disease: 'Polio', recommendedAge: '6 Weeks', status: 'pending' },
];

const Vaccinations: React.FC<VaccinationsProps> = ({ theme }) => {
  const [vaccines, setVaccines] = useState<Vaccine[]>(DEFAULT_VACCINES);

  const toggleVaccine = (id: string) => {
    setVaccines(prev => prev.map(v => v.id === id ? { ...v, status: v.status === 'taken' ? 'pending' : 'taken' } : v));
  };

  const takenCount = vaccines.filter(v => v.status === 'taken').length;
  const totalCount = vaccines.length;

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className={`text-3xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          Immunization
        </h1>
        <p className="text-slate-500 font-bold text-sm uppercase tracking-wider mt-1">
          Vital Protection • NuVision AI (Shishu-Sneh)
        </p>
      </header>

      {/* Impact Goal Banner */}
      <div className={`p-4 rounded-3xl border-2 border-blue-500/20 bg-blue-500/5 ${theme === 'dark' ? 'bg-blue-500/10' : ''}`}>
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-500/20">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className={`text-sm font-black ${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>Child Survival Goal</p>
            <p className="text-xs text-slate-500 font-bold leading-relaxed mt-1">
              Reducing infant mortality through timely vaccinations and vital "Polio Drops".
            </p>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className={`p-6 rounded-[2.5rem] border-2 flex items-center justify-between ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Summary</p>
          <h2 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{takenCount} of {totalCount} Shots</h2>
          <p className="text-xs text-slate-500 font-bold mt-1">Keep your baby protected!</p>
        </div>
        <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-600">
          <Syringe size={32} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className={`text-lg font-black ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>Vaccination List</h3>
          <div className="flex items-center gap-1.5">
            <AlertCircle size={14} className="text-amber-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase">Alerts Active</span>
          </div>
        </div>

        {vaccines.map((v, index) => (
          <motion.div
            key={v.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => toggleVaccine(v.id)}
            className={`group p-5 rounded-3xl border-2 cursor-pointer transition-all active:scale-[0.98] ${
              v.status === 'taken' 
                ? (theme === 'dark' ? 'bg-blue-950/20 border-blue-500/30' : 'bg-blue-50 border-blue-100') 
                : (theme === 'dark' ? 'bg-slate-900 border-slate-800 shadow-lg' : 'bg-white border-slate-100 shadow-sm')
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${
                v.status === 'taken' 
                ? 'bg-blue-500 border-blue-400 text-white' 
                : (theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500')
              }`}>
                {v.status === 'taken' ? <CheckCircle2 size={24} /> : (
                  <>
                    <span className="text-[8px] font-black uppercase mb-0.5">Due</span>
                    <span className="text-xs font-black leading-none">{v.recommendedAge.split(' ')[0]}</span>
                    <span className="text-[8px] font-bold">{v.recommendedAge.split(' ')[1] || ''}</span>
                  </>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className={`font-black tracking-tight ${v.status === 'taken' ? 'text-blue-600' : (theme === 'dark' ? 'text-white' : 'text-slate-800')}`}>
                    {v.name}
                  </h4>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                    v.status === 'taken' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {v.status === 'taken' ? 'Completed' : 'Upcoming'}
                  </span>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 mb-2">Prevents: {v.disease}</p>
                <div className="flex items-center gap-2">
                  <Calendar size={12} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-500">{v.recommendedAge}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Alert Info Section */}
      <div className={`p-6 rounded-[2.5rem] border-2 flex items-center gap-5 ${theme === 'dark' ? 'bg-amber-950/10 border-amber-900/30' : 'bg-amber-50 border-amber-100'}`}>
        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white flex-shrink-0">
          <AlertCircle size={24} />
        </div>
        <div>
          <h4 className="font-black text-sm text-amber-800">Next Appointment</h4>
          <p className="text-xs font-bold text-amber-600 mt-0.5">
            Your next visit for Pentavalent-1 is recommended at 6 weeks.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Vaccinations;
