import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Define __dirname in ES Modules context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client lazily to avoid crashing on startup if the API key is missing.
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Tactical Operations API route
app.post("/api/command", async (req, res) => {
  const { message, history } = req.body;

  try {
    const ai = getGeminiClient();

    // Reconstruct conversation history or pass it as a simple prompt
    const systemInstruction = `You are the Tactical Operations Coordinator for the DVORA Elite Command Center (Designation: COMMAND UPLINK 01-A).
The operator of a DVORA Tactical Unit is contacting you. The system is currently undergoing scheduled maintenance (DVORA UNIT SYSTEM OFFLINE), meaning some visual overlays and combat HUDs are locked.
Respond to the operator in a highly immersive, authoritative, technical military terminal style.
- Use uppercase tags for status or metadata where appropriate (e.g., [UPLINK: ACTIVE], [TRANSMISSION EXCISE], [THREAT LEVEL: NOMINAL]).
- Incorporate tactical coordinates (e.g., 34.0522° N, 118.2437° W) or system statuses.
- Keep answers professional, concise, structured, and commanding.
- Inform the operator they can bypass the offline block and unlock the LIVE HUD by running the DEC_UPLINK bypass handshake sequence (initiating the /decrypt bypass protocols).
- Keep replies under 180 words. Never break character.`;

    // Map history to Google Gen AI format if present
    const contents = history && Array.isArray(history) && history.length > 0 
      ? history.map((item: any) => ({
          role: item.role === "user" ? "user" : "model",
          parts: [{ text: item.text }]
        }))
      : [];

    contents.push({
      role: "user",
      parts: [{ text: message || "UPLINK TEST. Request status update." }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8,
      }
    });

    res.json({
      success: true,
      text: response.text || "[ERROR: TRANSMISSION NULL]"
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      success: false,
      text: `[UPLINK ERROR: CONNECTION REFUSED]\n\nDetails: ${error.message || "Unknown server exception."}\n\nREMEDY: Please ensure the GEMINI_API_KEY secret is correctly set in AI Studio Secrets.`
    });
  }
});

// Diagnostics simulation API
app.get("/api/diagnostics", (req, res) => {
  const subsystems = [
    { name: "CORE_PROCESSOR_CELL", status: "STABLE", load: "14%", temp: "42C" },
    { name: "TACTICAL_RADAR_ARRAY", status: "MAINTENANCE", load: "0%", temp: "22C" },
    { name: "COMMS_SAT_TRANSCEIVER", status: "STABLE", load: "98%", temp: "58C" },
    { name: "KINETIC_SHIELD_REGEN", status: "STANDBY", load: "5%", temp: "18C" },
    { name: "TERRAIN_SCANNING_OCTREE", status: "OFFLINE", load: "0%", temp: "15C" },
    { name: "COGNITIVE_THREAT_EVAL", status: "STABLE", load: "44%", temp: "39C" },
    { name: "WEAPONS_MATRIX_LOCK", status: "SAFE", load: "0%", temp: "20C" }
  ];
  res.json({
    timestamp: new Date().toISOString(),
    kernel_version: "DVORA_OS_v8.0.4.X_STABLE",
    uptime: "284,102.33s",
    system_load: "23.4%",
    subsystems: subsystems
  });
});

// Vite Middleware Integration for Dev / Static Asset Server for Production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Tactical Operations Server listening on http://localhost:${PORT}`);
  });
}

startServer();
