import React from "react";

interface DvoraLogoProps {
  className?: string;
}

export default function DvoraLogo({ className = "w-48 h-48" }: DvoraLogoProps) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-brand-primary drop-shadow-[0_0_15px_rgba(188,204,161,0.2)]"
      >
        {/* ================= NORTH ARROW (TOP) ================= */}
        <g id="north-arrow" className="opacity-90">
          {/* Main outer arrow triangle */}
          <path
            d="M256 12 L306 112 L256 88 L206 112 Z"
            fill="currentColor"
            className="transition-all duration-300"
          />
          {/* Inverted "N" cutout inside the arrow */}
          <path
            d="M246 45 L246 72 M246 45 L266 72 M266 45 L266 72"
            stroke="#121212"
            strokeWidth="4"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        </g>

        {/* ================= ANTENNAE & HEAD ================= */}
        <g id="head-assembly" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          {/* Antennae */}
          <path d="M236 170 C220 155, 200 145, 180 148" fill="none" />
          <path d="M276 170 C292 155, 312 145, 332 148" fill="none" />
          
          {/* Head Shape (Hexagonal shield) */}
          <polygon
            points="256,165 234,185 234,215 256,230 278,215 278,185"
            fill="#121212"
            strokeWidth="5"
          />

          {/* Aggressive mechanical eyes */}
          <polygon points="242,190 252,198 240,208" fill="currentColor" stroke="none" />
          <polygon points="270,190 260,198 272,208" fill="currentColor" stroke="none" />
        </g>

        {/* ================= THORAX ================= */}
        <g id="thorax">
          <polygon
            points="256,220 230,240 235,275 256,290 277,275 282,240"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Thorax details/lines */}
          <path d="M242 248 L270 248 M238 262 L274 262" stroke="#121212" strokeWidth="3.5" />
        </g>

        {/* ================= WINGS (LEFT) ================= */}
        <g id="left-wing" className="transition-transform duration-500 hover:-rotate-1 origin-[256px_230px]">
          {/* Main Top Wing Panel */}
          <polygon
            points="230,230 180,185 10,115 180,245"
            fill="currentColor"
            fillOpacity="0.08"
            stroke="currentColor"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />
          {/* Inner structural facets */}
          <polygon
            points="180,185 110,165 50,140 130,210"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <polygon
            points="180,245 110,245 52,240 120,225"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Bottom Wing Panel */}
          <polygon
            points="232,255 150,265 52,275 145,295"
            fill="currentColor"
            fillOpacity="0.05"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M150 265 L105 282" stroke="currentColor" strokeWidth="2" />
        </g>

        {/* ================= WINGS (RIGHT) ================= */}
        <g id="right-wing" className="transition-transform duration-500 hover:rotate-1 origin-[256px_230px]">
          {/* Main Top Wing Panel */}
          <polygon
            points="282,230 332,185 502,115 332,245"
            fill="currentColor"
            fillOpacity="0.08"
            stroke="currentColor"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />
          {/* Inner structural facets */}
          <polygon
            points="332,185 402,165 462,140 382,210"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <polygon
            points="332,245 402,245 460,240 392,225"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Bottom Wing Panel */}
          <polygon
            points="280,255 362,265 460,275 367,295"
            fill="currentColor"
            fillOpacity="0.05"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M362 265 L407 282" stroke="currentColor" strokeWidth="2" />
        </g>

        {/* ================= STYLIZED LETTERS (DV) ================= */}
        <g id="letters-dv" fill="currentColor" className="font-bold">
          {/* 'D' Shape (Stencil style) */}
          <path
            d="M26 350 H76 C94 350 102 360 102 376 V384 C102 400 94 410 76 410 H26 V350 Z M46 366 V394 H72 C80 394 84 390 84 382 V378 C84 370 80 366 72 366 H46 Z"
            fillRule="evenodd"
            clipRule="evenodd"
          />
          {/* 'V' Shape (Stencil style) */}
          <path
            d="M116 350 H136 L154 394 L172 350 H192 L164 410 H144 L116 350 Z"
          />
        </g>

        {/* ================= ABDOMEN (CENTER STRIPED WASP) ================= */}
        <g id="abdomen">
          {/* Outer cone silhouette of abdomen */}
          <polygon
            points="256,290 220,330 228,400 240,450 256,495 272,450 284,400 292,330"
            fill="#121212"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinejoin="round"
          />

          {/* Segment 1 */}
          <path
            d="M224 315 C236 308, 276 308, 288 315 L285 340 C275 334, 237 334, 227 340 Z"
            fill="currentColor"
          />
          {/* Segment 2 */}
          <path
            d="M221 350 C234 342, 278 342, 291 350 L287 375 C277 368, 235 368, 225 375 Z"
            fill="currentColor"
          />
          {/* Segment 3 */}
          <path
            d="M225 385 C236 378, 276 378, 287 385 L281 410 C271 403, 241 403, 231 410 Z"
            fill="currentColor"
          />
          {/* Segment 4 */}
          <path
            d="M231 420 C240 414, 272 414, 281 420 L273 442 C265 436, 247 436, 239 442 Z"
            fill="currentColor"
          />
          {/* Stinger Tip Segment */}
          <path
            d="M241 452 C246 448, 266 448, 271 452 L256 490 Z"
            fill="currentColor"
          />
        </g>

        {/* ================= STYLIZED LETTERS (RA) ================= */}
        <g id="letters-ra" fill="currentColor">
          {/* 'R' Shape (Stencil style) */}
          <path
            d="M320 350 H368 C382 350 392 358 392 372 C392 382 384 388 372 390 L394 410 H372 L352 392 H340 V410 H320 V350 Z M340 366 V378 H364 C370 378 374 376 374 372 C374 368 370 366 364 366 H340 Z"
            fillRule="evenodd"
            clipRule="evenodd"
          />
          {/* 'A' Shape (Stencil style with gap) */}
          <path
            d="M420 350 H440 L468 410 H446 L442 398 H418 L414 410 H392 L420 350 Z M422 384 H438 L430 364 L422 384 Z"
            fillRule="evenodd"
            clipRule="evenodd"
          />
        </g>
      </svg>
    </div>
  );
}
