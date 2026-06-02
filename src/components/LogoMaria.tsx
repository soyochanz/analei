import React, { useState } from 'react';

interface LogoMariaProps {
  className?: string;
  textClass?: string;
  waveClass?: string;
  showSubtext?: boolean;
}

export default function LogoMaria({
  className = "flex flex-col items-center",
  textClass = "text-2xl font-serif font-bold text-[#da4d73]",
  waveClass = "text-[#da4d73]",
  showSubtext = true
}: LogoMariaProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Direct image path from freeimage.host upload
  const imageUrl = "https://i.freeimage.host/CF45ZuV.png";

  return (
    <div className={`relative select-none ${className}`}>
      {!imageError ? (
        <div className="relative flex flex-col items-center justify-center">
          {/* Main Logo Image */}
          <img
            src={imageUrl}
            alt="Maria"
            referrerPolicy="no-referrer"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            className={`h-10 sm:h-12 w-auto object-contain mix-blend-multiply transition-all duration-300 ${
              imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95 absolute'
            }`}
          />
          
          {/* Direct beautiful SVG fallback while loading */}
          {!imageLoaded && (
            <div className="relative inline-block leading-none">
              <span className={`font-serif tracking-tight relative z-10 ${textClass}`}>
                Maria
              </span>
              <svg
                className={`absolute -left-2 -bottom-2 w-[116%] h-6 ${waveClass} pointer-events-none z-20`}
                viewBox="0 0 100 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M 2,13 C 13,3 38,20 74,10 C 85,7 91,9 96,12"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}

          {/* Subtext underneath the loaded image */}
          {showSubtext && imageLoaded && (
            <span className="text-[8px] tracking-[0.25em] text-[#453335]/70 font-bold font-sans uppercase mt-1 leading-none text-center">
              y Estética
            </span>
          )}
        </div>
      ) : (
        /* Native High-Fidelity Vector Fallback if image host is offline */
        <div className="flex flex-col items-center">
          <div className="relative inline-block leading-none">
            <span className={`font-serif tracking-tight relative z-10 ${textClass}`}>
              Maria
            </span>
            <svg
              className={`absolute -left-2 -bottom-2 w-[116%] h-6 ${waveClass} pointer-events-none z-20`}
              viewBox="0 0 100 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 2,13 C 13,3 38,20 74,10 C 85,7 91,9 96,12"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          {showSubtext && (
            <span className="text-[8px] tracking-[0.25em] text-stone-500/80 font-bold font-sans uppercase mt-1 leading-none text-center">
              y Estética
            </span>
          )}
        </div>
      )}
    </div>
  );
}

