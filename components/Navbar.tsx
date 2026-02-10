
import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../constants';

interface NavbarProps {
  theme?: 'light' | 'dark';
}

const MobileNavbar: React.FC<NavbarProps> = ({ theme }) => {
  return (
    <nav className={`fixed bottom-0 left-0 right-0 border-t flex justify-around items-center h-16 z-50 sm:px-10 transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.id}
          to={item.id === 'dashboard' ? '/' : `/${item.id}`}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              isActive 
                ? 'text-emerald-500' 
                : theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
            }`
          }
        >
          {item.icon}
          <span className="text-[10px] mt-1 font-medium">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default MobileNavbar;
