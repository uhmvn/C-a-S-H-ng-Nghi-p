import React from 'react';
import { Grid3x3, List, Table2, Box } from 'lucide-react';

export default function ViewModeToggle({ viewMode, onChange }) {
  const modes = [
    { value: 'grid', icon: Grid3x3, label: 'Grid' },
    { value: 'list', icon: List, label: 'List' },
    { value: 'table', icon: Table2, label: 'Table' },
    { value: '3d', icon: Box, label: '3D Cards' }
  ];

  return (
    <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
      {modes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            viewMode === value
              ? 'bg-white shadow-sm text-indigo-600 font-medium'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          title={label}
        >
          <Icon className="w-5 h-5" />
          <span className="hidden sm:inline text-sm">{label}</span>
        </button>
      ))}
    </div>
  );
}