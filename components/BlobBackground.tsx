"use client";

export function BlobBackground() {
  return (
    <div
      aria-hidden="true"
      className="aurora-root"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <style>{`
        .aurora-root {
          background: #000;
        }

        .aurora {
          position: absolute;
          inset: 0;
          z-index: -1;
          overflow: hidden;
        }

        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(110px);
          mix-blend-mode: screen;
          transition: transform 0.45s ease-out, background 0.4s ease;
        }

        /* ─────────────────────────────
           NEON CORE COLORS
           focus: GREEN • BLUE • PURPLE
        ───────────────────────────── */

        .blob.one {
          background:
            radial-gradient(circle,
              rgba(0,255,170,1) 0%,
              rgba(0,255,170,0.6) 30%,
              rgba(0,120,90,0.35) 55%,
              transparent 75%);
          box-shadow:
            0 0 140px rgba(0,255,170,0.9),
            inset 0 0 40px rgba(0,255,170,0.6);
        }

        .blob.two {
          background:
            radial-gradient(circle,
              rgba(0,180,255,1) 0%,
              rgba(0,180,255,0.65) 35%,
              rgba(0,80,150,0.35) 60%,
              transparent 80%);
          box-shadow:
            0 0 150px rgba(0,180,255,0.9),
            inset 0 0 45px rgba(0,180,255,0.6);
        }

        .blob.three {
          background:
            radial-gradient(circle,
              rgba(140,0,255,1) 0%,
              rgba(140,0,255,0.65) 35%,
              rgba(70,0,160,0.35) 60%,
              transparent 80%);
          box-shadow:
            0 0 160px rgba(140,0,255,0.9),
            inset 0 0 50px rgba(140,0,255,0.6);
        }

        .blob.four {
          background:
            radial-gradient(circle,
              rgba(100,255,240,1) 0%,
              rgba(100,255,240,0.55) 30%,
              rgba(0,120,110,0.35) 55%,
              transparent 75%);
          box-shadow:
            0 0 140px rgba(100,255,240,0.9),
            inset 0 0 40px rgba(100,255,240,0.6);
        }

        .blob.five {
          background:
            radial-gradient(circle,
              rgba(120,90,255,1) 0%,
              rgba(120,90,255,0.65) 35%,
              rgba(60,40,170,0.35) 60%,
              transparent 80%);
          box-shadow:
            0 0 150px rgba(120,90,255,0.9),
            inset 0 0 45px rgba(120,90,255,0.6);
        }

        /* ─────────────────────────────
           SIZES & POSITIONS
        ───────────────────────────── */

        .blob.one {
          width: 400px;
          height: 400px;
          top: -15%;
          left: 5%;
          animation: moveOne 18s ease-in-out infinite, pulseOne 8s ease-in-out infinite;
        }

        .blob.two {
          width: 400px;
          height: 400px;
          bottom: -20%;
          right: 10%;
          animation: moveTwo 20s ease-in-out infinite, pulseTwo 9s ease-in-out infinite;
        }

        .blob.three {
          width: 400px;
          height: 400px;
          top: 40%;
          left: 45%;
          animation: moveThree 22s ease-in-out infinite, pulseThree 7.5s ease-in-out infinite;
        }

        .blob.four {
          width: 400px;
          height: 400px;
          top: 10%;
          right: 25%;
          animation: moveFour 19s ease-in-out infinite, pulseFour 8.5s ease-in-out infinite;
        }

        .blob.five {
          width: 400px;
          height: 400px;
          bottom: 15%;
          left: 20%;
          animation: moveFive 21s ease-in-out infinite, pulseFive 9.5s ease-in-out infinite;
        }

        /* ─────────────────────────────
           MOTION
        ───────────────────────────── */

        @keyframes moveOne { 0%{transform:translate(-100px,-150px) scale(.9)}50%{transform:translate(100px,100px) scale(1.1)}100%{transform:translate(-100px,-150px) scale(.9)}}
        @keyframes moveTwo { 0%{transform:translate(150px,120px) scale(1.05)}50%{transform:translate(-100px,-100px) scale(1.15)}100%{transform:translate(150px,120px) scale(1.05)}}
        @keyframes moveThree { 0%{transform:translate(100px,-120px)}50%{transform:translate(-120px,120px) scale(.95)}100%{transform:translate(100px,-120px)}}
        @keyframes moveFour { 0%{transform:translate(-120px,100px) scale(1.1)}50%{transform:translate(120px,-100px) scale(1.15)}100%{transform:translate(-120px,100px) scale(1.1)}}
        @keyframes moveFive { 0%{transform:translate(80px,-100px)}50%{transform:translate(-140px,80px) scale(.9)}100%{transform:translate(80px,-100px)}}

        @keyframes pulseOne {0%,100%{opacity:.6}50%{opacity:1}}
        @keyframes pulseTwo {0%,100%{opacity:.55}50%{opacity:1}}
        @keyframes pulseThree {0%,100%{opacity:.6}50%{opacity:1}}
        @keyframes pulseFour {0%,100%{opacity:.5}50%{opacity:.95}}
        @keyframes pulseFive {0%,100%{opacity:.55}50%{opacity:1}}
      `}</style>

      <div className="aurora">
        <div className="blob one"></div>
        <div className="blob two"></div>
        <div className="blob three"></div>
        <div className="blob four"></div>
        <div className="blob five"></div>
      </div>
    </div>
  );
}