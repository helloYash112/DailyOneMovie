import { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import '@videojs/themes/dist/city/index.css';
import { useNavigate } from 'react-router-dom';

export function VideoPlayer({ src }) {
  const videoRef = useRef(null);
  const navigate=useNavigate();

  useEffect(() => {
    const player = videojs(videoRef.current, {
      controls: true,
      responsive: true,
      fluid: true,
      sources: [{ src, type: 'video/mp4' }],
    });

    return () => {
      if (player) player.dispose();
    };
  }, [src]);

  return (
    <div className='relative w-full h-full bg-black group'>
      <button 
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 
                   bg-black/50 hover:bg-black/80 text-white font-medium 
                   rounded-md transition-all duration-300 backdrop-blur-sm
                   opacity-0 group-hover:opacity-100 border border-white/10"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" viewBox="0 0 24 24" 
          strokeWidth={2.5} stroke="currentColor" 
          className="w-5 h-5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        <span>Back to Dashboard</span>
      </button>
      
    <div data-vjs-player>
      
      <video ref={videoRef} className='video-js vjs-theme-city vjs-big-play-centered' />
    </div>
    </div>
  );
}