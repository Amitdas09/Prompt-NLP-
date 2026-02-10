
import React, { useState } from 'react';
import { UserProfile, UserGoal, ActivityLevel } from '../types';
import { Zap, ChevronRight } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  theme: 'light' | 'dark';
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, theme }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: 25,
    weight: 70,
    height: 175,
    gender: 'male' as const,
    goal: UserGoal.MAINTENANCE,
    activityLevel: ActivityLevel.MODERATE
  });

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
          <p className="text-slate-500 font-medium">Empowering your health with Computer Vision</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 space-y-6">
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

        <p className="text-center text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
          Vision Intelligence Engine v1.0
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
