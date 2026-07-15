import React from 'react';

export default function Button({ children, onClick, variant = 'primary', className = '' }) {
  const baseStyle = "px-4 py-2 rounded text-sm font-medium transition-colors focus:outline-none";
  const variants = {
    primary: "bg-violet-600 hover:bg-violet-700 text-white",
    secondary: "bg-zinc-800 hover:bg-zinc-700 text-zinc-200",
    danger: "bg-red-600 hover:bg-red-700 text-white"
  };

  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}
