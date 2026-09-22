import React from 'react';

interface CeyteqLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  variant?: 'light' | 'dark';
}

export const CeyteqLogo: React.FC<CeyteqLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  variant = 'dark',
}) => {
  const heights = {
    sm: 'h-7',
    md: 'h-10',
    lg: 'h-14',
    xl: 'h-20',
  };

  const isDark = variant === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#0B1B3D';
  const subtitleColor = isDark ? '#94A3B8' : '#64748B';

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <svg
        viewBox="0 0 380 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${heights[size]} w-auto shrink-0`}
      >
        {/* CEYTEQ Typography */}
        <g id="brand-text">
          {/* CEY in vibrant Logo Blue */}
          <text
            x="10"
            y="72"
            fontFamily="Inter, system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize="56"
            letterSpacing="-1"
            fill="#00C8FF"
          >
            CEY
          </text>

          {/* TEQ in Midnight Navy / Crisp White */}
          <text
            x="126"
            y="72"
            fontFamily="Inter, system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize="56"
            letterSpacing="-1"
            fill={textColor}
          >
            TEQ
          </text>

          {/* Subtitle: Empowering Digital Evolution */}
          {showSubtitle && (
            <text
              x="12"
              y="98"
              fontFamily="Inter, system-ui, -apple-system, sans-serif"
              fontWeight="600"
              fontSize="12"
              letterSpacing="3"
              fill={subtitleColor}
            >
              EMPOWERING DIGITAL EVOLUTION
            </text>
          )}
        </g>

        {/* Digital Speed Dashes entering the Q */}
        <g id="speed-dashes" fill="#00C8FF">
          <rect x="238" y="44" width="28" height="3" rx="1.5" />
          <rect x="246" y="50" width="34" height="3" rx="1.5" />
          <rect x="232" y="56" width="46" height="3.5" rx="1.75" />
          <rect x="242" y="62" width="36" height="3" rx="1.5" />
          <rect x="252" y="68" width="22" height="3" rx="1.5" />
          <rect x="274" y="52" width="6" height="3" rx="1.5" />
          <rect x="282" y="58" width="8" height="3" rx="1.5" />
        </g>

        {/* Ceyteq Concentric Radar / Target Emblem */}
        <g id="emblem" transform="translate(305, 56)">
          {/* Outer Arc */}
          <path
            d="M -30,-42 C 6,-46 42,-18 42,16 C 42,50 6,78 -30,74 C -16,62 -6,44 -6,16 C -6,-12 -16,-30 -30,-42 Z"
            fill="#00C8FF"
          />

          {/* Middle Arc */}
          <path
            d="M -18,-28 C 6,-32 26,-12 26,16 C 26,44 6,64 -18,60 C -8,50 0,36 0,16 C 0,-4 -8,-18 -18,-28 Z"
            fill="#00D8FF"
          />

          {/* Inner Core Circle */}
          <circle cx="16" cy="16" r="14" fill="#00C8FF" />
          <circle cx="16" cy="16" r="6" fill="#FFFFFF" fillOpacity="0.4" />
        </g>
      </svg>
    </div>
  );
};
