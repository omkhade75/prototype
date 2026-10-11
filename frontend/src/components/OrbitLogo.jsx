import React from 'react';

export function OrbitLogo({ size = 32, animated = true, className = '' }) {
  return (
    <div 
      className={`orbit-logo-container ${className}`}
      style={{ 
        width: size, 
        height: size, 
        position: 'relative', 
        display: 'inline-flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Core sphere gradient */}
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#38bdf8" />
            <stop offset="70%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#a855f7" />
          </radialGradient>

          {/* Ring 1 Gradient: Magenta -> Violet */}
          <linearGradient id="ringGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>

          {/* Ring 2 Gradient: Cyan -> Indigo */}
          <linearGradient id="ringGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>

          {/* Ring 3 Gradient: Mint -> Rose */}
          <linearGradient id="ringGrad3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>

          {/* Specular Core Filter */}
          <filter id="coreBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
        </defs>

        <style>{`
          .orbit-ring-rot-1 {
            transform-origin: 50px 50px;
            ${animated ? 'animation: orbitSpin1 12s linear infinite;' : ''}
          }
          .orbit-ring-rot-2 {
            transform-origin: 50px 50px;
            ${animated ? 'animation: orbitSpin2 16s linear infinite reverse;' : ''}
          }
          .orbit-ring-rot-3 {
            transform-origin: 50px 50px;
            ${animated ? 'animation: orbitSpin3 20s linear infinite;' : ''}
          }
          .orbit-center-core {
            transform-origin: 50px 50px;
            ${animated ? 'animation: orbitCorePulse 3.5s ease-in-out infinite alternate;' : ''}
          }

          @keyframes orbitSpin1 {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes orbitSpin2 {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes orbitSpin3 {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes orbitCorePulse {
            0% { transform: scale(0.92); opacity: 0.9; }
            100% { transform: scale(1.08); opacity: 1; filter: drop-shadow(0 0 10px #38bdf8); }
          }
        `}</style>

        {/* Ambient Glow Aura */}
        <circle cx="50" cy="50" r="22" fill="#8b5cf6" opacity="0.18" filter="blur(8px)" />

        {/* Orbital Ring 1 (60 deg tilt) */}
        <g className="orbit-ring-rot-1">
          <ellipse
            cx="50"
            cy="50"
            rx="43"
            ry="18"
            transform="rotate(60 50 50)"
            stroke="url(#ringGrad1)"
            strokeWidth="3.2"
            strokeLinecap="round"
            fill="none"
            opacity="0.9"
          />
          {/* Satellite Particle on Ring 1 */}
          <circle cx="93" cy="50" r="2.8" fill="#ffffff" filter="drop-shadow(0 0 4px #ec4899)" transform="rotate(60 50 50)" />
        </g>

        {/* Orbital Ring 2 (-60 deg tilt) */}
        <g className="orbit-ring-rot-2">
          <ellipse
            cx="50"
            cy="50"
            rx="43"
            ry="18"
            transform="rotate(-60 50 50)"
            stroke="url(#ringGrad2)"
            strokeWidth="3.2"
            strokeLinecap="round"
            fill="none"
            opacity="0.9"
          />
          {/* Satellite Particle on Ring 2 */}
          <circle cx="7" cy="50" r="2.8" fill="#ffffff" filter="drop-shadow(0 0 4px #06b6d4)" transform="rotate(-60 50 50)" />
        </g>

        {/* Orbital Ring 3 (Horizontal 0 deg) */}
        <g className="orbit-ring-rot-3">
          <ellipse
            cx="50"
            cy="50"
            rx="42"
            ry="19"
            stroke="url(#ringGrad3)"
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
            opacity="0.8"
          />
          {/* Satellite Particle on Ring 3 */}
          <circle cx="50" cy="8" r="2.4" fill="#ffffff" filter="drop-shadow(0 0 4px #10b981)" />
        </g>

        {/* Quantum AI Nucleus Core */}
        <g className="orbit-center-core" filter="url(#coreBlur)">
          {/* Inner Core Sphere */}
          <circle cx="50" cy="50" r="14.5" fill="url(#coreGlow)" />
          {/* Specular Highlight */}
          <ellipse cx="46" cy="45" rx="5" ry="3.5" fill="#ffffff" opacity="0.75" />
          {/* Subtle Circuit Crosshair */}
          <line x1="50" y1="41" x2="50" y2="44" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          <line x1="50" y1="56" x2="50" y2="59" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          <line x1="41" y1="50" x2="44" y2="50" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          <line x1="56" y1="50" x2="59" y2="50" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        </g>
      </svg>
    </div>
  );
}

export default OrbitLogo;
