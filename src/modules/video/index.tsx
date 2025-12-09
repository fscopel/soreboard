import { useEffect, useRef, useState } from 'react';
import type * as cocoSsdType from '@tensorflow-models/coco-ssd';
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
  const [personCount, setPersonCount] = useState<number | null>(null);
  const [visionStatus, setVisionStatus] = useState<string>('');
  const [lastInferenceMs, setLastInferenceMs] = useState<number | null>(null);
  const [visionBackend, setVisionBackend] = useState<'webgl' | 'cpu' | null>(null);
  const [detections, setDetections] = useState<Array<{ bbox: [number, number, number, number] }>>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPlayableVideo = !!videoUrl && (videoUrl.endsWith('.m3u8') || /\.(mp4|webm|ogg)(\?.*)?$/i.test(videoUrl));
  const DETECTION_INTERVAL_MS = 250;

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

  // Lightweight, on-device person counting using coco-ssd
  useEffect(() => {
    if (!isPlayableVideo) return;

    let cancelled = false;
    let intervalId: number | null = null;
    let model: cocoSsdType.ObjectDetection | null = null;
    let tfModule: typeof import('@tensorflow/tfjs') | null = null;
    let running = false;

    const runDetection = async () => {
      if (cancelled || !model) return;
      const video = videoRef.current;
      if (!video || video.paused || video.readyState < 2 || running) return;

      running = true;
      const start = performance.now();
      try {
        const predictions = await model.detect(video);
        const people = predictions.filter((p) => p.class === 'person' && p.score >= 0.2);
        if (!cancelled) {
          setPersonCount(people.length);
          setDetections(people.map(p => ({ bbox: p.bbox as [number, number, number, number] })));
          setLastInferenceMs(performance.now() - start);
          setVisionStatus('');
        }
      } catch {
        if (!cancelled) setVisionStatus('Vision inference failed');
      } finally {
        running = false;
      }
    };

    const initVision = async () => {
      setVisionStatus('Loading vision model…');
      try {
        tfModule = await import('@tensorflow/tfjs');
        try {
          await tfModule.setBackend('webgl');
          await tfModule.ready();
          setVisionBackend('webgl');
        } catch {
          await tfModule.setBackend('cpu');
          await tfModule.ready();
          setVisionBackend('cpu');
        }

        const cocoSsd = await import('@tensorflow-models/coco-ssd');
        if (cancelled) return;
        model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
        if (cancelled) return;

        setVisionStatus('');
        runDetection();
        intervalId = window.setInterval(runDetection, DETECTION_INTERVAL_MS);
      } catch {
        if (!cancelled) setVisionStatus('Vision unavailable');
      }
    };

    void initVision();

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
      if (model && (model as any).dispose) {
        try { (model as any).dispose(); } catch {}
      }
      if (tfModule) {
        try { tfModule.disposeVariables(); } catch {}
      }
    };
  }, [isPlayableVideo]);

  // Draw bounding boxes on canvas overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !isPlayableVideo) return;

    const drawBoxes = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Get video display dimensions (accounting for object-contain)
      const videoRect = video.getBoundingClientRect();
      const videoNaturalWidth = video.videoWidth;
      const videoNaturalHeight = video.videoHeight;
      
      if (videoNaturalWidth === 0 || videoNaturalHeight === 0) return;

      // Calculate actual displayed video size (object-contain maintains aspect ratio)
      const videoAspect = videoNaturalWidth / videoNaturalHeight;
      const containerAspect = videoRect.width / videoRect.height;
      
      let displayWidth: number;
      let displayHeight: number;
      let offsetX: number;
      let offsetY: number;

      if (videoAspect > containerAspect) {
        // Video is wider - fit to width
        displayWidth = videoRect.width;
        displayHeight = videoRect.width / videoAspect;
        offsetX = 0;
        offsetY = (videoRect.height - displayHeight) / 2;
      } else {
        // Video is taller - fit to height
        displayWidth = videoRect.height * videoAspect;
        displayHeight = videoRect.height;
        offsetX = (videoRect.width - displayWidth) / 2;
        offsetY = 0;
      }

      // Set canvas size to match video container
      canvas.width = videoRect.width;
      canvas.height = videoRect.height;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw green boxes for each detected person
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;

      detections.forEach((detection) => {
        const [x, y, width, height] = detection.bbox;
        
        // Scale coordinates from video natural size to displayed size
        const scaleX = displayWidth / videoNaturalWidth;
        const scaleY = displayHeight / videoNaturalHeight;
        
        const boxX = offsetX + (x * scaleX);
        const boxY = offsetY + (y * scaleY);
        const boxWidth = width * scaleX;
        const boxHeight = height * scaleY;

        // Draw rectangle
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      });
    };

    // Draw boxes when detections change or video resizes
    drawBoxes();
    
    const resizeObserver = new ResizeObserver(() => {
      drawBoxes();
    });
    resizeObserver.observe(video);

    // Also redraw on video loadedmetadata
    const handleLoadedMetadata = () => {
      drawBoxes();
    };
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      resizeObserver.disconnect();
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [detections, isPlayableVideo]);

  return (
    <ModuleWrapper title="Lobby View">
      <div className="relative flex flex-col h-full bg-black overflow-hidden -m-4 min-h-0">
        {videoUrl ? (
          isPlayableVideo ? (
            <>
              <div className="relative w-full flex-1 min-h-0">
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
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <div className="w-full bg-black/70 text-white text-sm px-3 py-2 text-center flex-shrink-0">
                {visionStatus
                  ? visionStatus
                  : personCount !== null
                    ? (
                      <>
                        People detected: {personCount}
                        {lastInferenceMs !== null && (
                          <span className="ml-2 text-xs text-white/70">
                            ~{Math.round(lastInferenceMs)} ms {visionBackend ? `(${visionBackend})` : ''}
                          </span>
                        )}
                      </>
                    )
                    : 'Initializing vision…'}
              </div>
            </>
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
        {isPlayableVideo && (
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
        {isPlayableVideo && (
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
