import React, { useEffect, useRef, useState, useCallback } from "react";
import { CloudRain, Cloud, Sun, Volume2, VolumeX } from "lucide-react";

/**
 * AtmosphereControls
 * Header pill to switch atmosphere mode (Live Rain & Clouds / Clouds Only / Clear)
 * and toggle soothing Web Audio API rain sound.
 */
export function AtmosphereControls({
  mode = "rain-clouds",
  onToggleMode,
  isAudioActive = false,
  onToggleAudio
}) {
  return (
    <div className="atmosphere-controls-bar inline-header-bar" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="atmosphere-mode-toggle-btn"
        onClick={onToggleMode}
        title="Switch weather atmosphere mode"
      >
        {mode === "rain-clouds" ? (
          <>
            <CloudRain size={13} className="text-cyan pulse" />
            <span>Live Rain & Clouds</span>
          </>
        ) : mode === "clouds-only" ? (
          <>
            <Cloud size={13} className="text-cyan" />
            <span>Clouds Only (Dry)</span>
          </>
        ) : (
          <>
            <Sun size={13} className="text-amber" />
            <span>Clear Sky</span>
          </>
        )}
      </button>

      {mode === "rain-clouds" && (
        <button
          type="button"
          className={`atmosphere-audio-toggle-btn ${isAudioActive ? "active" : ""}`}
          onClick={onToggleAudio}
          title={isAudioActive ? "Mute ambient rain audio" : "Play soothing ambient rain audio"}
        >
          {isAudioActive ? (
            <>
              <Volume2 size={13} className="text-cyan pulse" />
              <span>Rain Audio: ON</span>
            </>
          ) : (
            <>
              <VolumeX size={13} />
              <span>Rain Audio</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

/**
 * StartingPageAtmosphere
 * Renders realistic moving cloud formations, aerodynamic rainfall with
 * ground splash ripples, atmospheric lightning ambient blooms, and optional
 * synthesized rain audio via Web Audio API.
 */
export default function StartingPageAtmosphere({
  mode = "rain-clouds", // "rain-clouds" | "clouds-only" | "clear"
  onModeChange,
  isAudioActive = false,
  onToggleAudio,
  showControls = false
}) {
  const canvasRef = useRef(null);
  const [internalMode, setInternalMode] = useState(mode);
  const [internalAudioActive, setInternalAudioActive] = useState(isAudioActive);
  const audioContextRef = useRef(null);
  const audioGainRef = useRef(null);

  const activeMode = mode !== undefined ? mode : internalMode;
  const audioActive = isAudioActive !== undefined ? isAudioActive : internalAudioActive;

  // Sync internal mode with props
  useEffect(() => {
    if (mode !== undefined) setInternalMode(mode);
  }, [mode]);

  useEffect(() => {
    if (isAudioActive !== undefined) setInternalAudioActive(isAudioActive);
  }, [isAudioActive]);

  const handleModeToggle = () => {
    const nextMode = activeMode === "rain-clouds" 
      ? "clouds-only" 
      : activeMode === "clouds-only" 
      ? "clear" 
      : "rain-clouds";
    setInternalMode(nextMode);
    onModeChange?.(nextMode);
  };

  // --- 1. Web Audio API Synthesized Gentle Rain Ambient ---
  const toggleAudio = useCallback(() => {
    if (onToggleAudio) {
      onToggleAudio();
      return;
    }

    if (internalAudioActive) {
      if (audioGainRef.current && audioContextRef.current) {
        audioGainRef.current.gain.linearRampToValueAtTime(0.001, audioContextRef.current.currentTime + 0.4);
        setTimeout(() => {
          try { audioContextRef.current?.close(); } catch (_) {}
          audioContextRef.current = null;
          setInternalAudioActive(false);
        }, 400);
      } else {
        setInternalAudioActive(false);
      }
    } else {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
          b6 = white * 0.115926;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1100, ctx.currentTime);

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 1.2);
        audioGainRef.current = gainNode;

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        noise.start();
        setInternalAudioActive(true);
      } catch (err) {
        console.warn("Audio synthesis unavailable:", err);
      }
    }
  }, [internalAudioActive, onToggleAudio]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch (_) {}
      }
    };
  }, []);

  // --- 2. High-Performance Canvas Natural Raindrop Simulation ---
  useEffect(() => {
    if (activeMode === "clear" || activeMode === "clouds-only") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const RAIN_COUNT = Math.min(220, Math.floor((width * height) / 5500));
    const drops = [];
    const splashes = [];
    const windAngle = 0.22;

    class Drop {
      constructor(isInitial = false) {
        this.reset(isInitial);
      }

      reset(isInitial = false) {
        this.x = Math.random() * (width + 200) - 100;
        this.y = isInitial ? Math.random() * height : -30;
        
        const layer = Math.random();
        if (layer > 0.85) {
          this.layer = 3;
          this.length = Math.random() * 16 + 26;
          this.speed = Math.random() * 8 + 24;
          this.thickness = 1.35;
          this.alpha = Math.random() * 0.25 + 0.35;
          this.color = "220, 240, 255";
        } else if (layer > 0.4) {
          this.layer = 2;
          this.length = Math.random() * 12 + 16;
          this.speed = Math.random() * 6 + 17;
          this.thickness = 0.95;
          this.alpha = Math.random() * 0.18 + 0.22;
          this.color = "186, 230, 253";
        } else {
          this.layer = 1;
          this.length = Math.random() * 8 + 9;
          this.speed = Math.random() * 4 + 11;
          this.thickness = 0.7;
          this.alpha = Math.random() * 0.12 + 0.12;
          this.color = "147, 197, 253";
        }
      }

      update() {
        this.x += this.speed * windAngle;
        this.y += this.speed;

        if (this.y >= height - Math.random() * 40) {
          if (this.layer >= 2 && splashes.length < 50 && Math.random() > 0.35) {
            splashes.push(new Splash(this.x, height - Math.random() * 25, this.layer));
          }
          this.reset(false);
        }

        if (this.x > width + 100 || this.x < -100) {
          this.reset(false);
        }
      }

      draw() {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.length * windAngle, this.y - this.length);
        ctx.strokeStyle = `rgba(${this.color}, ${this.alpha})`;
        ctx.lineWidth = this.thickness;
        ctx.lineCap = "round";
        ctx.stroke();
      }
    }

    class Splash {
      constructor(x, y, layer) {
        this.x = x;
        this.y = y;
        this.rx = 1.5;
        this.ry = 0.6;
        this.maxRx = layer === 3 ? 9 : 6;
        this.alpha = layer === 3 ? 0.45 : 0.25;
        this.speed = 0.45;
      }

      update() {
        this.rx += this.speed * 1.5;
        this.ry += this.speed * 0.6;
        this.alpha -= 0.035;
      }

      draw() {
        if (this.alpha <= 0) return;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.rx, this.ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(186, 230, 253, ${Math.max(0, this.alpha)})`;
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }
    }

    for (let i = 0; i < RAIN_COUNT; i++) {
      drops.push(new Drop(true));
    }

    let lightningIntensity = 0;
    let nextLightningTime = Date.now() + 18000 + Math.random() * 15000;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const now = Date.now();
      if (now > nextLightningTime) {
        lightningIntensity = 0.28;
        nextLightningTime = now + 24000 + Math.random() * 20000;
      }
      if (lightningIntensity > 0) {
        ctx.fillStyle = `rgba(186, 230, 253, ${lightningIntensity * 0.12})`;
        ctx.fillRect(0, 0, width, height);
        lightningIntensity -= 0.015;
      }

      for (let i = 0; i < drops.length; i++) {
        drops[i].update();
        drops[i].draw();
      }

      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        s.update();
        s.draw();
        if (s.alpha <= 0) {
          splashes.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [activeMode]);

  return (
    <div className="starting-page-atmosphere-layer" aria-hidden="true">
      {/* 1. Deep Atmospheric Gradient Underlay */}
      <div className={`atmosphere-sky-underlay ${activeMode}`} />

      {/* 2. Moving Volumetric Cloud Deck 1 (Upper High-Altitude Rolling Cloudbank) */}
      {(activeMode === "rain-clouds" || activeMode === "clouds-only") && (
        <div className="clouds-container deck-high">
          <div className="cloud-formation-loop formation-1" />
          <div className="cloud-formation-loop formation-2" />
        </div>
      )}

      {/* 3. Moving Volumetric Cloud Deck 2 (Mid-Level Billowy Cumulus Puffs) */}
      {(activeMode === "rain-clouds" || activeMode === "clouds-only") && (
        <div className="clouds-container deck-mid">
          <div className="cumulus-bank bank-1" />
          <div className="cumulus-bank bank-2" />
        </div>
      )}

      {/* 4. Moving Volumetric Cloud Deck 3 (Low Ground Mist & Rolling Mountain Fog) */}
      {(activeMode === "rain-clouds" || activeMode === "clouds-only") && (
        <div className="clouds-container deck-low">
          <div className="fog-wisp-stream wisp-1" />
          <div className="fog-wisp-stream wisp-2" />
        </div>
      )}

      {/* 5. 60 FPS Canvas Dynamic Rain Simulation */}
      {activeMode === "rain-clouds" && (
        <canvas ref={canvasRef} className="atmosphere-rain-canvas" />
      )}

      {/* 6. Subtle Aerodynamic Glass Mist / Droplet Condensation Vignette */}
      {activeMode === "rain-clouds" && (
        <div className="atmosphere-vignette-mist" />
      )}

      {/* 7. Standalone Controls Bar if requested */}
      {showControls && (
        <AtmosphereControls
          mode={activeMode}
          onToggleMode={handleModeToggle}
          isAudioActive={audioActive}
          onToggleAudio={toggleAudio}
        />
      )}
    </div>
  );
}
