import React from 'react';

const departmentColors = {
  'KSMK': 'bg-blue-100 text-blue-800 border border-blue-300',
  'KSMF': 'bg-purple-100 text-purple-800 border border-purple-300',
  'KSMG': 'bg-green-100 text-green-800 border border-green-300',
  'KSMM': 'bg-amber-100 text-amber-800 border border-amber-300',
  'KSMH': 'bg-rose-100 text-rose-800 border border-rose-300',
  'KSMP': 'bg-indigo-100 text-indigo-800 border border-indigo-300',
  'KSMQ': 'bg-teal-100 text-teal-800 border border-teal-300',
  'KSMR': 'bg-orange-100 text-orange-800 border border-orange-300',
  'KSMS': 'bg-cyan-100 text-cyan-800 border border-cyan-300',
  'KSMT': 'bg-emerald-100 text-emerald-800 border border-emerald-300',
  'KSMU': 'bg-violet-100 text-violet-800 border border-violet-300',
  'KSMV': 'bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-300',
  'KSMW': 'bg-sky-100 text-sky-800 border border-sky-300',
  'KSMX': 'bg-lime-100 text-lime-800 border border-lime-300',
  'KSMY': 'bg-pink-100 text-pink-800 border border-pink-300',
  'KSMZ': 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  'default': 'bg-gray-100 text-gray-800 border border-gray-300'
};

export default function DepartmentTag({ code }) {
  const colorClass = departmentColors[code] || departmentColors.default;
  
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded ${colorClass} mr-1.5`}>
      {code}
    </span>
  );
} 
