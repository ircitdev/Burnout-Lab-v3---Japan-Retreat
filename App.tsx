import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Calendar, Users, Brain, CheckCircle, Menu, X, Moon, Sun, Play, Download, 
  Feather, Send, FileText, Activity, Loader2, Mic, Sparkles, Quote, AlertCircle, Copy, MessageSquare, Gift, FileDown,
  Smartphone, ExternalLink
} from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";
import { TG_CONFIG, ASSETS, TRANSLATIONS } from './config';

// --- CUSTOM HOOKS ---

function useIntersectionObserver(options: IntersectionObserverInit & { triggerOnce?: boolean } = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (options.triggerOnce) observer.unobserve(entry.target);
      } else if (!options.triggerOnce) {
        setIsVisible(false);
      }
    }, options);

    observer.observe(element);
    return () => observer.disconnect();
  }, [options.triggerOnce, options.threshold, options.root, options.rootMargin]);

  return [elementRef, isVisible] as const;
}

function useScrollPos() {
  const [scrollPos, setScrollPos] = useState(0);
  
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollPos(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return scrollPos;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  
  return isMobile;
}

// --- UTILS ---

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}

function createBlob(data: Float32Array, sampleRate: number) {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return { data: btoa(binary), mimeType: `audio/pcm;rate=${sampleRate}` };
}

// --- COMPONENTS ---

// Optimized HeroBackground with 3D Parallax Tilt
const HeroBackground = React.memo(({ videoSrc, posterSrc }: { videoSrc: string; posterSrc: string }) => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset loaded state when source changes to show the new poster immediately
  useEffect(() => {
    setIsVideoLoaded(false);
  }, [videoSrc]);

  useEffect(() => {
    let rafId: number;
    
    const animate = () => {
      if (!containerRef.current) return;
      
      const scrollY = window.scrollY;
      const height = window.innerHeight;
      
      // Optimization: Stop animating if scrolled well past the hero section
      // We keep animating a bit past viewport to ensure smooth exit
      if (scrollY <= height * 1.5) {
        const progress = Math.min(scrollY / height, 1);
        
        // Parallax Y movement (moves slower than scroll)
        const translateY = scrollY * 0.4;
        
        // Subtle 3D tilt: Rotates top away slightly as you scroll down
        const rotateX = progress * 8; 
        
        // Scale to maintain coverage and add "zoom" depth
        const scale = 1.1 + (progress * 0.05); 
        
        // Apply transform via direct DOM manipulation for performance
        containerRef.current.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale}) perspective(1000px) rotateX(${rotateX}deg)`;
      }
      
      rafId = requestAnimationFrame(animate);
    };
    
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div className="absolute inset-0 z-0 w-full h-full overflow-hidden bg-stone-900">
      <div 
        ref={containerRef}
        className="relative w-full h-full will-change-transform origin-center"
        style={{ transform: 'scale(1.1)' }} // Initial state
      >
        {/* Poster Image - Always present as fallback and initial state */}
        <img 
          src={posterSrc} 
          alt="Background" 
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 1, zIndex: 1 }}
        />
        
        {/* Video - Fades in only when data is ready */}
        <video
          key={videoSrc} // Force remount on source change for clean state
          src={videoSrc}
          poster={posterSrc}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out will-change-opacity`}
          style={{ opacity: isVideoLoaded ? 1 : 0, zIndex: 2 }}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onLoadedData={() => setIsVideoLoaded(true)}
        />
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-50 dark:from-stone-950 via-stone-50/50 dark:via-stone-950/50 to-transparent z-[3]" />
        <div className="absolute inset-0 bg-stone-900/30 z-[4]" />
      </div>
    </div>
  );
});

const CountUp: React.FC<{ value: string; className?: string }> = ({ value, className = "" }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [ref, isVisible] = useIntersectionObserver({ triggerOnce: true, threshold: 0.5 });
  
  const num = parseInt(value.replace(/,/g, ''), 10);
  const suffix = value.replace(/^[0-9,]+/, '');
  
  useEffect(() => {
    if (!isVisible) return;
    
    let startTime: number;
    const duration = 2000;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setDisplayValue(Math.floor(easeOut * num));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isVisible, num]);

  return (
    <span ref={ref as any} className={className}>
      {displayValue}{suffix}
    </span>
  );
};

