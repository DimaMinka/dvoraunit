import React, { useState, useEffect } from "react";
import { 
  Radio, 
  Wifi, 
  Satellite 
} from "lucide-react";
import DvoraLogo from "./components/DvoraLogo";

export default function App() {
  const [sysTime, setSysTime] = useState("");

  // Sync real-time clock to exactly match formatting in bottom left
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      const timeStr = date.toTimeString().split(" ")[0]; // HH:MM:SS
      setSysTime(timeStr);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div id="tactical_ops_interface" className="scanlines grid-backdrop min-h-screen bg-[#121212] flex flex-col justify-between text-[#e5e2e1] relative selection:bg-brand-primary selection:text-black">
      
      {/* HUD Navigation / Status bar at top of screen */}
      <header className="border-b border-brand-steel/40 bg-[#141414] px-4 md:px-6 py-3 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-brand-primary animate-ping rounded-full" />
          <div className="font-display font-bold uppercase tracking-widest text-brand-primary text-xs flex items-center gap-2">
            <Radio className="w-4 h-4 text-brand-primary" />
            DVORA // COMMAND INTERFACE
          </div>
        </div>

        {/* Action center / current mode tag */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="hidden md:flex gap-3 text-brand-steel">
            <span className="flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5 text-brand-primary" />
              BAND_WIDTH: SECURE_HIL
            </span>
            <span className="border-r border-brand-steel/40 h-4" />
            <span className="flex items-center gap-1">
              <Satellite className="w-3.5 h-3.5 text-brand-primary" />
              SATELLITE: ORB_09
            </span>
          </div>

          <span className="bg-brand-primary/10 border border-brand-primary/40 px-2 py-0.5 text-brand-primary uppercase text-[10px] font-bold">
            MAINT_BLOCK
          </span>
        </div>
      </header>

      {/* Main Container Stage */}
      <main className="flex-grow flex items-center justify-center p-4 md:p-8 z-10">
        
        <div className="w-full max-w-3xl flex flex-col items-center">
          
          {/* Outlying framing box with coordinate margins */}
          <div className="w-full relative border border-transparent py-12 px-4 md:px-8">
            
            {/* Custom SVG L-Bracket Corner Accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-brand-primary" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-brand-primary" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-brand-primary" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-brand-primary" />

            {/* Coordinates label top right */}
            <span className="absolute -top-3.5 right-1 font-mono text-[10px] text-brand-secondary/80">
              34.0522° N, 118.2437° W
            </span>

            {/* Version label bottom left */}
            <span className="absolute -bottom-3.5 left-1 font-mono text-[10px] text-brand-steel">
              VER_8.0.4.X_STABLE
            </span>

            {/* Main Card */}
            <div 
              className="border border-brand-steel/60 bg-[#161616]/90 p-8 md:p-12 text-center shadow-2xl relative"
            >
              
              {/* Upper Status Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary-container text-brand-primary border border-brand-primary/30 text-[10px] font-mono tracking-wider mb-8">
                <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse" />
                STATUS: SYSTEM UPDATE IN PROGRESS
              </div>

              {/* DVORA logo */}
              <DvoraLogo className="w-44 h-44 mx-auto mb-6" />

              {/* Primary Displays */}
              <h1 className="font-display text-4xl md:text-5xl font-bold text-brand-primary tracking-tight leading-none mb-4 uppercase">
                DVORA UNIT SYSTEM
              </h1>
              <h2 className="font-display text-3xl md:text-4xl font-semibold text-brand-primary tracking-widest leading-none uppercase mb-8">
                OFFLINE
              </h2>

              {/* Divider Line */}
              <div className="w-24 h-0.5 bg-brand-steel/50 mx-auto mb-8" />

              {/* Tactical Description Paragraph */}
              <p className="max-w-md mx-auto font-sans text-sm text-brand-secondary leading-relaxed">
                Our digital operations center is currently undergoing scheduled maintenance and strategic upgrades. We will be back online shortly to continue our primary directives.
              </p>

              {/* Support Contact */}
              <div className="mt-8 font-mono text-[10px] tracking-wider text-brand-steel">
                SECURE HELPDESK UPLINK:{" "}
                <a 
                  href="mailto:support@dvoraunit.com" 
                  onClick={(e) => e.stopPropagation()} 
                  className="text-brand-primary hover:text-white underline decoration-brand-primary/30 hover:decoration-white transition-all font-bold"
                >
                  support@dvoraunit.com
                </a>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Persistent global footer */}
      <footer className="border-t border-brand-steel/40 bg-[#141414] px-4 py-3 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono z-10 space-y-2 sm:space-y-0 text-brand-steel">
        
        {/* SYS_CLOCK: HH:MM:SS format bottom left */}
        <div className="flex flex-wrap gap-2 md:gap-4 items-center justify-center">
          <span className="text-white font-bold bg-[#181818] border border-brand-steel/30 px-2.5 py-1">
            [ SYS_CLOCK: {sysTime || "14:02:33"} ]
          </span>
          <span className="text-brand-primary font-bold bg-[#181818] border border-brand-steel/30 px-2.5 py-1">
            [ NETWORK: ENCRYPTED ]
          </span>
          <span className="text-brand-primary font-bold bg-[#181818] border border-brand-steel/30 px-2.5 py-1">
            [ UPLINK: STABLE ]
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-brand-primary select-none block mr-2 font-black">░▒▓░▒▓ DVORA UNIT</span>
          <span>© 2026 ELITE SPECIAL OPERATIONS COMMAND FOR OFFICIAL USE ONLY</span>
        </div>
      </footer>

    </div>
  );
}
