
import React, { useState } from 'react';
import { UserProfile, UserGoal, ActivityLevel } from '../types';

interface ProfileProps {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
  theme: 'light' | 'dark';
}

const Profile: React.FC<ProfileProps> = ({ profile, onUpdate, theme }) => {
  const [formData, setFormData] = useState(profile);

  const calculateTargets = (data: typeof profile) => {
    let bmr = 10 * data.weight + 6.25 * data.height - 5 * data.age;
    bmr = data.gender === 'male' ? bmr + 5 : bmr - 161;

    const multipliers = {
      [ActivityLevel.SEDENTARY]: 1.2,
      [ActivityLevel.LIGHT]: 1.375,
      [ActivityLevel.MODERATE]: 1.55,
      [ActivityLevel.VERY]: 1.725,
      [ActivityLevel.EXTREME]: 1.9
    };

    let tdee = bmr * multipliers[data.activityLevel];

    if (data.goal === UserGoal.FAT_LOSS) tdee -= 500;
    if (data.goal === UserGoal.MUSCLE_GAIN || data.goal === UserGoal.WEIGHT_GAIN) tdee += 300;

    const protein = data.weight * 2;
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

  const handleSave = () => {
    const targets = calculateTargets(formData);
    onUpdate({ ...formData, ...targets });
    alert("Profile updated successfully!");
  };

  return (
    <div className="space-y-6">
      <div className={`flex items-center gap-4 p-6 rounded-3xl shadow-sm border transition-colors ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center font-black text-2xl uppercase shadow-inner transition-colors ${theme === 'dark' ? 'bg-emerald-950 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
          {profile.name[0]}
        </div>
        <div>
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{profile.name}</h2>
          <p className="text-slate-500">{profile.goal}</p>
        </div>
      </div>

      <div className={`p-6 rounded-3xl shadow-sm border space-y-4 transition-colors ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <h3 className={`font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Body Stats</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Weight (kg)</label>
            <input
              type="number"
              className={`w-full px-4 py-2 rounded-xl border transition-colors outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Height (cm)</label>
            <input
              type="number"
              className={`w-full px-4 py-2 rounded-xl border transition-colors outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Current Goal</label>
          <select
            className={`w-full px-4 py-2 rounded-xl border transition-colors outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value as UserGoal })}
          >
            {Object.values(UserGoal).map((g) => (
              <option key={g} value={g} className={theme === 'dark' ? 'bg-slate-900' : ''}>{g}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Activity Level</label>
          <select
            className={`w-full px-4 py-2 rounded-xl border transition-colors outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
            value={formData.activityLevel}
            onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value as ActivityLevel })}
          >
            {Object.values(ActivityLevel).map((a) => (
              <option key={a} value={a} className={theme === 'dark' ? 'bg-slate-900' : ''}>{a}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-500 transition-all mt-4 shadow-lg shadow-emerald-600/20"
        >
          Save Changes
        </button>
      </div>

      <div className={`p-6 rounded-3xl border transition-colors ${theme === 'dark' ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-emerald-50 border-emerald-100'}`}>
        <h3 className={`font-bold mb-3 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-900'}`}>Daily Target Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Calories', value: `${profile.dailyCalorieTarget} kcal` },
            { label: 'Protein', value: `${profile.macroTargets.protein}g` },
            { label: 'Carbs', value: `${profile.macroTargets.carbs}g` },
            { label: 'Fat', value: `${profile.macroTargets.fat}g` },
          ].map((stat) => (
            <div key={stat.label} className={`p-3 rounded-2xl border transition-colors ${theme === 'dark' ? 'bg-slate-900/80 border-emerald-900/30' : 'bg-white border-emerald-100'}`}>
              <p className="text-[10px] font-bold text-slate-500 uppercase">{stat.label}</p>
              <p className={`text-xl font-black ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
