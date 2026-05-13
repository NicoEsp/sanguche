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
    <div className="w-full max-w-xl mx-auto lg:mx-0 lg:ml-auto">
      {/* Flecha manuscrita + texto, arriba del video */}
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
  <div className="flex items-end justify-center gap-3 sm:gap-4 mb-3 pointer-events-none select-none">
    <svg
      width="80"
      height="90"
      viewBox="0 0 80 90"
      fill="none"
      className="text-foreground flex-shrink-0"
      aria-hidden="true"
    >
      <path
        d="M 8 10 Q 70 5 55 75"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 46 66 L 55 78 L 66 68"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
    <span className="font-handwritten font-bold text-2xl sm:text-3xl text-foreground rotate-[-3deg] pb-2">
      Empezá por este video
    </span>
  </div>
);
