'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipForward, FileText, ChevronDown, ExternalLink } from 'lucide-react';

// v12.0.0 — Video Lesson Player (Phase 2.1)
// Embeddable YouTube/Vimeo player with transcript support

interface VideoPlayerProps {
  url: string;                       // YouTube or Vimeo URL
  title?: string;
  transcript?: TranscriptEntry[];    // AI-generated or manual transcript
  onComplete?: () => void;           // Callback when video reaches end
  autoplay?: boolean;
  className?: string;
}

export interface TranscriptEntry {
  time: number;    // seconds from start
  text: string;
}

function extractVideoId(url: string): { platform: 'youtube' | 'vimeo' | 'unknown'; id: string } {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return { platform: 'youtube', id: ytMatch[1] };
  // Vimeo
  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch) return { platform: 'vimeo', id: vimeoMatch[1] };
  return { platform: 'unknown', id: '' };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const VideoPlayer = memo(function VideoPlayer({ url, title, transcript, onComplete, autoplay = false, className = '' }: VideoPlayerProps) {
  const { platform, id } = extractVideoId(url);
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript to current position
  useEffect(() => {
    if (!showTranscript || !transcript || !transcriptRef.current) return;
    const currentEntry = transcript.findIndex((entry, i) => {
      const next = transcript[i + 1];
      return currentTime >= entry.time && (!next || currentTime < next.time);
    });
    if (currentEntry >= 0) {
      const el = transcriptRef.current.querySelector(`[data-idx="${currentEntry}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentTime, showTranscript, transcript]);

  const embedUrl = platform === 'youtube'
    ? `https://www.youtube.com/embed/${id}?enablejsapi=1&rel=0&modestbranding=1${autoplay ? '&autoplay=1' : ''}`
    : platform === 'vimeo'
    ? `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0${autoplay ? '&autoplay=1' : ''}`
    : '';

  if (platform === 'unknown' || !id) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center p-8 ${className}`}>
        <p className="text-sm text-gray-500">Unsupported video URL. Please use a YouTube or Vimeo link.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Video embed */}
      <div className="relative bg-black rounded-2xl overflow-hidden shadow-lg" style={{ paddingBottom: '56.25%' }}>
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title={title || 'Video Lesson'}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Video info bar */}
      <div className="flex items-center justify-between px-1">
        {title && (
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate flex items-center gap-2">
            <Play size={14} className="text-indigo-500 flex-shrink-0" />
            {title}
          </h4>
        )}
        <div className="flex items-center gap-2">
          {transcript && transcript.length > 0 && (
            <button onClick={() => setShowTranscript(!showTranscript)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition font-medium ${showTranscript ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'}`}>
              <FileText size={12} />
              Transcript
              <ChevronDown size={12} className={`transition-transform ${showTranscript ? 'rotate-180' : ''}`} />
            </button>
          )}
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition">
            <ExternalLink size={12} /> Open
          </a>
        </div>
      </div>

      {/* Transcript panel */}
      <AnimatePresence>
        {showTranscript && transcript && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div ref={transcriptRef}
              className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl max-h-48 overflow-y-auto p-3 space-y-1">
              {transcript.map((entry, i) => {
                const isCurrent = currentTime >= entry.time && (!transcript[i + 1] || currentTime < transcript[i + 1].time);
                return (
                  <div key={i} data-idx={i}
                    className={`flex gap-2 px-2 py-1 rounded-lg transition cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${isCurrent ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    <span className="text-[10px] font-mono text-gray-400 min-w-[36px] pt-0.5">{formatTime(entry.time)}</span>
                    <span className="text-xs leading-relaxed">{entry.text}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default VideoPlayer;

// Demo transcript data for preview
export const DEMO_TRANSCRIPT: TranscriptEntry[] = [
  { time: 0, text: 'Welcome to today\'s lesson on photosynthesis.' },
  { time: 5, text: 'Photosynthesis is the process by which green plants convert light energy into chemical energy.' },
  { time: 12, text: 'This process takes place primarily in the chloroplasts, using chlorophyll pigments.' },
  { time: 20, text: 'The overall equation is: 6CO2 + 6H2O + light energy \u2192 C6H12O6 + 6O2.' },
  { time: 30, text: 'There are two main stages: the light-dependent reactions and the Calvin cycle.' },
  { time: 40, text: 'In the light-dependent reactions, water molecules are split using solar energy.' },
  { time: 50, text: 'This produces ATP and NADPH, which power the Calvin cycle.' },
  { time: 60, text: 'The Calvin cycle fixes carbon dioxide into glucose molecules.' },
  { time: 70, text: 'Let\'s look at each stage in more detail...' },
];
