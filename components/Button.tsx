import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "px-6 py-2 rounded-sm border-2 font-bold transform transition-transform active:scale-95 shadow-md relative overflow-hidden group";
  
  const variants = {
    primary: "bg-blue-600 border-blue-800 text-white hover:bg-blue-500 shadow-blue-900/20",
    secondary: "bg-white border-slate-400 text-slate-700 hover:bg-slate-50 shadow-slate-900/10",
    danger: "bg-red-500 border-red-700 text-white hover:bg-red-400 shadow-red-900/20",
  };

  // SVG scribble effect overlay
  const Scribble = () => (
    <svg className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity" viewBox="0 0 100 40" preserveAspectRatio="none">
      <path d="M0,20 Q10,0 20,20 T40,20 T60,20 T80,20 T100,20" stroke="currentColor" strokeWidth="4" fill="none" />
      <path d="M0,30 Q10,10 20,30 T40,30 T60,30 T80,30 T100,30" stroke="currentColor" strokeWidth="4" fill="none" />
    </svg>
  );

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      <Scribble />
      <span className="relative z-10 text-xl">{children}</span>
    </button>
  );
};