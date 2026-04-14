
import React, { useState, useRef, useMemo } from 'react';
import { Camera, Upload, RefreshCw, CheckCircle2, AlertTriangle, Search, Info, Zap, ChevronRight, HelpCircle, Image as ImageIcon, History as HistoryIcon, Loader2, Calendar } from 'lucide-react';
import { analyzeFoodImage, analyzeLabelImage } from '../geminiService';
import { UserProfile, MealLog, FoodAnalysisResult, LabelAnalysisResult } from '../types';
import { GOAL_COLORS } from '../constants';
import { uploadImage } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface ScannerProps {
  profile: UserProfile;
  logs: MealLog[];
  onLog: (log: MealLog) => void;
  theme: 'light' | 'dark';
  user: User | null;
}

const Scanner: React.FC<ScannerProps> = ({ profile, logs, onLog, theme, user }) => {
  const [mode, setMode] = useState<'photo' | 'label'>('photo');
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [foodResult, setFoodResult] = useState<FoodAnalysisResult | null>(null);
  const [labelResult, setLabelResult] = useState<LabelAnalysisResult | null>(null);
  const [initialDescription, setInitialDescription] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'upload' | 'result'>('upload');
  const [showPastMeals, setShowPastMeals] = useState(false);
  const [isPastDateMode, setIsPastDateMode] = useState(false);
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [customTime, setCustomTime] = useState(new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }));
  const [isRestoring, setIsRestoring] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // State restoration for mobile WebViews that reload after camera use
  React.useEffect(() => {
    const restoreState = async () => {
      try {
        const savedImage = sessionStorage.getItem('scanner_pending_image');
        const savedMode = sessionStorage.getItem('scanner_pending_mode') as 'photo' | 'label';
        const savedStep = sessionStorage.getItem('scanner_pending_step') as 'upload' | 'result';
        const savedDescription = sessionStorage.getItem('scanner_pending_description');
        
        if (savedImage) {
          console.log("Restoring scanner state from session storage...");
          setIsRestoring(true);
          setImage(savedImage);
          if (savedMode) setMode(savedMode);
          if (savedStep) setStep(savedStep);
          if (savedDescription) setInitialDescription(savedDescription);
          
          // If we were in result step, we might need to restore results too
          const savedFoodResult = sessionStorage.getItem('scanner_pending_food_result');
          const savedLabelResult = sessionStorage.getItem('scanner_pending_label_result');
          if (savedFoodResult && savedFoodResult !== 'undefined') {
            try {
              setFoodResult(JSON.parse(savedFoodResult));
            } catch (e) {
              console.error("Failed to parse saved food result:", e);
            }
          }
          if (savedLabelResult && savedLabelResult !== 'undefined') {
            try {
              setLabelResult(JSON.parse(savedLabelResult));
            } catch (e) {
              console.error("Failed to parse saved label result:", e);
            }
          }
          
          setIsRestoring(false);
        }
      } catch (err) {
        console.error("Error during state restoration:", err);
        setIsRestoring(false);
      }
    };
    restoreState();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  React.useEffect(() => {
    if (image) {
      try {
        sessionStorage.setItem('scanner_pending_image', image);
        sessionStorage.setItem('scanner_pending_mode', mode);
        sessionStorage.setItem('scanner_pending_step', step);
        sessionStorage.setItem('scanner_pending_description', initialDescription);
        if (foodResult) sessionStorage.setItem('scanner_pending_food_result', JSON.stringify(foodResult));
        if (labelResult) sessionStorage.setItem('scanner_pending_label_result', JSON.stringify(labelResult));
      } catch (e) {
        console.warn("Failed to save state to session storage (likely size limit):", e);
      }
    } else {
      sessionStorage.removeItem('scanner_pending_image');
      sessionStorage.removeItem('scanner_pending_mode');
      sessionStorage.removeItem('scanner_pending_step');
      sessionStorage.removeItem('scanner_pending_description');
      sessionStorage.removeItem('scanner_pending_food_result');
      sessionStorage.removeItem('scanner_pending_label_result');
    }
  }, [image, mode, step, foodResult, labelResult]);

  // Handle camera stream attachment when video element mounts
  React.useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      console.log("Attaching stream to video element");
      videoRef.current.srcObject = streamRef.current;
      // Explicitly call play to ensure it starts
      videoRef.current.play().catch(err => {
        console.error("Error playing video:", err);
      });
    }
  }, [isCameraActive]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const msg = "Camera API not supported in this browser/context. Falling back to native camera input.";
      console.warn(msg);
      setCameraError("Your browser or app doesn't support live camera. Using native camera instead.");
      setTimeout(() => cameraInputRef.current?.click(), 2000);
      return;
    }

    try {
      // First attempt: Preferred environment camera with ideal resolution
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false 
      });
      streamRef.current = stream;
      setIsCameraActive(true);
    } catch (err) {
      console.warn("First camera attempt failed, trying basic constraints:", err);
      try {
        // Second attempt: Any camera, no specific resolution
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: false 
        });
        streamRef.current = stream;
        setIsCameraActive(true);
      } catch (err2: any) {
        console.error("All camera attempts failed:", err2);
        let errorMsg = "Could not access camera.";
        if (err2.name === 'NotAllowedError' || err2.name === 'PermissionDeniedError') {
          errorMsg = "Camera permission denied. Please check your app/browser settings.";
        } else if (err2.name === 'NotFoundError' || err2.name === 'DevicesNotFoundError') {
          errorMsg = "No camera found on this device.";
        } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          errorMsg = "Camera requires a secure (HTTPS) connection.";
        }
        
        setCameraError(errorMsg);
        // Fallback to file input if getUserMedia fails
        setTimeout(() => {
          if (!isCameraActive) cameraInputRef.current?.click();
        }, 3000);
      }
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      
      // Use video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Resize if necessary (using the same logic as handleImageUpload)
        const maxDim = 800;
        let width = canvas.width;
        let height = canvas.height;
        
        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
        }
        
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = width;
        finalCanvas.height = height;
        const finalCtx = finalCanvas.getContext('2d');
        if (finalCtx) {
          finalCtx.drawImage(canvas, 0, 0, width, height);
          const dataUrl = finalCanvas.toDataURL('image/jpeg', 0.8);
          setImage(dataUrl);
          resetState();
          stopCamera();
        }
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("Image file selected:", file?.name, file?.type, file?.size);
    
    if (file) {
      setIsAnalyzing(true); // Show loading while processing image
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        
        img.onload = () => {
          console.log("Image loaded into memory, dimensions:", img.width, "x", img.height);
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimension 800px for better stability in mobile WebViews
          const maxDim = 800;
          if (width > height) {
            if (width > maxDim) {
              height *= maxDim / width;
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width *= maxDim / height;
              height = maxDim;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            try {
              const resizedImage = canvas.toDataURL('image/jpeg', 0.8);
              console.log("Image resized and converted to data URL. Length:", resizedImage.length);
              setImage(resizedImage);
              resetState();
            } catch (err) {
              console.error("Canvas toDataURL failed:", err);
              alert("Failed to process image. The photo might be too large or your device memory is low.");
            }
          }
          setIsAnalyzing(false);
        };

        img.onerror = (err) => {
          console.error("Image object load failed:", err);
          setIsAnalyzing(false);
          alert("Failed to load the captured photo. Please try again.");
        };

        img.src = event.target?.result as string;
      };

      reader.onerror = (err) => {
        console.error("FileReader failed:", err);
        setIsAnalyzing(false);
        alert("Failed to read the photo file. Please check app permissions.");
      };

      reader.readAsDataURL(file);
    } else {
      console.log("No file was selected or capture was cancelled.");
      setIsAnalyzing(false);
    }
    
    // Reset value so same file can be selected again
    e.target.value = '';
  };

  const resetState = () => {
    setFoodResult(null);
    setLabelResult(null);
    setInitialDescription('');
    setAnswers({});
    setStep('upload');
  };

  const startAnalysis = async () => {
    if (!image) {
      console.warn("startAnalysis called but no image is present.");
      return;
    }
    setIsAnalyzing(true);
    console.log("Starting analysis for mode:", mode);
    try {
      const base64Data = image.split(',')[1];
      if (mode === 'photo') {
        const result = await analyzeFoodImage(base64Data, profile, undefined, undefined);
        console.log("Food analysis successful:", result.itemName);
        setFoodResult(result);
        setStep('result');
      } else {
        const result = await analyzeLabelImage(base64Data);
        console.log("Label analysis successful");
        setLabelResult(result);
        setStep('result');
      }
    } catch (error: any) {
      console.error("Analysis failed:", error);
      const errorMsg = error?.message || "";
      if (errorMsg.includes("API_KEY_INVALID") || errorMsg.includes("API key not found")) {
        alert("Gemini API Key is missing or invalid. Please check your configuration.");
      } else {
        alert("Failed to analyze image. Please check your internet connection and try again.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const refineAnalysis = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    try {
      const base64Data = image.split(',')[1];
      const result = await analyzeFoodImage(base64Data, profile, answers, initialDescription);
      setFoodResult(result);
    } catch (error: any) {
      console.error("Refinement failed", error);
      const errorMsg = error?.message || "";
      if (errorMsg.includes("API_KEY_INVALID") || errorMsg.includes("API key not found")) {
        alert("Gemini API Key is missing or invalid. Please check your configuration.");
      } else {
        alert("Failed to refine analysis. Please try again.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleSaveMeal = async () => {
    if (foodResult && image) {
      console.log("Saving meal:", foodResult.itemName);
      let finalImageUrl = image;
      
      if (user) {
        setIsUploading(true);
        try {
          console.log("Uploading image to cloud storage...");
          const uploadedUrl = await uploadImage(image, user.id);
          if (uploadedUrl) {
            console.log("Image uploaded successfully:", uploadedUrl);
            finalImageUrl = uploadedUrl;
          } else {
            console.warn("Image upload returned null, using local data URL.");
          }
        } catch (uploadErr) {
          console.error("Image upload failed:", uploadErr);
          // Continue with local image if upload fails
        } finally {
          setIsUploading(false);
        }
      }

      onLog({
        id: generateId(),
        timestamp: isPastDateMode ? new Date(`${customDate}T${customTime}`).getTime() : Date.now(),
        type: 'photo',
        data: foodResult,
        imageUrl: finalImageUrl
      });
      reset();
      alert("Meal saved to dashboard!");
    }
  };

  const reset = () => {
    setImage(null);
    setIsPastDateMode(false);
    resetState();
  };

  const pastMeals = useMemo(() => {
    const uniqueMeals: Record<string, MealLog> = {};
    logs.forEach(log => {
      if (!uniqueMeals[log.data.itemName]) {
        uniqueMeals[log.data.itemName] = log;
      }
    });
    return Object.values(uniqueMeals).slice(0, 5);
  }, [logs]);

  const handleReLog = (meal: MealLog) => {
    onLog({
      ...meal,
      id: generateId(),
      timestamp: Date.now()
    });
    alert(`Logged ${meal.data.itemName} again!`);
  };

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      {step === 'upload' && (
        <div className="space-y-4">
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

            {pastMeals.length > 0 && mode === 'photo' && (
              <div className={`p-4 rounded-[2rem] border-2 transition-all ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <button 
                  onClick={() => setShowPastMeals(!showPastMeals)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                      <HistoryIcon size={18} />
                    </div>
                    <div>
                      <p className={`text-sm font-black tracking-tight ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Quick Re-Log</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recent meals from this week</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className={`text-slate-400 transition-transform ${showPastMeals ? 'rotate-90' : ''}`} />
                </button>

                {showPastMeals && (
                  <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2">
                    {pastMeals.map(meal => (
                      <button
                        key={meal.id}
                        onClick={() => handleReLog(meal)}
                        className={`w-full p-3 rounded-2xl border flex items-center gap-3 transition-all active:scale-[0.98] ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:border-emerald-900' : 'bg-slate-50 border-slate-100 hover:border-emerald-200'}`}
                      >
                        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-white dark:border-slate-700">
                          <img src={meal.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`text-xs font-black truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{meal.data.itemName}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{meal.data.calories} kcal</p>
                        </div>
                        <Zap size={14} className="text-emerald-500" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className={`p-4 rounded-[2rem] border-2 transition-all ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <button 
                onClick={() => setIsPastDateMode(!isPastDateMode)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className={`text-sm font-black tracking-tight ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Log for Past Date</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select custom date & time</p>
                  </div>
                </div>
                <div className={`w-10 h-5 rounded-full transition-colors relative ${isPastDateMode ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isPastDateMode ? 'left-6' : 'left-1'}`} />
                </div>
              </button>

              {isPastDateMode && (
                <div className="mt-4 grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                    <input 
                      type="date" 
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border-2 text-xs font-bold outline-none transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-emerald-500'}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Time</label>
                    <input 
                      type="time" 
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border-2 text-xs font-bold outline-none transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-emerald-500'}`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      {!image ? (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
          {isAnalyzing && (
            <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                <p className="text-sm font-black tracking-tight dark:text-white">Processing Image...</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4">
            {isCameraActive ? (
              <div className="relative w-full aspect-square rounded-[2.5rem] overflow-hidden bg-black border-4 border-emerald-500 shadow-2xl animate-in zoom-in-95">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-8 left-0 right-0 flex flex-col gap-3 px-6">
                  <div className="flex gap-4">
                    <button 
                      onClick={stopCamera}
                      className="flex-1 bg-white/20 backdrop-blur-md text-white font-black py-4 rounded-2xl border border-white/30 hover:bg-white/30 transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={capturePhoto}
                      className="flex-[2] bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-600/40 flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all active:scale-95"
                    >
                      <div className="w-4 h-4 rounded-full bg-white animate-pulse" />
                      Snap Photo
                    </button>
                  </div>
                  <button 
                    onClick={() => { stopCamera(); cameraInputRef.current?.click(); }}
                    className="w-full bg-slate-900/40 backdrop-blur-md text-white/80 text-[10px] font-black uppercase tracking-widest py-2 rounded-xl border border-white/10 hover:bg-slate-900/60 transition-all"
                  >
                    Trouble with live preview? Try Native Camera
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={startCamera}
                className={`flex flex-col items-center justify-center gap-4 p-8 rounded-[2.5rem] border-4 border-dashed transition-all group active:scale-[0.98] ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800 hover:border-emerald-800 hover:bg-emerald-950/20' : 'bg-white border-slate-100 hover:border-emerald-300 hover:bg-emerald-50 shadow-xl shadow-slate-200/50'}`}
              >
                <div className={`p-5 rounded-3xl transition-transform duration-500 group-hover:scale-110 ${theme === 'dark' ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                  <Camera size={40} />
                </div>
                <div className="text-center">
                  <p className={`text-xl font-black tracking-tight ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Take Live Photo</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Open Device Camera</p>
                </div>
                {cameraError && (
                  <div className="mt-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 animate-in fade-in slide-in-from-top-1">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-wider text-center leading-relaxed">
                      {cameraError}
                    </p>
                  </div>
                )}
              </button>
            )}

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

            <button 
              onClick={() => cameraInputRef.current?.click()}
              className={`flex items-center gap-6 p-6 rounded-[2rem] border-2 transition-all group active:scale-[0.98] ${theme === 'dark' ? 'bg-slate-900 border-slate-800 hover:border-amber-900 hover:bg-amber-950/10' : 'bg-white border-slate-100 hover:border-amber-200 hover:bg-amber-50 shadow-lg shadow-slate-200/30'}`}
            >
              <div className={`p-4 rounded-2xl transition-transform duration-500 group-hover:-rotate-6 ${theme === 'dark' ? 'bg-slate-800 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                <Camera size={32} />
              </div>
              <div className="text-left">
                <p className={`text-lg font-black tracking-tight ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Native Camera</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Use System Camera App</p>
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
          
          <div className={`mt-8 p-6 rounded-[2rem] border-2 border-dashed transition-all ${theme === 'dark' ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 mt-1">
                <HelpCircle size={20} />
              </div>
              <div className="space-y-2">
                <p className={`text-sm font-black tracking-tight ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Camera Troubleshooting</p>
                <p className="text-xs font-bold text-slate-500 leading-relaxed">
                  If live photo isn't working, ensure you've granted camera permissions in your device settings. 
                  Live preview also requires a secure HTTPS connection. 
                  <br /><br />
                  <span className="text-amber-500 font-black">Pro Tip:</span> Use the <span className="font-black italic">"Native Camera"</span> option for maximum compatibility with your device.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {isRestoring && (
            <div className="flex items-center justify-center gap-2 py-2 animate-pulse">
              <Loader2 size={14} className="animate-spin text-emerald-500" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Restoring Session...</span>
            </div>
          )}
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

          {step === 'upload' && image && !isAnalyzing && (
            <div className="p-6">
              <button 
                onClick={startAnalysis}
                className="w-full bg-emerald-600 py-4 rounded-2xl text-white font-black hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
              >
                <Zap size={20} />
                Analyze {mode === 'photo' ? 'Food' : 'Label'}
              </button>
            </div>
          )}

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

                  {foodResult.ingredientsSummary && (
                    <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                      <p className={`text-xs font-bold leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        <span className="font-black text-emerald-500 mr-1">Detected:</span>
                        {foodResult.ingredientsSummary}
                      </p>
                    </div>
                  )}

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

                  {foodResult.refinementSuggestion && (
                    <div className={`p-5 rounded-3xl border-2 transition-colors ${theme === 'dark' ? 'bg-blue-950/20 border-blue-900/30' : 'bg-blue-50 border-blue-100'}`}>
                      <p className={`text-xs font-black uppercase mb-2 flex items-center gap-2 tracking-[0.15em] ${theme === 'dark' ? 'text-blue-400' : 'text-blue-800'}`}>
                        <Info size={16} className="text-blue-500" /> Accuracy Tip
                      </p>
                      <p className={`text-sm font-bold leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-blue-900/80'}`}>
                        {foodResult.refinementSuggestion}
                      </p>
                    </div>
                  )}

                  {(foodResult.needsClarification || true) && (
                    <div className={`p-6 rounded-3xl border-2 border-dashed space-y-5 relative transition-all ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="absolute -top-3 left-6 bg-emerald-600 px-3 py-1 rounded-full flex items-center gap-2">
                        <HelpCircle size={12} className="text-white" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Refine Analysis</span>
                      </div>
                      
                      <div className="space-y-4 pt-2">
                        <div className="space-y-3">
                          <p className={`text-xs font-black tracking-tight ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Correct or Add Details</p>
                          <textarea
                            value={initialDescription}
                            onChange={(e) => setInitialDescription(e.target.value)}
                            placeholder="If the scan is wrong, tell me what it is here..."
                            className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-bold outline-none transition-all min-h-[80px] resize-none ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white focus:border-emerald-600' : 'bg-white border-slate-100 text-slate-900 focus:border-emerald-500'}`}
                          />
                        </div>

                        {foodResult.clarificationQuestions && foodResult.clarificationQuestions.map((q) => (
                          <div key={q.id} className="space-y-3">
                            <p className={`text-xs font-black tracking-tight ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{q.question}</p>
                            {q.options && (
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
                            )}
                            <input
                              type="text"
                              placeholder={q.options ? "Or enter custom amount..." : "Details..."}
                              className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-bold outline-none transition-all ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white focus:border-emerald-600' : 'bg-white border-slate-100 text-slate-900 focus:border-emerald-500'}`}
                              value={answers[q.id] || ''}
                              onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                            />
                          </div>
                        ))}
                      </div>
                      
                      <button 
                        onClick={refineAnalysis}
                        className="w-full bg-emerald-600 text-white text-xs font-black py-3 rounded-[1.25rem] hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/20"
                      >
                        <RefreshCw size={14} className={isAnalyzing ? 'animate-spin' : ''} />
                        Re-Analyze with Details
                      </button>
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
                      disabled={isUploading}
                      className={`flex-[2] bg-slate-900 text-white font-black text-sm uppercase tracking-widest py-4 rounded-[2rem] hover:bg-emerald-600 shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 ${isUploading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={20} />
                          Log This Meal
                        </>
                      )}
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
