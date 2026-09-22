import React from 'react';

/**
 * SilkWaveBackdrop renders a high-fidelity silk wave light gradient background
 * matching the user's reference image:
 * Soft luminous off-white/sky-blue gradient with fluid, smooth silk wave curves.
 */
export const SilkWaveBackdrop: React.FC = () => {
  return (
    <div 
      aria-hidden="true" 
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Base Light Sky Silk Radial Glow */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-[#FFFFFF] via-[#F1F8FE] to-[#DDF0FD]"
      />

      {/* Layer 1: Radiant Top Soft White Luster */}
      <div 
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[140vw] h-[60vh] rounded-full blur-3xl opacity-80"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(240,248,255,0.7) 60%, rgba(224,242,254,0) 100%)',
        }}
      />

      {/* Layer 2: Silk Wave SVG mimicking the exact curve in user's image */}
      <svg
        className="absolute inset-0 w-full h-full object-cover"
        viewBox="0 0 1920 1080"
        fill="none"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Main silk wave gradient: luminous white to gentle light blue */}
          <linearGradient id="silkWaveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="35%" stopColor="#E0F2FE" stopOpacity="0.75" />
            <stop offset="70%" stopColor="#BAE6FD" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#7DD3FC" stopOpacity="0.45" />
          </linearGradient>

          {/* Secondary silk fold gradient for depth and drape shadow */}
          <linearGradient id="silkWaveGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#E6F4FE" stopOpacity="0.65" />
            <stop offset="80%" stopColor="#93C5FD" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.15" />
          </linearGradient>

          {/* Delicate luminous crest line gradient */}
          <linearGradient id="crestHighlight" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#BAE6FD" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Deep silk fold (background wave drape) */}
        <path
          d="M -100 280 C 420 540, 980 720, 1600 520 C 1850 440, 2020 380, 2100 340 L 2100 1200 L -100 1200 Z"
          fill="url(#silkWaveGrad1)"
        />

        {/* Foreground sweeping silk crest (matches the u-shape in user's image) */}
        <path
          d="M -150 480 C 350 780, 950 920, 1550 720 C 1820 630, 2020 520, 2150 460 L 2150 1200 L -150 1200 Z"
          fill="url(#silkWaveGrad2)"
        />

        {/* Silk highlight ribbon along the dip */}
        <path
          d="M -100 482 C 400 782, 980 882, 1550 722 C 1850 632, 2050 532, 2150 462"
          stroke="url(#crestHighlight)"
          strokeWidth="14"
          strokeLinecap="round"
          filter="blur(16px)"
          opacity="0.75"
        />

        {/* Soft edge highlight line */}
        <path
          d="M -100 480 C 400 780, 980 880, 1550 720 C 1850 630, 2050 530, 2150 460"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
          filter="blur(3px)"
          opacity="0.85"
        />
      </svg>

      {/* Subtle fine light noise / sheen texture */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(0, 200, 255, 0.4) 0%, transparent 60%)`,
        }}
      />
    </div>
  );
};
