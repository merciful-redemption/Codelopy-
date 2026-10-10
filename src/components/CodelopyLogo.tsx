import React from 'react';

interface CodelopyLogoProps {
  size?: number;
  className?: string;
}

/**
 * Loopwright v4.0 Normative Loop Mark (Part 2.2):
 * A continuous infinity-shaped stroke drawn in one line (#4C5BD4 Indigo),
 * with a single amber cursor dot (#FF9F43 Ember) at the crossing point (100, 60).
 */
export const CodelopyLogo: React.FC<CodelopyLogoProps> = ({ size = 40, className = '' }) => {
  const height = Math.round(size * 0.6);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={height}
      viewBox="0 0 200 120"
      role="img"
      aria-label="Loopwright mark"
      className={`shrink-0 select-none ${className}`}
    >
      <path
        d="M100 60 C122 22 178 22 178 60 C178 98 122 98 100 60 C78 22 22 22 22 60 C22 98 78 98 100 60 Z"
        fill="none"
        stroke="#4C5BD4"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="100" cy="60" r="8" fill="#FF9F43" />
    </svg>
  );
};
