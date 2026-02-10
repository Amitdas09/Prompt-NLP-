
import React, { useState, useRef } from 'react';
import { Camera, Upload, RefreshCw, CheckCircle2, AlertTriangle, Search, Info, Zap, ChevronRight, HelpCircle, Image as ImageIcon } from 'lucide-react';
import { analyzeFoodImage, analyzeLabelImage } from '../geminiService';
import { UserProfile, MealLog, FoodAnalysisResult, LabelAnalysisResult } from '../types';
import { GOAL_COLORS } from '../constants';

interface ScannerProps {
  profile: UserProfile;
  onLog: (log: MealLog) => void;
  theme: 'light' | 'dark';
}

const Scanner: React.FC<ScannerProps> = ({ profile, onLog, theme }) => {
  const [mode, setMode] = useState<'photo' | 'label'>('photo');
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [foodResult, setFoodResult] = useState<FoodAnalysisResult | null>(null);
  const [labelResult, setLabelResult] = useState<LabelAnalysisResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'upload' | 'result'>('upload');
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        resetState();
      };
      reader.readAsDataURL(file);
    }
    // Reset value so same file can be selected again
    e.target.value = '';
  };

  const resetState = () => {
    setFoodResult(null);
    setLabelResult(null);
    setAnswers({});
    setStep('upload');
  };

  const startAnalysis = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    try {
      const base64Data = image.split(',')[1];
      if (mode === 'photo') {
        const result = await analyzeFoodImage(base64Data, profile);
        setFoodResult(result);
        setStep('result');
      } else {
        const result = await analyzeLabelImage(base64Data);
        setLabelResult(result);
        setStep('result');
      }
    } catch (error) {
      console.error("Analysis failed", error);
      alert("Failed to analyze image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const refineAnalysis = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    try {
      const base64Data = image.split(',')[1];
      const result = await analyzeFoodImage(base64Data, profile, answers);
      setFoodResult(result);
    } catch (error) {
      console.error("Refinement failed", error);
      alert("Failed to refine analysis. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveMeal = () => {
    if (foodResult && image) {
      onLog({
        id: Date.now().toString(),
        timestamp: Date.now(),
        type: 'photo',
        data: foodResult,
        imageUrl: image
      });
      reset();
      alert("Meal saved to dashboard!");
    }
  };

  const reset = () => {
    setImage(null);
    resetState();
  };

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      {step === 'upload' && (
        <div className={`flex p-1.5 rounded-[2rem] border-2 shadow-sm transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <button
            onClick={() => { setMode('photo'); reset(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.5rem] font-black transition-all text-sm uppercase tracking-widest ${mode === 'photo' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20' : theme === 'dark' ? 'text-slate-500 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <Camera size={18} />
            <span>Photo</span>
          </button>
          <button
            onClick={() => { setMode('label'); reset(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[1.5rem] font-black transition-all text-sm uppercase tracking-widest ${mode === 'label' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20' : theme === 'dark' ? 'text-slate-500 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <Search size={18} />
            <span>Label</span>
          </button>
        </div>
      )}

      {!image ? (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={() => cameraInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-4 p-8 rounded-[2.5rem] border-4 border-dashed transition-all group active:scale-[0.98] ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800 hover:border-emerald-800 hover:bg-emerald-950/20' : 'bg-white border-slate-100 hover:border-emerald-300 hover:bg-emerald-50 shadow-xl shadow-slate-200/50'}`}
            >
              <div className={`p-5 rounded-3xl transition-transform duration-500 group-hover:scale-110 ${theme === 'dark' ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                <Camera size={40} />
              </div>
              <div className="text-center">
                <p className={`text-xl font-black tracking-tight ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Take Live Photo</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Open Device Camera</p>
              </div>
            </button>

            <button 
              onClick={() => galleryInputRef.current?.click()}
              className={`flex items-center gap-6 p-6 rounded-[2rem] border-2 transition-all group active:scale-[0.98] ${theme === 'dark' ? 'bg-slate-900 border-slate-800 hover:border-blue-900 hover:bg-blue-950/10' : 'bg-white border-slate-100 hover:border-blue-200 hover:bg-blue-50 shadow-lg shadow-slate-200/30'}`}
            >
              <div className={`p-4 rounded-2xl transition-transform duration-500 group-hover:rotate-6 ${theme === 'dark' ? 'bg-slate-800 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                <ImageIcon size={32} />
              </div>
              <div className="text-left">
                <p className={`text-lg font-black tracking-tight ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Upload from Device</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Choose from Gallery</p>
              </div>
            </button>
          </div>

          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            ref={cameraInputRef}
            onChange={handleImageUpload}
          />
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={galleryInputRef}
            onChange={handleImageUpload}
          />
          
          <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pt-4">
            Supports AI vision for food & labels
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className={`relative ${step === 'upload' ? 'aspect-square' : 'h-48'} w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-4 transition-all duration-700 ${theme === 'dark' ? 'border-slate-800' : 'border-white'}`}>
            <img src={image} alt="Preview" className="w-full h-full object-cover" />
            
            {step === 'upload' && !isAnalyzing && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-4">
                <button 
                  onClick={reset}
                  className="bg-white/90 p-4 rounded-full text-rose-600 hover:bg-white transition-all shadow-xl hover:scale-110 active:scale-95"
                >
                  <RefreshCw size={28} />
                </button>
                <button 
                  onClick={startAnalysis}
                  className="bg-emerald-600 px-8 py-4 rounded-[2rem] text-white font-black hover:bg-emerald-700 shadow-2xl flex items-center gap-3 animate-pulse active:scale-95 transform transition-all"
                >
                  <Zap size={24} />
                  Analyze {mode === 'photo' ? 'Food' : 'Label'}
                </button>
              </div>
            )}

            {isAnalyzing && (
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-6">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse"></div>
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500/20 border-t-emerald-500"></div>
                </div>
                <div className="text-center space-y-1">
                  <p className="font-black text-xl tracking-tight">Vision Engine Processing</p>
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Calculating macros...</p>
                </div>
              </div>
            )}
          </div>

          {step === 'result' && (
            <div className="animate-in slide-in-from-bottom-6 duration-700 space-y-4">
              {foodResult && (
                <div className={`p-8 rounded-[3rem] shadow-2xl border space-y-6 transition-colors ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className={`text-3xl font-black leading-tight tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{foodResult.itemName}</h3>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full border-2 uppercase tracking-[0.1em] ${GOAL_COLORS[foodResult.goalScore]}`}>
                          {foodResult.goalScore}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase tracking-wider">
                          <CheckCircle2 size={14} className="text-emerald-500" />
                          <span>AI Precision: {foodResult.honestyScore}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-black text-emerald-500 leading-none">{foodResult.calories}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">kcal</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Protein', value: foodResult.protein, color: 'bg-emerald-500' },
                      { label: 'Carbs', value: foodResult.carbs, color: 'bg-blue-500' },
                      { label: 'Fat', value: foodResult.fat, color: 'bg-amber-500' },
                      { label: 'Fiber', value: foodResult.fiber, color: 'bg-purple-500' },
                    ].map(m => (
                      <div key={m.label} className={`p-3 rounded-2xl text-center transition-colors border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                        <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1 tracking-widest">{m.label}</p>
                        <p className={`text-base font-black ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>{m.value}g</p>
                        <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                          <div className={`h-full ${m.color}`} style={{ width: '60%' }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {foodResult.needsClarification && foodResult.clarificationQuestions && (
                    <div className={`p-6 rounded-3xl border-2 border-dashed space-y-5 relative transition-all ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="absolute -top-3 left-6 bg-emerald-600 px-3 py-1 rounded-full flex items-center gap-2">
                        <HelpCircle size={12} className="text-white" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Optional Refinement</span>
                      </div>
                      
                      <div className="space-y-4 pt-2">
                        {foodResult.clarificationQuestions.map((q) => (
                          <div key={q.id} className="space-y-3">
                            <p className={`text-xs font-black tracking-tight ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{q.question}</p>
                            {q.options ? (
                              <div className="flex flex-wrap gap-2">
                                {q.options.map(opt => (
                                  <button
                                    key={opt}
                                    onClick={() => setAnswers({...answers, [q.id]: opt})}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${answers[q.id] === opt ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-500 hover:border-emerald-900' : 'bg-white border-slate-100 text-slate-500 hover:border-emerald-200'}`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <input
                                type="text"
                                placeholder="Details..."
                                className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-bold outline-none transition-all ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white focus:border-emerald-600' : 'bg-white border-slate-100 text-slate-900 focus:border-emerald-500'}`}
                                onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {Object.keys(answers).length > 0 && (
                        <button 
                          onClick={refineAnalysis}
                          className="w-full bg-emerald-600 text-white text-xs font-black py-3 rounded-[1.25rem] hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/20"
                        >
                          <RefreshCw size={14} className={isAnalyzing ? 'animate-spin' : ''} />
                          Re-Analyze with Details
                        </button>
                      )}
                    </div>
                  )}

                  <div className={`p-5 rounded-3xl border-2 transition-colors ${theme === 'dark' ? 'bg-emerald-950/20 border-emerald-900/30' : 'bg-emerald-50 border-emerald-100'}`}>
                    <p className={`text-xs font-black uppercase mb-4 flex items-center gap-2 tracking-[0.15em] ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-800'}`}>
                      <Zap size={16} className="text-emerald-500 fill-emerald-500" /> Goal Suitability
                    </p>
                    <ul className="space-y-3">
                      {foodResult.suggestions.map((s, idx) => (
                        <li key={idx} className={`text-sm flex items-start gap-3 leading-relaxed font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-emerald-900/80'}`}>
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button 
                      onClick={reset}
                      className={`flex-1 font-black text-sm uppercase tracking-widest py-4 rounded-3xl transition-all ${theme === 'dark' ? 'bg-slate-800 text-slate-500 hover:bg-slate-700' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                    >
                      Discard
                    </button>
                    <button 
                      onClick={handleSaveMeal}
                      className="flex-[2] bg-slate-900 text-white font-black text-sm uppercase tracking-widest py-4 rounded-[2rem] hover:bg-emerald-600 shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95"
                    >
                      <CheckCircle2 size={20} />
                      Log This Meal
                    </button>
                  </div>
                </div>
              )}

              {labelResult && (
                <div className={`p-8 rounded-[3rem] shadow-2xl border space-y-6 transition-colors ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <div className="flex justify-between items-center">
                    <h3 className={`text-2xl font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Ingredient Scanner</h3>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border-2 ${labelResult.isUltraProcessed ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                      {labelResult.isUltraProcessed ? 'Ultra Processed' : 'Clean Source'}
                    </div>
                  </div>

                  <div className={`flex items-center gap-6 py-6 border-y-2 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-50'}`}>
                    <div className="text-center flex-1">
                      <p className={`text-5xl font-black ${labelResult.healthScore > 70 ? 'text-emerald-500' : labelResult.healthScore > 40 ? 'text-amber-500' : 'text-rose-500'}`}>{labelResult.healthScore}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Trust Score</p>
                    </div>
                  </div>

                  {labelResult.riskFlags.length > 0 && (
                    <div className="bg-rose-50 p-6 rounded-3xl border-2 border-rose-100">
                      <p className="text-xs font-black text-rose-800 uppercase mb-4 flex items-center gap-2 tracking-widest">
                        <AlertTriangle size={18} /> Found Hidden Risks
                      </p>
                      <ul className="space-y-2">
                        {labelResult.riskFlags.map((r, idx) => (
                          <li key={idx} className="text-sm text-rose-700 flex items-start gap-3 font-black">
                            <div className="mt-1.5 w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-4">
                    <p className={`text-sm font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Healthier Alternatives</p>
                    <div className="flex flex-wrap gap-2">
                      {labelResult.alternatives.map((a, idx) => (
                        <span key={idx} className={`text-[10px] font-black uppercase px-4 py-2 rounded-2xl border-2 transition-colors ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={reset}
                    className="w-full bg-slate-900 text-white font-black py-5 rounded-[2rem] hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95"
                  >
                    <Search size={24} />
                    New Scan
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Scanner;
