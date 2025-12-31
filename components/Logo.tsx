
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  hideText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', hideText = false }) => {
  const iconSize = size === 'sm' ? 'h-8' : size === 'lg' ? 'h-24' : 'h-16';
  const textSize = size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-5xl' : 'text-3xl';

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <svg className={`${iconSize} w-auto`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
        {/* Bank Roof */}
        <path d="M50 15L15 35H85L50 15Z" stroke="url(#logoGrad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {/* Bank Columns Area */}
        <path d="M18 35V80H60" stroke="url(#logoGrad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M25 45V70M38 45V70M51 45V70" stroke="url(#logoGrad)" strokeWidth="4" strokeLinecap="round" />
        {/* Dollar Sign */}
        <path d="M75 55C82 55 85 60 85 65C85 70 82 75 75 75C68 75 65 70 65 65M75 55C68 55 65 50 65 45C65 40 68 35 75 35C82 35 85 40 85 45M75 30V80" stroke="url(#logoGrad)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {!hideText && (
        <div className="flex flex-col leading-none">
          <span className={`font-bold text-white ${textSize}`}>Ultra</span>
          <span className={`font-light text-slate-300 ${textSize}`}>trade</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
