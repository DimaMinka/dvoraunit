import React, { useState, useEffect, useRef, FormEvent } from "react";
import { 
  Terminal as TerminalIcon, 
  Radio, 
  Activity, 
  ShieldAlert, 
  Compass, 
  Cpu, 
  Wifi, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  ChevronRight, 
  Send, 
  HelpCircle, 
  Info, 
  Settings, 
  Power, 
  Satellite, 
  RefreshCw,
  Bell,
  Search,
  AlertOctagon,
  X
} from "lucide-react";
import RadarCanvas from "./components/RadarCanvas";
import DecryptMinigame from "./components/DecryptMinigame";
import DvoraLogo from "./components/DvoraLogo";
import { TerminalMessage, SubsystemInfo, RadarTarget, SubUnitState } from "./types";

// Static constant data for initial targets
const INITIAL_TARGETS: RadarTarget[] = [
  { id: "T1", x: 0.65, y: 0.65, angle: 0.35, distance: 124.5, label: "UAV_BOGEY_01", speed: "Mach 1.2", bearing: "022°", classification: "HOSTILE", detectedAt: "15:42:04" },
  { id: "T2", x: 0.45, y: 0.45, angle: 1.85, distance: 90.2, label: "RECON_AIR_04", speed: "340 kt", bearing: "106°", classification: "FRIENDLY", detectedAt: "15:43:11" },
  { id: "T3", x: 0.80, y: 0.80, angle: 4.52, distance: 160.0, label: "FAST_INT_VECT", speed: "Mach 2.8", bearing: "259°", classification: "HOSTILE", detectedAt: "15:44:59" },
  { id: "T4", x: 0.22, y: 0.22, angle: 5.12, distance: 44.8, label: "ROTARY_SNT_09", speed: "Hovering", bearing: "293°", classification: "UNKNOWN", detectedAt: "15:45:02" },
  { id: "T5", x: 0.52, y: 0.52, angle: 3.02, distance: 104.1, label: "DVORA_SUPPORT", speed: "22 kt", bearing: "173°", classification: "FRIENDLY", detectedAt: "15:40:15" },
];

const INITIAL_SUBUNITS: SubUnitState[] = [
  { id: "S1", name: "DVORA ALPHA SQUAD", type: "Infantry Recon", status: "ACTIVE", strength: 100, coordinates: "34.0531° N, 118.2431° W" },
  { id: "S2", name: "DVORA BETA TEAM", type: "Heavy Support", status: "DEPLOYED", strength: 85, coordinates: "34.0594° N, 118.2510° W" },
  { id: "S3", name: "UPLINK SIG-RELAY 03", type: "Communications", status: "STANDBY", strength: 98, coordinates: "34.0488° N, 118.2392° W" },
  { id: "S4", name: "SENTINEL AIR RECON", type: "Tactical UAV", status: "ACTIVE", strength: 44, coordinates: "34.0621° N, 118.2488° W" },
];