const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string; direction?: string; distance?: number; trigger?: boolean | null }> = ({ 
  children, delay = 0, className = "", direction = "up", distance = 30, trigger = null
}) => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1, triggerOnce: true });
  
  const shouldShow = trigger !== null ? trigger : isVisible;

  const getTransform = () => {
    if (shouldShow) return "translate3d(0, 0, 0) scale(1)";
    switch (direction) {
      case 'up': return `translate3d(0, ${distance}px, 0)`;
      case 'down': return `translate3d(0, -${distance}px, 0)`;
      case 'scale': return 'scale(0.95)';
      case 'left': return `translate3d(-${distance}px, 0, 0)`;
      case 'right': return `translate3d(${distance}px, 0, 0)`;
      default: return 'none';
    }
  };

  return (
    <div 
      ref={ref as any}
      className={`transition-all duration-[1000ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-transform ${className}`}
      style={{ 
        opacity: shouldShow ? 1 : 0, 
        transform: getTransform(),
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );
};

const ParallaxImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [containerRef, isVisible] = useIntersectionObserver({ threshold: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible) return;

    let rafId: number;
    const update = () => {
      const container = containerRef.current;
      const wrapper = wrapperRef.current;
      
      if (container && wrapper) {
        const rect = container.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // Only calculate if in view or slightly near view
        if (rect.top < viewportHeight && rect.bottom > 0) {
          const distanceFromCenter = rect.top + rect.height / 2 - viewportHeight / 2;
          const y = distanceFromCenter * 0.08;
          wrapper.style.transform = `translate3d(0, ${y}px, 0)`;
        }
      }
      rafId = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(rafId);
  }, [isVisible]);

  return (
    <div 
      ref={containerRef as any} 
      className="relative mx-auto w-full aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-xl border-4 border-white dark:border-stone-900 bg-stone-200 dark:bg-stone-800 grayscale hover:grayscale-0 transition-all duration-700"
    >
      <div ref={wrapperRef} className="w-full h-[120%] -mt-[10%] will-change-transform">
        <img 
          src={src} 
          alt={alt} 
          loading="lazy" 
          decoding="async" 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out" 
        />
      </div>
    </div>
  );
};

