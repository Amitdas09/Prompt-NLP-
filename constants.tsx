
import React from 'react';
import { Apple, Scan, Target, LineChart, User } from 'lucide-react';

export const APP_THEME = {
  primary: 'emerald-600',
  secondary: 'emerald-100',
  accent: 'orange-500',
  background: 'slate-50'
};

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Home', icon: <Apple size={24} /> },
  { id: 'scanner', label: 'Scan', icon: <Scan size={24} /> },
  { id: 'coach', label: 'Coach', icon: <LineChart size={24} /> },
  { id: 'profile', label: 'Profile', icon: <User size={24} /> },
];

export const GOAL_COLORS = {
  Good: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  Moderate: 'text-amber-600 bg-amber-50 border-amber-200',
  Bad: 'text-rose-600 bg-rose-50 border-rose-200'
};
