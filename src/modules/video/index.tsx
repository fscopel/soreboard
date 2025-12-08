import { useEffect, useRef, useState } from 'react';
import { ModuleWrapper } from '../../components/ModuleWrapper';
import { SCOREBOARD_CONFIG } from '../../config/scoreboard';

// Lightweight video feed module with optional HLS support via hls.js
export const VideoModule = () => {
  const videoUrl = SCOREBOARD_CONFIG.videoUrl;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<string>('');
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(!!SCOREBOARD_CONFIG.videoUrl);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!videoUrl) {
      setStatus('No video URL configured');
      return;
    }

    const isHls = videoUrl.endsWith('.m3u8');
    const isDirectVideo = isHls || /\.(mp4|webm|ogg)(\?.*)?$/i.test(videoUrl);
    let hlsInstance: any | null = null;

    const setup = async () => {
      try {
        if (isHls) {
          if ((window as any).MediaSource) {
            const Hls = (await import('hls.js')).default;
            if (Hls.isSupported()) {
              hlsInstance = new Hls();
              hlsInstance.loadSource(videoUrl);
              hlsInstance.attachMedia(video);
              hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
                video.muted = muted;
                video.play().then(() => setIsPlaying(true)).catch(() => {});
                setLoading(false);
              });
            } else {
              // Fallback for browsers with native HLS (Safari)
              video.src = videoUrl;
              video.muted = muted;
              await video.play().then(() => setIsPlaying(true)).catch(() => {});
              setLoading(false);
            }
          } else {
            // No MediaSource support, try native playback
            video.src = videoUrl;
            video.muted = muted;
            await video.play().then(() => setIsPlaying(true)).catch(() => {});
            setLoading(false);
          }
        } else if (isDirectVideo) {
          // Direct video file
          video.src = videoUrl;
          video.muted = muted;
          await video.play().then(() => setIsPlaying(true)).catch(() => {});
          setLoading(false);
        }
        setStatus('');
      } catch (e) {
        setStatus('Unable to start video');
        setLoading(false);
      }
    };

    if (isDirectVideo) {
      void setup();
      return () => {
        if (hlsInstance) {
          try { hlsInstance.destroy(); } catch {}
        }
      };
    }
    // If not a direct video URL, do nothing here; iframe will render.
    return undefined;
  }, [videoUrl, muted]);

  return (
    <ModuleWrapper title="Lobby View">
      <div className="flex items-center justify-center h-full bg-black">
        {videoUrl ? (
          videoUrl.endsWith('.m3u8') || /\.(mp4|webm|ogg)(\?.*)?$/i.test(videoUrl) ? (
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              preload="auto"
              autoPlay
              muted={muted}
              playsInline
              loop
              onCanPlay={() => setLoading(false)}
              onPlaying={() => { setLoading(false); setIsPlaying(true); }}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={(e) => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
              onError={() => { setStatus('Video failed to load'); setLoading(false); }}
            />
          ) : (
            <iframe
              src={videoUrl}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              onLoad={() => { setIframeLoaded(true); setLoading(false); }}
            />
          )
        ) : (
          <div className="text-gray-300 text-center p-4">
            Provide a video URL in config to display the feed.
          </div>
        )}
        {/* Loading spinner overlay */}
        {loading && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="w-12 h-12 border-4 border-white/40 border-t-white rounded-full animate-spin" />
          </div>
        )}
        {/* Simple overlay controls */}
        {videoUrl && (videoUrl.endsWith('.m3u8') || /\.(mp4|webm|ogg)(\?.*)?$/i.test(videoUrl)) && (
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              className="px-3 py-1 text-xs rounded bg-white/80 hover:bg-white text-black shadow"
              onClick={() => {
                setMuted((m) => !m);
                const v = videoRef.current;
                if (v) v.muted = !muted;
              }}
            >
              {muted ? 'Unmute' : 'Mute'}
            </button>
            <button
              className="px-3 py-1 text-xs rounded bg-white/80 hover:bg-white text-black shadow"
              onClick={() => {
                const v = videoRef.current;
                if (!v) return;
                if (v.paused) {
                  v.play().then(() => setIsPlaying(true)).catch(() => {});
                } else {
                  v.pause();
                  setIsPlaying(false);
                }
              }}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
          </div>
        )}
        {videoUrl && (videoUrl.endsWith('.m3u8') || /\.(mp4|webm|ogg)(\?.*)?$/i.test(videoUrl)) && (
          <div className="absolute bottom-2 right-2 text-xs text-white/90 bg-black/40 px-2 py-1 rounded">
            {formatTime(currentTime)}
          </div>
        )}
        {/* Status messages */}
        {status && (
          <div className="absolute bottom-2 left-2 text-xs text-white/80 bg-black/40 px-2 py-1 rounded">
            {status}
          </div>
        )}
        {!iframeLoaded && videoUrl && !(videoUrl.endsWith('.m3u8') || /\.(mp4|webm|ogg)(\?.*)?$/i.test(videoUrl)) && (
          <IframeLoadHint />
        )}
      </div>
    </ModuleWrapper>
  );
}

const IframeLoadHint = () => {
  const [show, setShow] = useState<boolean>(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <div className="absolute top-2 left-2 right-2 text-xs text-yellow-200 bg-black/50 px-3 py-2 rounded">
      If the feed does not appear, it may be blocked from embedding (X-Frame-Options) or require authentication. Provide a direct stream URL (e.g., .m3u8) for reliable playback.
    </div>
  );
};

function formatTime(t: number) {
  const mins = Math.floor(t / 60);
  const secs = Math.floor(t % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
