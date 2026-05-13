import { useRef, useState } from "react";
import { Play } from "lucide-react";

const VIDEO_URL =
  "https://lgscevufwnetegglgpnw.supabase.co/storage/v1/object/public/resources/Video%20Soy%20Dev.mp4";

export const SoyDevHeroVideo = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    setIsPlaying(true);
    void video.play();
  };

  return (
    <div className="relative w-full max-w-xl mx-auto lg:mx-0 lg:ml-auto">
      {/* Overlay manuscrito: flecha + texto */}
      <HandwrittenArrow />

      <div className="relative rounded-xl overflow-hidden shadow-2xl border border-border/40 bg-muted aspect-video">
        <video
          ref={videoRef}
          src={VIDEO_URL}
          preload="metadata"
          playsInline
          controls={isPlaying}
          className="w-full h-full object-cover"
          onEnded={() => setIsPlaying(false)}
        />

        {!isPlaying && (
          <button
            type="button"
            onClick={handlePlay}
            aria-label="Reproducir video"
            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="flex items-center justify-center h-20 w-20 rounded-full bg-white/95 text-primary shadow-xl group-hover:scale-105 transition-transform">
              <Play className="h-9 w-9 ml-1 fill-current" />
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

const HandwrittenArrow = () => (
  <>
    {/* Desktop: flecha curva arriba-izquierda apuntando hacia abajo-derecha */}
    <div className="hidden lg:block absolute -top-16 -left-20 pointer-events-none select-none z-10">
      <div className="relative">
        <svg
          width="140"
          height="120"
          viewBox="0 0 140 120"
          fill="none"
          className="text-foreground"
          aria-hidden="true"
        >
          <path
            d="M 10 15 Q 90 -5 120 70"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 110 60 L 120 72 L 132 62"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
        <span className="absolute top-[88px] left-[60px] whitespace-nowrap font-handwritten font-bold text-2xl text-foreground rotate-[-4deg]">
          Empezá por este video
        </span>
      </div>
    </div>

    {/* Mobile: flecha vertical apuntando hacia abajo, encima del video */}
    <div className="lg:hidden flex flex-col items-center mb-3 pointer-events-none select-none">
      <span className="font-handwritten font-bold text-2xl text-foreground rotate-[-3deg]">
        Empezá por este video
      </span>
      <svg
        width="60"
        height="56"
        viewBox="0 0 60 56"
        fill="none"
        className="text-foreground mt-1"
        aria-hidden="true"
      >
        <path
          d="M 10 5 Q 5 30 30 45"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 22 38 L 30 47 L 40 40"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  </>
);