const VoiceAssistant: React.FC<{ show: boolean }> = ({ show }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioRefs = useRef<{ inputCtx: AudioContext | null; outputCtx: AudioContext | null; sources: Set<AudioBufferSourceNode> }>({
    inputCtx: null, outputCtx: null, sources: new Set()
  });
  const nextStartTimeRef = useRef(0);

  const cleanup = () => {
    audioRefs.current.sources.forEach(s => { try { s.stop(); } catch {} });
    audioRefs.current.sources.clear();
    if (audioRefs.current.inputCtx) audioRefs.current.inputCtx.close();
    if (audioRefs.current.outputCtx) audioRefs.current.outputCtx.close();
    audioRefs.current.inputCtx = null; audioRefs.current.outputCtx = null;
    nextStartTimeRef.current = 0;
    setIsSpeaking(false);
  };

  const connect = async () => {
    if (!process.env.API_KEY) { setError("API Key missing"); return; }
    setIsConnecting(true); setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      audioRefs.current.inputCtx = inputCtx;
      audioRefs.current.outputCtx = outputCtx;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: { 
          responseModalities: [Modality.AUDIO], 
          systemInstruction: "You are the Burnout Lab assistant. Professional, empathetic, and scientific. Keep it brief. Help users with information about the Burnout Bootcamp retreat in Japan." 
        },
        callbacks: {
          onopen: () => {
            setIsActive(true); setIsConnecting(false);
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(2048, 1, 1);
            processor.onaudioprocess = (e) => {
              const pcm = createBlob(e.inputBuffer.getChannelData(0), 16000);
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcm }));
            };
            source.connect(processor); processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: any) => {
            if (msg.serverContent?.interrupted) {
              for (const source of audioRefs.current.sources.values()) {
                try { source.stop(); } catch {}
              }
              audioRefs.current.sources.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }

            const base64 = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64) {
              const buffer = await decodeAudioData(decodeBase64(base64), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer; source.connect(outputCtx.destination);
              
              source.addEventListener('ended', () => { 
                audioRefs.current.sources.delete(source); 
                if (audioRefs.current.sources.size === 0) setIsSpeaking(false);
              });
              
              nextStartTimeRef.current = Math.max(outputCtx.currentTime, nextStartTimeRef.current);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              audioRefs.current.sources.add(source);
              setIsSpeaking(true);
            }
          },
          onerror: () => { setError("Connection error"); setIsActive(false); setIsConnecting(false); cleanup(); },
          onclose: () => { setIsActive(false); cleanup(); }
        }
      });
    } catch (e) { setError("Microphone error"); setIsConnecting(false); }
  };

  if (!show && !isActive) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[90]">
      {!isActive ? (
        <button 
          onClick={connect}
          aria-label="Ask AI Assistant"
          className="w-16 h-16 bg-brand-600 hover:bg-brand-700 text-white rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 group relative shadow-2xl"
        >
          <div className="absolute inset-0 bg-brand-500 rounded-full animate-ping opacity-20 duration-1000" />
          <div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-150 transition-transform duration-500 rounded-full blur-xl" />
          <div className="relative z-10">
            {isConnecting ? <Loader2 className="animate-spin" /> : <Sparkles className="group-hover:animate-pulse" />}
          </div>
        </button>
      ) : (
        <div className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-2xl border border-stone-200 dark:border-stone-800 p-8 rounded-[2.5rem] shadow-2xl w-80 flex flex-col items-center animate-fade-in-up relative overflow-hidden">
           <div className={`absolute inset-0 transition-colors duration-1000 ${isSpeaking ? 'bg-indigo-500/5' : 'bg-brand-500/5'}`} />
           <div className="relative w-24 h-24 flex items-center justify-center mb-6">
             <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg ${isSpeaking ? 'bg-indigo-600 shadow-indigo-500/30' : 'bg-brand-600 shadow-brand-500/30'}`}>
               {isSpeaking ? <Activity className="text-white animate-pulse" size={28} /> : <Mic className="text-white" size={28} />}
             </div>
             {!isSpeaking && (
               <>
                 <div className="absolute inset-0 bg-brand-500 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] opacity-20" />
                 <div className="absolute inset-0 bg-brand-500 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] opacity-10 delay-75" style={{ animationDelay: '0.5s' }} />
               </>
             )}
             {isSpeaking && (
                <>
                  <div className="absolute inset-0 border-2 border-indigo-500 rounded-full animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite] opacity-30" />
                  <div className="absolute inset-0 border border-indigo-400 rounded-full animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite] opacity-20" style={{ animationDelay: '0.2s' }} />
                  <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-pulse" />
                </>
             )}
           </div>
           <div className="text-center relative z-10 space-y-2">
             <h4 className={`text-lg font-serif font-bold transition-colors duration-300 ${isSpeaking ? 'text-indigo-600 dark:text-indigo-400' : 'text-brand-600 dark:text-brand-500'}`}>
               {isSpeaking ? "Speaking..." : "Listening..."}
             </h4>
             <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
               {isSpeaking ? "BurnoutBot AI is replying" : "Ask me anything about the retreat"}
             </p>
           </div>
           <button onClick={() => { setIsActive(false); cleanup(); }} className="mt-6 px-6 py-2 bg-stone-100 dark:bg-stone-800 rounded-full text-xs font-bold hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors w-full">End Session</button>
           <button onClick={() => { setIsActive(false); cleanup(); }} aria-label="Close" className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors">
             <X size={16} />
           </button>
        </div>
      )}
      {error && <div className="absolute bottom-full right-0 mb-4 bg-red-500 text-white text-[10px] px-3 py-1 rounded-full whitespace-nowrap shadow-lg animate-fade-in-up">{error}</div>}
    </div>
  );
};

const Confetti: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: any[] = [];
    const colors = ['#e11d48', '#fb7185', '#fda4af', '#fff1f2', '#FFD700', '#F43F5E'];
    // Reduce particles for mobile to improve performance
    const particleCount = width < 768 ? 80 : 150;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: width / 2, y: height / 2, w: Math.random() * 8 + 4, h: Math.random() * 8 + 4,
        vx: (Math.random() - 0.5) * 25, vy: (Math.random() - 0.5) * 25 - 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        gravity: 0.4, drag: 0.95, rotation: Math.random() * 360, rotationSpeed: (Math.random() - 0.5) * 15
      });
    }

    let animationId: number;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.vx *= p.drag; p.vy *= p.drag; p.rotation += p.rotationSpeed;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      });
      animationId = requestAnimationFrame(render);
    };

    render();
    const resize = () => {
      if (canvasRef.current) {
        width = window.innerWidth;
        height = window.innerHeight;
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
    };
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(animationId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[300]" />;
};

const ModalOverlay: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  contentClassName?: string;
  backdropClassName?: string;
}> = ({ isOpen, onClose, children, contentClassName = "", backdropClassName = "bg-black/60 backdrop-blur-xl" }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => { requestAnimationFrame(() => setIsAnimating(true)); });
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setShouldRender(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className={`absolute inset-0 transition-opacity duration-500 ${backdropClassName} ${isAnimating ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose} 
      />
      <div className={`relative z-10 transition-all duration-500 ${isAnimating ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-8'} ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false); // Added state for video modal
  const [darkMode, setDarkMode] = useState(true); // Default to dark for premium feel
  const scrollPos = useScrollPos();
  const isMobile = useIsMobile();

  const toggleDark = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };
  
  // Logic for picking the correct video and poster based on state
  // Using useMemo to prevent unnecessary recalculations, though cheap
  const heroAssets = useMemo(() => {
    return isMobile 
      ? (darkMode ? ASSETS.HERO.MOBILE.DARK : ASSETS.HERO.MOBILE.LIGHT)
      : (darkMode ? ASSETS.HERO.DESKTOP.DARK : ASSETS.HERO.DESKTOP.LIGHT);
  }, [isMobile, darkMode]);

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 ${darkMode ? 'dark' : ''}`}>
      <div className="bg-stone-50 dark:bg-stone-950 min-h-screen text-stone-900 dark:text-stone-100">
        <Confetti />
        <VoiceAssistant show={true} />

        {/* Navigation */}
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollPos > 50 ? 'bg-white/80 dark:bg-stone-900/80 backdrop-blur-md py-4 shadow-lg' : 'py-6 bg-transparent'}`}>
          <div className="container mx-auto px-6 flex justify-between items-center">
            <div className="text-2xl font-serif font-bold tracking-tighter">
              Burnout<span className="text-brand-600">Lab</span>.
            </div>
            
            <div className="hidden md:flex items-center space-x-8 text-sm font-medium tracking-wide">
              {Object.entries(TRANSLATIONS.EN.nav).map(([key, label]) => (
                key !== 'book' && (
                  <button key={key} onClick={() => scrollTo(key)} className="hover:text-brand-500 transition-colors uppercase text-xs tracking-[0.15em]">
                    {label}
                  </button>
                )
              ))}
              <button onClick={toggleDark} className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors">
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button onClick={() => setIsModalOpen(true)} className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full transition-all hover:scale-105 shadow-lg shadow-brand-500/30">
                {TRANSLATIONS.EN.nav.book}
              </button>
            </div>

            <div className="md:hidden flex items-center space-x-4">
              <button onClick={toggleDark} className="p-2">
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button onClick={() => setIsMenuOpen(true)}>
                <Menu size={24} />
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        <ModalOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} contentClassName="w-full h-full flex items-center justify-center bg-white dark:bg-stone-950">
          <div className="flex flex-col items-center space-y-8 text-2xl font-serif">
            {Object.entries(TRANSLATIONS.EN.nav).map(([key, label]) => (
              <button key={key} onClick={() => key === 'book' ? setIsModalOpen(true) : scrollTo(key)} className="hover:text-brand-500">
                {label}
              </button>
            ))}
            <button onClick={() => setIsMenuOpen(false)} className="absolute top-6 right-6 p-2 rounded-full bg-stone-100 dark:bg-stone-800">
              <X size={24} />
            </button>
          </div>
        </ModalOverlay>

        {/* Hero Section */}
        <header className="relative h-screen min-h-[800px] flex items-center justify-center overflow-hidden">
          <HeroBackground videoSrc={heroAssets.VIDEO} posterSrc={heroAssets.POSTER} />

          <div className="relative z-10 container mx-auto px-6 h-full flex flex-col justify-center items-center text-center pb-32">
            <Reveal direction="down">
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8 text-xs font-bold tracking-[0.2em] uppercase text-white">
                <Calendar size={12} />
                <span>{TRANSLATIONS.EN.hero.date}</span>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif italic mb-6 leading-[0.9] text-white">
                {TRANSLATIONS.EN.hero.titlePrefix} <br />
                <span className="not-italic text-brand-400">{TRANSLATIONS.EN.hero.titleHighlight}</span>
              </h1>
            </Reveal>

            <Reveal delay={400}>
              <p className="max-w-xl mx-auto text-lg md:text-xl text-stone-200 mb-10 leading-relaxed font-light">
                {TRANSLATIONS.EN.hero.desc}
              </p>
            </Reveal>

            <Reveal delay={600} className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <button onClick={() => setIsModalOpen(true)} className="px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-sm font-bold tracking-widest uppercase transition-all hover:scale-105 shadow-xl shadow-brand-600/40 hover:shadow-brand-600/60 animate-soft-pulse hover:animate-none">
                {TRANSLATIONS.EN.hero.ctaApply}
              </button>
              <button 
                onClick={() => setIsVideoModalOpen(true)}
                className="flex items-center space-x-3 text-white hover:text-brand-300 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-brand-600 transition-colors animate-pulse-slow">
                  <Play size={18} className="ml-1 fill-current" />
                </div>
                <span className="text-sm font-bold tracking-widest uppercase">{TRANSLATIONS.EN.hero.watchVideo}</span>
              </button>
            </Reveal>
          </div>
        </header>

        {/* Stats Section - Updated */}
        <div className="relative z-10 -mt-12 max-w-7xl mx-auto px-6">
          <div className="bg-white dark:bg-stone-900 rounded-[3rem] shadow-2xl p-12 grid grid-cols-1 md:grid-cols-3 gap-12 items-center text-center border border-stone-100 dark:border-stone-800">
            {TRANSLATIONS.EN.stats.map((stat, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="text-5xl md:text-6xl font-serif text-stone-900 dark:text-stone-50 mb-2">
                  <CountUp value={stat.value} />
                </div>
                <div className="text-xs md:text-sm tracking-[0.2em] text-stone-500 dark:text-stone-400 uppercase font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* About Section */}
        <section id="about" className="py-32 container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <Reveal direction="right">
                 <span className="text-brand-600 font-bold tracking-[0.25em] text-xs uppercase">{TRANSLATIONS.EN.about.philosophy}</span>
                 <h2 className="text-5xl md:text-6xl font-serif text-stone-900 dark:text-white leading-[1.1] tracking-tight mb-6">{TRANSLATIONS.EN.about.title}</h2>
                 <p className="text-xl text-stone-600 dark:text-stone-300 leading-loose font-light">{TRANSLATIONS.EN.about.desc}</p>
              </Reveal>
              
              <Reveal delay={200} className="grid grid-cols-1 gap-8">
                 <div className="flex space-x-4">
                   <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-2xl h-min text-brand-600"><Brain size={24} /></div>
                   <div>
                     <h3 className="text-2xl font-serif mb-2 tracking-wide text-stone-900 dark:text-stone-100">{TRANSLATIONS.EN.about.neuroTitle}</h3>
                     <p className="text-base text-stone-500 dark:text-stone-400 leading-relaxed">{TRANSLATIONS.EN.about.neuroDesc}</p>
                   </div>
                 </div>
                 <div className="flex space-x-4">
                   <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-2xl h-min text-brand-600"><CheckCircle size={24} /></div>
                   <div>
                     <h3 className="text-2xl font-serif mb-2 tracking-wide text-stone-900 dark:text-stone-100">{TRANSLATIONS.EN.about.toolsTitle}</h3>
                     <p className="text-base text-stone-500 dark:text-stone-400 leading-relaxed">{TRANSLATIONS.EN.about.toolsDesc}</p>
                   </div>
                 </div>
              </Reveal>
            </div>
            <div className="relative">
               <ParallaxImage src={ASSETS.ABOUT_IMG} alt="Retreat Atmosphere" />
               <div className="absolute -bottom-8 -left-8 bg-white dark:bg-stone-800 p-8 rounded-[2rem] shadow-xl max-w-xs animate-float">
                 <Quote className="text-brand-400 mb-4" size={32} />
                 <p className="font-serif italic text-lg leading-snug">{TRANSLATIONS.EN.about.imageQuote}</p>
               </div>
            </div>
          </div>
        </section>

        {/* Schedule */}
        <section id="schedule" className="py-32 container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-5xl md:text-6xl font-serif mb-6 tracking-tight text-stone-900 dark:text-stone-100">{TRANSLATIONS.EN.schedule.title}</h2>
            <p className="text-stone-500 text-lg tracking-widest uppercase font-medium">{TRANSLATIONS.EN.schedule.subtitle}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
             {TRANSLATIONS.EN.schedule.days.map((day, i) => (
               <Reveal key={i} delay={i * 100} className="group p-8 bg-white dark:bg-stone-900 rounded-[2rem] border border-stone-100 dark:border-stone-800 hover:border-brand-200 dark:hover:border-brand-900 transition-all hover:shadow-xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 -mt-4 -mr-4 text-[8rem] font-serif text-stone-50 dark:text-stone-800/50 group-hover:text-brand-50 dark:group-hover:text-brand-900/20 transition-colors select-none pointer-events-none">
                   {day.ghost}
                 </div>
                 <div className="relative z-10">
                   <span className="text-xs font-bold tracking-[0.25em] text-brand-500 mb-4 block">{day.day}</span>
                   <h3 className="text-3xl font-serif mb-4 tracking-wide text-stone-900 dark:text-stone-100">{day.title}</h3>
                   <p className="text-base text-stone-500 dark:text-stone-400 leading-loose">{day.desc}</p>
                 </div>
               </Reveal>
             ))}
          </div>
        </section>

        {/* Team */}
        <section id="team" className="py-32 bg-stone-900 text-stone-100 rounded-t-[4rem] relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
          <div className="container mx-auto px-6 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16">
               <div>
                 <h2 className="text-4xl md:text-5xl font-serif mb-4">{TRANSLATIONS.EN.team.title}</h2>
                 <p className="text-stone-400 max-w-md">{TRANSLATIONS.EN.team.subtitle}</p>
               </div>
               <button className="hidden md:flex items-center space-x-2 text-brand-400 hover:text-brand-300 font-bold uppercase text-xs tracking-widest mt-8 md:mt-0">
                 <span>All Experts</span>
                 <ExternalLink size={14} />
               </button>
            </div>
            
            <div className="flex overflow-x-auto pb-8 space-x-6 scrollbar-hide snap-x">
              {TRANSLATIONS.EN.team.coaches.map((coach, i) => (
                <div key={i} className="min-w-[280px] md:min-w-[320px] snap-center">
                   <div className="aspect-[3/4] rounded-3xl overflow-hidden mb-6 relative group">
                     <img src={ASSETS.COACHES[i] || ASSETS.ABOUT_IMG} alt={coach.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                       <p className="text-sm text-stone-300">{coach.desc}</p>
                     </div>
                   </div>
                   <h3 className="text-xl font-serif">{coach.name}</h3>
                   <p className="text-sm text-brand-400 font-medium uppercase tracking-wider">{coach.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-32 container mx-auto px-6">
           <div className="bg-stone-900 text-white rounded-[3rem] p-8 md:p-16 relative overflow-hidden text-center">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(225,29,72,0.15),transparent_70%)]"></div>
              
              <div className="relative z-10 max-w-4xl mx-auto">
                <h2 className="text-4xl md:text-6xl font-serif mb-6">{TRANSLATIONS.EN.pricing.title}</h2>
                <p className="text-stone-400 mb-12 text-lg">{TRANSLATIONS.EN.pricing.subtitle}</p>
                
                <div className="grid md:grid-cols-2 gap-8 text-left">
                   <div className="p-8 rounded-3xl bg-stone-800 border border-stone-700 hover:border-stone-600 transition-colors">
                      <h3 className="text-2xl font-serif mb-2">{TRANSLATIONS.EN.pricing.shared}</h3>
                      <div className="text-3xl font-bold mb-6 text-brand-400">$2,390</div>
                      <ul className="space-y-4 mb-8">
                        {TRANSLATIONS.EN.pricing.features.slice(0, 3).map((f, i) => (
                          <li key={i} className="flex items-center space-x-3 text-sm text-stone-300">
                            <CheckCircle size={16} className="text-brand-500" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <button onClick={() => setIsModalOpen(true)} className="w-full py-4 rounded-xl border border-stone-600 hover:bg-stone-700 transition-colors font-bold text-sm uppercase tracking-wider">
                        {TRANSLATIONS.EN.pricing.select}
                      </button>
                   </div>
                   
                   <div className="p-8 rounded-3xl bg-stone-100 text-stone-900 relative">
                      <div className="absolute top-4 right-4 bg-brand-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                        {TRANSLATIONS.EN.pricing.popular}
                      </div>
                      <h3 className="text-2xl font-serif mb-2">{TRANSLATIONS.EN.pricing.single}</h3>
                      <div className="text-3xl font-bold mb-6 text-brand-600">$2,890</div>
                      <ul className="space-y-4 mb-8">
                        {TRANSLATIONS.EN.pricing.features.map((f, i) => (
                          <li key={i} className="flex items-center space-x-3 text-stone-600">
                            <CheckCircle size={16} className="text-brand-600" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <button onClick={() => setIsModalOpen(true)} className="w-full py-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition-colors font-bold text-sm uppercase tracking-wider shadow-xl shadow-brand-500/20">
                        {TRANSLATIONS.EN.pricing.select}
                      </button>
                   </div>
                </div>
              </div>
           </div>
        </section>

         {/* Lead Magnet Telegram (Moved from top) */}
         <section className="py-20 bg-stone-100 dark:bg-stone-900/50">
           <div className="container mx-auto px-6">
             <div className="bg-white dark:bg-stone-800 rounded-[3rem] p-8 md:p-12 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-32 bg-brand-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
                  <div>
                    <div className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-[10px] font-bold uppercase tracking-wider mb-6">
                       {TRANSLATIONS.EN.leadMagnet.badge}
                    </div>
                    <h3 className="text-3xl md:text-4xl font-serif mb-4">{TRANSLATIONS.EN.leadMagnet.title}</h3>
                    <p className="text-stone-600 dark:text-stone-300 mb-8">{TRANSLATIONS.EN.leadMagnet.desc}</p>
                    <a href="https://t.me/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-2 px-6 py-3 bg-[#24A1DE] hover:bg-[#208YbC] text-white rounded-full font-bold transition-all hover:-translate-y-1 shadow-lg shadow-[#24A1DE]/30">
                       <Send size={18} />
                       <span>{TRANSLATIONS.EN.leadMagnet.cta}</span>
                    </a>
                  </div>
                  
                  {/* Fake Chat UI */}
                  <div className="bg-stone-50 dark:bg-stone-950 rounded-3xl p-6 border border-stone-200 dark:border-stone-700 max-w-sm mx-auto w-full">
                     <div className="flex items-center space-x-3 mb-6 border-b border-stone-200 dark:border-stone-800 pb-4">
                       <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold">BB</div>
                       <div>
                         <div className="text-sm font-bold">{TRANSLATIONS.EN.leadMagnet.botName}</div>
                         <div className="text-xs text-brand-500">{TRANSLATIONS.EN.leadMagnet.botStatus}</div>
                       </div>
                     </div>
                     <div className="space-y-4 text-sm">
                        <div className="bg-white dark:bg-stone-800 p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[90%]">
                          {TRANSLATIONS.EN.leadMagnet.msg1}
                        </div>
                        <div className="bg-[#24A1DE] text-white p-3 rounded-2xl rounded-tr-none shadow-sm max-w-[90%] ml-auto">
                          {TRANSLATIONS.EN.leadMagnet.btnMsg}
                        </div>
                        <div className="bg-white dark:bg-stone-800 p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[90%]">
                          {TRANSLATIONS.EN.leadMagnet.msg2}
                          <div className="mt-2 flex items-center space-x-2 p-2 bg-stone-100 dark:bg-stone-900 rounded-xl">
                            <FileText className="text-red-500" size={20} />
                            <span className="text-xs font-bold truncate">{TRANSLATIONS.EN.leadMagnet.fileLabel}</span>
                          </div>
                        </div>
                     </div>
                  </div>
                </div>
             </div>
           </div>
        </section>

        {/* Download PDF Section (Restored) */}
        <section className="py-20 bg-brand-600 text-white text-center">
          <div className="container mx-auto px-6">
            <Reveal>
              <div className="max-w-3xl mx-auto space-y-8">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
                  <Download size={32} className="text-white" />
                </div>
                <h2 className="text-4xl md:text-5xl font-serif">{TRANSLATIONS.EN.download.title}</h2>
                <p className="text-brand-100 text-lg">{TRANSLATIONS.EN.download.desc}</p>
                <a 
                  href={ASSETS.PDF} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-3 px-8 py-4 bg-white text-brand-600 rounded-full font-bold uppercase tracking-widest hover:bg-stone-100 transition-all hover:scale-105 shadow-xl"
                >
                  <span>{TRANSLATIONS.EN.download.button}</span>
                  <FileDown size={20} />
                </a>
              </div>
            </Reveal>
          </div>
        </section>
        
        <footer className="bg-stone-100 dark:bg-stone-950 py-12 border-t border-stone-200 dark:border-stone-900">
           <div className="container mx-auto px-6 text-center">
              <div className="text-2xl font-serif font-bold tracking-tighter mb-8">
                Burnout<span className="text-brand-600">Lab</span>.
              </div>
              <div className="flex justify-center space-x-8 mb-8 text-sm text-stone-500">
                <a href="#" className="hover:text-brand-500">Instagram</a>
                <a href="#" className="hover:text-brand-500">LinkedIn</a>
                <a href="#" className="hover:text-brand-500">Telegram</a>
              </div>
              <div className="text-xs text-stone-400">
                &copy; 2026 Burnout Lab Japan. All rights reserved.
              </div>
           </div>
        </footer>
      </div>

      {/* Booking Modal */}
      <ModalOverlay isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="bg-white dark:bg-stone-900 p-8 rounded-[2rem] max-w-md w-full mx-4 shadow-2xl">
           <div className="flex justify-between items-center mb-6">
             <h3 className="text-2xl font-serif">{TRANSLATIONS.EN.modal.title}</h3>
             <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full">
               <X size={20} />
             </button>
           </div>
           <p className="text-stone-500 mb-6 text-sm">{TRANSLATIONS.EN.modal.desc}</p>
           <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert(TRANSLATIONS.EN.modal.success); setIsModalOpen(false); }}>
             <div>
               <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">{TRANSLATIONS.EN.modal.nameLabel}</label>
               <input type="text" className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-xl p-4 focus:ring-2 focus:ring-brand-500" required />
             </div>
             <div>
               <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">{TRANSLATIONS.EN.modal.phoneLabel}</label>
               <input type="tel" className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-xl p-4 focus:ring-2 focus:ring-brand-500" required />
             </div>
             <button type="submit" className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold uppercase tracking-widest transition-all">
               {TRANSLATIONS.EN.modal.submit}
             </button>
           </form>
        </div>
      </ModalOverlay>

      {/* Video Modal */}
      <ModalOverlay 
        isOpen={isVideoModalOpen} 
        onClose={() => setIsVideoModalOpen(false)}
        contentClassName="w-full max-w-6xl aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl mx-4"
        backdropClassName="bg-black/90 backdrop-blur-xl"
      >
        <div className="relative w-full h-full flex items-center justify-center bg-black">
            <button 
              onClick={() => setIsVideoModalOpen(false)} 
              className="absolute top-6 right-6 z-50 p-2 bg-black/50 hover:bg-stone-800 text-white/70 hover:text-white rounded-full transition-all backdrop-blur-md"
            >
              <X size={24} />
            </button>
            {isVideoModalOpen && (
              <video 
                src={ASSETS.FILM_VIDEO} 
                className="w-full h-full object-contain" 
                controls 
                autoPlay 
                playsInline
              />
            )}
        </div>
      </ModalOverlay>
    </div>
  );
}