import React from 'react';

interface CodelopyLogoProps {
  size?: number;
  className?: string;
}

/**
 * Codelopy Logo (Part 2.2):
 * An infinity symbol loop that incorporates the shape of an open curly brace `{`
 * on the left side and a closing curly brace `}` on the right side, drawn in a
 * single continuous path suggesting continuity and daily habit.
 */
export const CodelopyLogo: React.FC<CodelopyLogoProps> = ({ size = 36, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Codelopy infinity curly-brace loop logo"
    >
      <defs>
        <linearGradient id="codelopyLoopGrad" x1="4" y1="16" x2="60" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4A6FDC" />
          <stop offset="55%" stopColor="#4A6FDC" />
          <stop offset="100%" stopColor="#F6B93B" />
        </linearGradient>
      </defs>
      {/* Single continuous path: Infinity figure-8 with left `{` cusp and right `}` cusp */}
      <path
        d="M 32 32
           C 25 21, 14 16, 11 22
           C 9 26, 11 29, 6 32
           C 11 35, 9 38, 11 42
           C 14 48, 25 43, 32 32
           C 39 21, 50 16, 53 22
           C 55 26, 53 29, 58 32
           C 53 35, 55 38, 53 42
           C 50 48, 39 43, 32 32 Z"
        stroke="url(#codelopyLoopGrad)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
