import React from 'react';

/**
 * ARKAVIA original geometric brand mark
 * Combines: book (open pages), data paths (circuits), security shield
 */
export default function ArkaviaMark({ size = 64 }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="arkavia-logo-svg"
    >
      {/* Outer shield */}
      <path
        d="M50 8 L82 22 L82 52 C82 68 67 82 50 90 C33 82 18 68 18 52 L18 22 Z"
        stroke="#00d4c8"
        strokeWidth="2"
        fill="none"
        opacity="0.6"
      />
      {/* Middle ring */}
      <circle cx="50" cy="50" r="22" stroke="#8b5cf6" strokeWidth="1.5" fill="none" opacity="0.5" />
      {/* Data path lines (circuit-like) */}
      <line x1="28" y1="50" x2="38" y2="50" stroke="#00d4c8" strokeWidth="1.5" opacity="0.8" />
      <line x1="62" y1="50" x2="72" y2="50" stroke="#00d4c8" strokeWidth="1.5" opacity="0.8" />
      <line x1="50" y1="28" x2="50" y2="38" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.8" />
      <line x1="50" y1="62" x2="50" y2="72" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.8" />
      {/* Corner dots */}
      <circle cx="28" cy="50" r="2.5" fill="#00d4c8" opacity="0.9" />
      <circle cx="72" cy="50" r="2.5" fill="#00d4c8" opacity="0.9" />
      <circle cx="50" cy="28" r="2.5" fill="#8b5cf6" opacity="0.9" />
      <circle cx="50" cy="72" r="2.5" fill="#8b5cf6" opacity="0.9" />
      {/* Book shape in center */}
      <path
        d="M38 42 L38 58 Q38 60 40 60 L50 60 L50 42 Z"
        fill="#00d4c8"
        opacity="0.7"
      />
      <path
        d="M62 42 L62 58 Q62 60 60 60 L50 60 L50 42 Z"
        fill="#8b5cf6"
        opacity="0.7"
      />
      {/* Spine */}
      <line x1="50" y1="42" x2="50" y2="60" stroke="#f0ead6" strokeWidth="1.5" opacity="0.9" />
      {/* Page lines */}
      <line x1="41" y1="46" x2="48" y2="46" stroke="#fff" strokeWidth="0.8" opacity="0.6" />
      <line x1="41" y1="49" x2="48" y2="49" stroke="#fff" strokeWidth="0.8" opacity="0.6" />
      <line x1="41" y1="52" x2="48" y2="52" stroke="#fff" strokeWidth="0.8" opacity="0.6" />
      <line x1="52" y1="46" x2="59" y2="46" stroke="#fff" strokeWidth="0.8" opacity="0.6" />
      <line x1="52" y1="49" x2="59" y2="49" stroke="#fff" strokeWidth="0.8" opacity="0.6" />
      <line x1="52" y1="52" x2="59" y2="52" stroke="#fff" strokeWidth="0.8" opacity="0.6" />
      {/* Corner bracket marks */}
      <path d="M20 20 L20 28 L28 28" stroke="#00d4c8" strokeWidth="1" fill="none" opacity="0.4" />
      <path d="M80 20 L80 28 L72 28" stroke="#00d4c8" strokeWidth="1" fill="none" opacity="0.4" />
    </svg>
  );
}