export default function App() {
  const [viewState, setViewState] = useState<"offline" | "terminal" | "decrypt" | "dashboard">("offline");
  const [sysTime, setSysTime] = useState("");
  const [terminalLogs, setTerminalLogs] = useState<TerminalMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [subsystems, setSubsystems] = useState<SubsystemInfo[]>([]);
  const [radarTargets, setRadarTargets] = useState<RadarTarget[]>(INITIAL_TARGETS);
  const [selectedTarget, setSelectedTarget] = useState<RadarTarget | null>(null);
  const [subUnits, setSubUnits] = useState<SubUnitState[]>(INITIAL_SUBUNITS);
  const [isTyping, setIsTyping] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<{role: "user" | "model", text: string}[]>([]);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);

  const logsEndRef = useRef<HTMLDivElement | null>(null);

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

  // Fetch diagnostics on mount
  useEffect(() => {
    const fetchDiagnostics = async () => {
      try {
        const res = await fetch("/api/diagnostics");
        if (res.ok) {
          const data = await res.json();
          setSubsystems(data.subsystems);
        }
      } catch (err) {
        console.warn("Diagnostics API unavailable, using offline fallback schema.");
        setSubsystems([
          { name: "CORE_PROCESSOR_CELL", status: "STABLE", load: "12%", temp: "40C" },
          { name: "TACTICAL_RADAR_ARRAY", status: "MAINTENANCE", load: "0%", temp: "22C" },
          { name: "COMMS_SAT_TRANSCEIVER", status: "STABLE", load: "95%", temp: "55C" },
          { name: "KINETIC_SHIELD_REGEN", status: "STANDBY", load: "2%", temp: "19C" },
          { name: "TERRAIN_SCANNING_OCTREE", status: "OFFLINE", load: "0%", temp: "15C" },
        ]);
      }
    };
    fetchDiagnostics();
  }, []);

  // Scroll to bottom on log updates
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLogs, isTyping]);

  // Initial terminal logs on launch
  const initTerminalLogs = () => {
    if (terminalLogs.length > 0) return;
    setTerminalLogs([
      {
        id: "m1",
        sender: "system",
        text: "DVORA COLD KERNEL OS_v8.0.4.X_STABLE SYSTEM REBOOT DETECTED...",
        timestamp: new Date().toISOString()
      },
      {
        id: "m2",
        sender: "system",
        text: "COMMS LINK INITIALIZED. TRANSCEIVER TUNED TO FREQ: 403.95 MHZ",
        timestamp: new Date().toISOString()
      },
      {
        id: "m3",
        sender: "command",
        text: "[COMMAND COORD UPLINK 01-A] CHANNEL STABILIZED. State your operational inquiry. Note that main core systems are currently OFFLINE for scheduled tactical maintenance. Send /help for direct terminal parameters.",
        timestamp: new Date().toISOString()
      }
    ]);
  };

  const handleOpenTerminal = () => {
    initTerminalLogs();
    setViewState("terminal");
  };

  // Run subsystem diagnostics via API
  const runDiagnostics = async () => {
    setDiagnosticsLoading(true);
    addLog("system", "INITIATING COMPONENT DIAGNOSTICS SECTOR SCAN...");
    
    setTimeout(async () => {
      try {
        const res = await fetch("/api/diagnostics");
        if (res.ok) {
          const data = await res.json();
          setSubsystems(data.subsystems);
          addLog("system", `SCAN COMPLETE. ${data.subsystems.filter((s: any) => s.status === 'STABLE').length} CORE CELLS ONLINE. OUTAGE DETECTED: TACTICAL_RADAR_ARRAY.`);
        } else {
          throw new Error("HTTP failure");
        }
      } catch (err) {
        addLog("system", "SCAN ABORTED. HARDWARE INTERRUPT SIGNALS FLAGGED. BYPASS HANDSHAKE DISCOVERY RECOMMENDED.");
      }
      setDiagnosticsLoading(false);
    }, 1200);
  };

  const addLog = (sender: "user" | "command" | "system", text: string) => {
    setTerminalLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        sender,
        text,
        timestamp: new Date().toISOString()
      }
    ]);
  };

  // Handle terminal command inputs
  const handleTerminalSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const query = userInput.trim();
    addLog("user", query);
    setUserInput("");

    // Parse terminal codes
    if (query.startsWith("/")) {
      const cmd = query.toLowerCase().split(" ")[0];
      switch (cmd) {
        case "/help":
          addLog("system", `AVAILABLE CHANNELS & EXECUTIVE DIRECTIVES:
- /diagnostics : Scan all hardware modules for operational integrity.
- /decrypt     : Force connection bypass using Hex-Decryption matrix alignment.
- /status      : Retrieve coordinates of deployed elite support wings.
- /clear       : Clear core console screen logs.
- /lock        : Lock system back to maintenance state.
- /radar       : Retrieve radar sweeps (requires DEC_UPLINK bypass).`);
          break;
        case "/clear":
          setTerminalLogs([]);
          break;
        case "/lock":
          addLog("system", "DVORA UNIT LOGGED OUT. SECURITY ENFORCED.");
          setViewState("offline");
          break;
        case "/diagnostics":
          runDiagnostics();
          break;
        case "/decrypt":
          addLog("system", "REDIRECTING COGNITIVE FLOW TO MATRIX DECRYPTION KEY HANDSHAKE...");
          setTimeout(() => {
            setViewState("decrypt");
          }, 800);
          break;
        case "/status":
          addLog("system", `ACTIVE SQUAD CONSOLE FEED:
- DVORA ALPHA SQUAD  : ${INITIAL_SUBUNITS[0].status} @ ${INITIAL_SUBUNITS[0].coordinates} [STR: 100%]
- DVORA BETA TEAM    : ${INITIAL_SUBUNITS[1].status} @ ${INITIAL_SUBUNITS[1].coordinates} [STR: 85%]
- SENTINEL AIR RECON : ${INITIAL_SUBUNITS[3].status} @ ${INITIAL_SUBUNITS[3].coordinates} [STR: 44%]`);
          break;
        case "/radar":
          addLog("system", "[ACCESS LOCKED]: Active radar coordinates cannot be processed outside safe decrypted channels. Enter decrypt dashboard matrix (/decrypt).");
          break;
        default:
          addLog("system", `UNKNOWN DIRECTIVE: "${cmd}". Enter /help for a complete registry.`);
      }
      return;
    }

    // Direct Gemini Communication Route
    setIsTyping(true);
    // Maintain conversational loop
    const updatedHistory = [...terminalHistory, { role: "user" as const, text: query }];
    setTerminalHistory(updatedHistory);

    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query, history: terminalHistory })
      });

      if (!res.ok) throw new Error("Connection fault");
      const data = await res.json();
      
      addLog("command", data.text);
      setTerminalHistory((prev) => [...prev, { role: "model" as const, text: data.text }]);
    } catch (err) {
      // Local fallback simulator if server is offline or key is missing
      setTimeout(() => {
        const fallbacks = [
          "[COMMAND 01-A] RE-ROUTE DETECTED. The DVORA Core is experiencing a maintenance blackout. Local manual bypass coordinates can be established via decryption matrix overrides. Initiate /decrypt to bypass.",
          "[COMMAND 01-A] Tactical warning: Secure link latency has crossed critical parameters. Ensure uplink shield systems are in operational STANDBY. Confirm your clearance level.",
          "[COMMAND 01-A] Affirmative, operator. Support vectors are deployed to Sector 04-B. Secure key handshake must be validated before we release orbital precision coordinates.",
        ];
        const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        addLog("command", randomFallback);
      }, 1000);
    } finally {
      setIsTyping(false);
    }
  };

  // Triggers manual ping/alert on the radar targets
  const handlePulseRadar = () => {
    // Generate slight target jitter to represent motion
    setRadarTargets((prev) => 
      prev.map((t) => ({
        ...t,
        x: Math.min(0.9, Math.max(0.1, t.x + (Math.random() - 0.5) * 0.05)),
        y: Math.min(0.9, Math.max(0.1, t.y + (Math.random() - 0.5) * 0.05)),
        distance: Math.round((Math.hypot(t.x, t.y) * 200) * 10) / 10
      }))
    );
    addLog("system", "[RADAR SWEEP] Pulse emitted. Dynamic coordinates recalculated.");
  };

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
            {viewState === "offline" && "MAINT_BLOCK"}
            {viewState === "terminal" && "COMMS_ACTIVE"}
            {viewState === "decrypt" && "DECRYPT_MATRIX"}
            {viewState === "dashboard" && "HUD_CLEARANCE_LIVE"}
          </span>
        </div>
      </header>

      {/* Main Container Stage */}
      <main className="flex-grow flex items-center justify-center p-4 md:p-8 z-10">
        
        {/* VIEW 1: SYSTEM OFFLINE SCREEN (Matches reference exactly) */}
        {viewState === "offline" && (
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
        )}

        {/* VIEW 2: INTERACTIVE COMM TERMINAL */}
        {viewState === "terminal" && (
          <div className="w-full max-w-4xl border border-brand-steel bg-[#141414] flex flex-col md:grid md:grid-cols-4 min-h-[500px]">
            
            {/* Left sidebar: Diagnostics overview */}
            <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-brand-steel/40 p-4 bg-[#111] flex flex-col justify-between font-mono">
              <div>
                <div className="flex items-center gap-2 text-brand-primary mb-4 border-b border-brand-steel/30 pb-2">
                  <Cpu className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">HARDWARE_MONITOR</span>
                </div>

                <div className="space-y-3.5">
                  {subsystems.map((sub, idx) => (
                    <div key={idx} className="text-[11px] space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-brand-secondary truncate max-w-[120px]">{sub.name}</span>
                        <span className={`px-1 text-[9px] font-bold ${
                          sub.status === 'STABLE' ? 'text-brand-primary bg-brand-primary-container/20' :
                          sub.status === 'MAINTENANCE' ? 'text-yellow-500 bg-yellow-500/10' :
                          'text-brand-alert bg-brand-alert/10'
                        }`}>
                          {sub.status}
                        </span>
                      </div>
                      <div className="w-full bg-[#1c1c1c] h-1">
                        <div 
                          className={`h-full ${sub.status === 'STABLE' ? 'bg-brand-primary' : sub.status === 'MAINTENANCE' ? 'bg-yellow-500' : 'bg-brand-alert'}`}
                          style={{ width: sub.status === 'STABLE' ? sub.load : sub.status === 'MAINTENANCE' ? '20%' : '0%' }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-brand-steel">
                        <span>LOAD: {sub.load}</span>
                        <span>TEMP: {sub.temp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-brand-steel/30 mt-4">
                <button
                  id="btn_run_diagnostic_scan"
                  disabled={diagnosticsLoading}
                  onClick={runDiagnostics}
                  className="w-full py-2 border border-brand-primary/40 hover:border-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10 text-brand-primary text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${diagnosticsLoading ? 'animate-spin' : ''}`} />
                  RUN RE-SCAN
                </button>
              </div>
            </div>

            {/* Right container: Scrolling terminal */}
            <div className="md:col-span-3 flex flex-col justify-between h-[520px] bg-black/90">
              
              {/* Header */}
              <div className="px-4 py-2 bg-[#161616] border-b border-brand-steel/40 flex justify-between items-center">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
                  <span className="text-brand-primary">UPLINK STABILIZED [COMMAND CENTER]</span>
                </div>
                <button
                  id="btn_close_terminal"
                  onClick={() => setViewState("offline")}
                  className="p-1 text-brand-steel hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrolling terminal window */}
              <div className="flex-grow overflow-y-auto p-4 space-y-3 font-mono text-xs select-text">
                {terminalLogs.map((log) => (
                  <div key={log.id} className="space-y-1">
                    <div className="flex justify-between text-[9px] text-brand-steel border-b border-brand-steel/10 pb-0.5">
                      <span>
                        {log.sender === "system" && "[ SYSTEM ALERT ]"}
                        {log.sender === "user" && "[ DVORA_OPERATOR_WING ]"}
                        {log.sender === "command" && "[ COMMANDER COORDINATOR ]"}
                      </span>
                      <span>{log.timestamp.split("T")[1].slice(0, 8)}</span>
                    </div>
                    <div className={`whitespace-pre-wrap leading-relaxed ${
                      log.sender === 'system' ? 'text-brand-steel font-semibold' :
                      log.sender === 'command' ? 'text-brand-primary' :
                      'text-white'
                    }`}>
                      {log.text}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-2 text-brand-primary">
                    <span className="w-2 h-4 bg-brand-primary animate-pulse" />
                    <span className="text-[10px] tracking-widest animate-pulse">TRANSMITTING UPLINK DATA...</span>
                  </div>
                )}
                <div ref={logsEndRef} />
              </div>

              {/* Prompt box */}
              <form onSubmit={handleTerminalSubmit} className="p-3 border-t border-brand-steel/40 bg-[#141414] flex gap-2">
                <div className="flex-grow flex items-center bg-black border border-brand-steel px-3 focus-within:border-brand-primary">
                  <span className="text-brand-primary font-mono text-xs font-bold mr-2 select-none">&gt;</span>
                  <input
                    id="input_terminal"
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Enter command code (e.g. /diagnostics, /decrypt) or inquire Command..."
                    className="flex-grow bg-transparent border-none outline-none font-mono text-xs py-2 text-white placeholder-brand-steel/60 focus:ring-0"
                  />
                </div>
                <button
                  id="btn_send_terminal"
                  type="submit"
                  className="bg-brand-primary text-black px-4 py-2 hover:bg-white font-bold transition-all flex items-center justify-center cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>

          </div>
        )}

        {/* VIEW 3: BYPASS DECRYPTION MATRIX HANDSHAKE */}
        {viewState === "decrypt" && (
          <div className="w-full max-w-4xl">
            <DecryptMinigame 
              onSuccess={() => {
                addLog("system", "UPLINK SECURITY HANDSHAKE DECRYPTED. REDIRECTING TO LIVE HUD DASHBOARD...");
                setViewState("dashboard");
              }}
              onCancel={() => {
                setViewState("offline");
              }}
            />
          </div>
        )}

        {/* VIEW 4: LIVE OPERATION DASHBOARD (UNLOCKED HUD) */}
        {viewState === "dashboard" && (
          <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 p-1 md:p-4 animate-fade-in">
            
            {/* Top alert ticker banner */}
            <div className="lg:col-span-12 bg-brand-primary/10 border border-brand-primary/30 p-3 flex justify-between items-center font-mono text-xs">
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-brand-primary animate-bounce" />
                <span className="text-brand-primary font-bold">SECURE NETWORK ACQUIRED</span>
                <span className="text-brand-steel">|</span>
                <span className="text-brand-secondary">CLEARANCE LEVEL: ALPHA_OPS</span>
              </div>
              <div className="hidden sm:block text-[10px] text-brand-steel">
                ENCRYPTION SEED: 0xF4B32A9C_OK
              </div>
            </div>

            {/* Column Left: Scanning Radar Array */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <RadarCanvas 
                targets={radarTargets} 
                onSelectTarget={setSelectedTarget}
                selectedTarget={selectedTarget}
              />

              {/* Target info panel */}
              <div className="bg-[#141414] border border-brand-steel p-4 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-brand-steel pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-brand-primary" />
                    <span className="font-bold uppercase text-brand-primary">COORDINATE_CELL_RESOLVER</span>
                  </div>
                  {selectedTarget && (
                    <span className={`px-1.5 text-[9px] font-bold ${
                      selectedTarget.classification === 'HOSTILE' ? 'bg-red-900/40 text-red-400 border border-red-500/40' :
                      selectedTarget.classification === 'FRIENDLY' ? 'bg-brand-primary-container/30 text-brand-primary border border-brand-primary/30' :
                      'bg-gray-800 text-gray-300'
                    }`}>
                      {selectedTarget.classification}
                    </span>
                  )}
                </div>

                {selectedTarget ? (
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                    <div>
                      <span className="text-brand-steel block text-[9px]">TARGET SYSTEM ID</span>
                      <span className="text-white font-bold">{selectedTarget.label}</span>
                    </div>
                    <div>
                      <span className="text-brand-steel block text-[9px]">ESTIMATED RANGE</span>
                      <span className="text-brand-primary font-bold">{selectedTarget.distance} KM</span>
                    </div>
                    <div>
                      <span className="text-brand-steel block text-[9px]">VELOCITY VALUE</span>
                      <span className="text-brand-primary">{selectedTarget.speed}</span>
                    </div>
                    <div>
                      <span className="text-brand-steel block text-[9px]">COMPASS BEARING</span>
                      <span className="text-brand-primary">{selectedTarget.bearing}</span>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-brand-steel/30 flex justify-between items-center text-[10px]">
                      <span className="text-brand-steel">DETECTED TIMESTAMP:</span>
                      <span className="text-brand-secondary">{selectedTarget.detectedAt}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-brand-steel text-[11px] space-y-1">
                    <Search className="w-6 h-6 text-brand-steel/50 mx-auto" />
                    <div>SELECT ACTIVE VECTOR BLIP ON RADAR CANVAS TO HARVEST TELEMETRY</div>
                  </div>
                )}
              </div>
            </div>

            {/* Column Right: Active Wings & Comms Feed */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* Squad coordinates manager */}
              <div className="bg-[#141414] border border-brand-steel p-4 font-mono text-xs flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-brand-steel pb-2 mb-4">
                    <span className="font-bold uppercase text-brand-primary">DVORA_UNIT_SQUAD_LOG</span>
                    <span className="text-[10px] text-brand-steel">SECURE FIELD METRICS</span>
                  </div>

                  <div className="space-y-3">
                    {subUnits.map((unit) => (
                      <div key={unit.id} className="border border-brand-steel/50 bg-[#161616] p-3 flex justify-between items-center">
                        <div className="space-y-1">
                          <span className="font-bold text-white block">{unit.name}</span>
                          <span className="text-[10px] text-brand-steel block uppercase">{unit.type} | {unit.coordinates}</span>
                        </div>
                        <div className="text-right space-y-1">
                          <span className="bg-brand-primary-container/20 text-brand-primary px-1.5 py-0.5 text-[9px] font-bold block text-center">
                            {unit.status}
                          </span>
                          <span className="text-[10px] text-brand-secondary block font-bold">POWER: {unit.strength}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-brand-steel/30 flex gap-4">
                  <button
                    id="btn_radar_pulse"
                    onClick={handlePulseRadar}
                    className="flex-grow py-3 bg-brand-primary hover:bg-white text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Activity className="w-4 h-4 animate-pulse" />
                    EMIT RADAR PULSE
                  </button>

                  <button
                    id="btn_re_lock_system"
                    onClick={() => setViewState("offline")}
                    className="py-3 px-4 border border-brand-alert bg-brand-alert/10 hover:bg-brand-alert hover:text-white text-brand-alert font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    LOCK MATRIX
                  </button>
                </div>
              </div>

              {/* Direct Tactical Command Messenger */}
              <div className="bg-[#141414] border border-brand-steel p-4 font-mono text-xs flex flex-col h-60">
                <div className="flex items-center justify-between border-b border-brand-steel pb-2 mb-3">
                  <span className="font-bold uppercase text-brand-primary">DIRECT_SECURE_MESSENGER</span>
                  <span className="text-[10px] text-brand-steel">COMMS CHANNEL 01</span>
                </div>

                <div className="flex-grow overflow-y-auto mb-3 border border-brand-steel/30 bg-[#0e0e0e] p-2 space-y-2 max-h-32">
                  <div className="text-brand-steel text-[10px]">[UPLINK ON-LINE] YOU ARE TALKING WITH COMMANDER:</div>
                  <div className="text-brand-primary text-[11px] leading-relaxed">
                    [COMMANDER] "Handshake successful. Tactical feeds decrypted. You are cleared for strategic actions. Use the Radar Sweep to trace anomalies."
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    id="btn_ask_mission"
                    onClick={() => {
                      setViewState("terminal");
                      initTerminalLogs();
                      setUserInput("Request current mission directives.");
                    }}
                    className="w-full py-2 border border-brand-steel hover:border-brand-primary text-white text-[10px] font-bold uppercase tracking-wider transition-all"
                  >
                    ASK Directives
                  </button>
                  <button
                    id="btn_ask_status"
                    onClick={() => {
                      setViewState("terminal");
                      initTerminalLogs();
                      setUserInput("Request status updates on neighboring tactical grid units.");
                    }}
                    className="w-full py-2 border border-brand-steel hover:border-brand-primary text-white text-[10px] font-bold uppercase tracking-wider transition-all"
                  >
                    ASK status
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

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
