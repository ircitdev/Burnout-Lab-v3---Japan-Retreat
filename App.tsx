import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, Users, Brain, CheckCircle, Menu, X, Moon, Sun, Play, Download, 
  Feather, Send, FileText, Activity, Loader2, Mic, Sparkles, Quote, AlertCircle, Copy, MessageSquare, Gift, FileDown,
  Smartphone, ExternalLink
} from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";
import { TG_CONFIG, ASSETS } from './config';

// --- STATIC DATA ---

const TRANSLATIONS = {
  EN: {
    nav: { about: "About", schedule: "Schedule", team: "Team", pricing: "Pricing", book: "Apply Now" },
    hero: {
      date: "March 30 — April 7, 2026 • Kochi, Japan",
      titlePrefix: "Burnout Bootcamp:",
      titleHighlight: "The Science of Reset",
      desc: "A neuroscience-based retreat for founders and leaders. Reset your nervous system in the silence of the Japanese mountains, devoid of esoteric fluff.",
      ctaApply: "Apply Now",
      ctaDetails: "Discover More",
      watchVideo: "Watch Film"
    },
    stats: [
      { value: "4", label: "YEARS RUNNING" },
      { value: "850+", label: "ALUMNI LEADERS" },
      { value: "30+", label: "SCIENTISTS & COACHES" }
    ],
    leadMagnet: {
      badge: "Free Lead Magnet",
      title: "What is your Burnout Score?",
      desc: "Take our 3-minute Telegram quiz and instantly get the 'Top 5 Stress Relief Protocols' PDF guide.",
      cta: "Start Quiz in Telegram",
      botName: "BurnoutBot AI",
      botStatus: "bot",
      msg1: "Hi! Ready to measure your cortisol risk?",
      btnMsg: "Yes, let's start",
      msg2: "Great! Here is your free guide",
      fileLabel: "Guide: Stress Relief.pdf"
    },
    about: {
      philosophy: "PHILOSOPHY",
      title: "Recovery Laboratory",
      desc: "High performance demands high-quality recovery. We replaced spirituality with neurobiology. An engineering approach to your wellbeing.",
      neuroTitle: "Neurobiology of Stress",
      neuroDesc: "Understand the mechanics of burnout and master your biochemistry through proven protocols.",
      toolsTitle: "100+ Recovery Tools",
      toolsDesc: "A personalized toolkit for emergency resets and long-term resilience.",
      cortisolLevel: "CORTISOL LEVEL",
      cortisolChange: "-45% in 4 days",
      imageQuote: "\"Nature does not hurry, yet everything is accomplished.\""
    },
    schedule: {
      title: "The Arc of Recovery",
      subtitle: "8 days of deep immersion in science and nature",
      days: [
        { day: "DAY 01", title: "Decompression", desc: "Arrival. Transition to silence. Scenic crossing of Awaji Island.", ghost: "1" },
        { day: "DAY 02", title: "Immersion", desc: "Mountain Lodge. Lectures on cortisol dynamics. Evening onsen.", ghost: "2" },
        { day: "DAY 03", title: "Embodiment", desc: "Fascia work. Reconnecting with the physical self. Cinema night.", ghost: "3" },
        { day: "DAY 04", title: "Digital Detox", desc: "Nikobuchi Waterfalls. Full disconnection. Psychology of resource.", ghost: "4" },
        { day: "DAY 05", title: "Contemplation", desc: "Sakura blooming. Ancient temples. Mindfulness practices.", ghost: "5" },
        { day: "DAY 06-07", title: "Integration", desc: "Synthesizing the experience. Building your Resilience Map.", ghost: "6" }
      ]
    },
    team: {
      title: "Your Mentors",
      subtitle: "A synthesis of Harvard academia and practical business coaching.",
      coaches: [
        { name: "Aksinia Mueller", role: "Stress Scientist, Harvard", desc: "Researches biological stress markers." },
        { name: "Juan Pablo Muñiz", role: "MBA, Co-founder", desc: "Crisis navigation expert. Coaches leaders." },
        { name: "Daniel Low", role: "PCC Coach", desc: "Master of creating safe spaces for deep internal work." },
        { name: "Shane Tan", role: "Quiet Power Coach", desc: "Specialist in introverted leadership and sustainable energy." },
        { name: "Anastasia Ilinikh", role: "Relationship EQ Coach", desc: "Expert in emotional intelligence and team dynamics." }
      ]
    },
    pricing: {
      title: "Invest in Your State",
      subtitle: "Intimate group. Only 12 spots available for maximum comfort.",
      shared: "Shared Room",
      single: "Single Room",
      popular: "Leader's Choice",
      select: "Select Package",
      features: ["7 nights accommodation", "Land Cruiser transfers", "Curated nutrition", "Resilience Map", "Private room", "Total confidentiality"]
    },
    download: {
      title: "Explore the Details",
      desc: "Download the full brochure with detailed itinerary and scientific basis.",
      button: "Download PDF (19MB)"
    },
    modal: {
      title: "Start Recovery",
      desc: "Leave your details. We will contact you for a brief interview.",
      nameLabel: "Your Name",
      phoneLabel: "Phone Number",
      typeLabel: "Accommodation",
      submit: "Submit Application",
      success: "Application Sent!",
      refLabel: "Reference Number",
      confirmMsg: "We've received your request. Our team will contact you within 24 hours."
    }
  }
};

// --- CUSTOM HOOKS ---

function useIntersectionObserver(options: IntersectionObserverInit & { triggerOnce?: boolean } = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (options.triggerOnce) observer.unobserve(entry.target);
      } else if (!options.triggerOnce) {
        setIsVisible(false);
      }
    }, options);

    if (elementRef.current) observer.observe(elementRef.current);
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

const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string; direction?: string; distance?: number }> = ({ 
  children, delay = 0, className = "", direction = "up", distance = 30 
}) => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1, triggerOnce: true });
  
  const getTransform = () => {
    if (isVisible) return "translate(0, 0) scale(1)";
    switch (direction) {
      case 'up': return `translateY(${distance}px)`;
      case 'down': return `translateY(-${distance}px)`;
      case 'scale': return 'scale(0.95)';
      case 'left': return `translateX(-${distance}px)`;
      case 'right': return `translateX(${distance}px)`;
      default: return 'none';
    }
  };

  return (
    <div 
      ref={ref as any}
      className={`transition-all duration-[1000ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-transform ${className}`}
      style={{ 
        opacity: isVisible ? 1 : 0, 
        transform: getTransform(),
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );
};

const ParallaxImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId: number;
    
    const update = () => {
      const container = containerRef.current;
      const wrapper = wrapperRef.current;
      
      if (container && wrapper) {
        const rect = container.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        if (rect.top < viewportHeight && rect.bottom > 0) {
          const distanceFromCenter = rect.top + rect.height / 2 - viewportHeight / 2;
          const y = distanceFromCenter * 0.08;
          wrapper.style.transform = `translateY(${y}px)`;
        }
      }
      rafId = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div 
      ref={containerRef} 
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

    for (let i = 0; i < 150; i++) {
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
      width = window.innerWidth; height = window.innerHeight; canvas.width = width; canvas.height = height;
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
    <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isAnimating ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
      <div className={`absolute inset-0 transition-opacity duration-500 ${backdropClassName}`} onClick={onClose} />
      <div className={`relative transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] ${isAnimating ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-8 opacity-0'} ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
};

// --- MAIN APPLICATION ---

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [refNumber, setRefNumber] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [telegramUrl, setTelegramUrl] = useState("https://t.me/BurnoutQuizBot?start=landingv2");

  const scrollY = useScrollPos();
  const t = TRANSLATIONS.EN;

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    if (isMenuOpen || isModalOpen || isVideoOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
  }, [isDarkMode, isMenuOpen, isModalOpen, isVideoOpen]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromParam = params.get('from') || 'landingv2';
    setTelegramUrl(`https://t.me/BurnoutQuizBot?start=${fromParam}`);
  }, []);

  const generateRef = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let res = 'REF-';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  const handleApply = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    const data = new FormData(e.currentTarget);
    const generatedRef = generateRef();
    setRefNumber(generatedRef);
    
    const params = new URLSearchParams(window.location.search);
    const fromVal = params.get('from');
    const utmSource = params.get('utm_source');
    const utmMedium = params.get('utm_medium');
    const utmCampaign = params.get('utm_campaign');
    const utmTerm = params.get('utm_term');
    const utmContent = params.get('utm_content');

    let msg = `<b>New Lead:</b>\nName: ${data.get('user-name')}\nPhone: ${data.get('user-phone')}\nAcc: ${data.get('accommodation-type')}\nRef: ${generatedRef}`;

    if (fromVal) msg += `\nFrom: ${fromVal}`;
    if (utmSource) msg += `\nSource: ${utmSource}`;
    if (utmMedium) msg += `\nMedium: ${utmMedium}`;
    if (utmCampaign) msg += `\nCampaign: ${utmCampaign}`;
    if (utmTerm) msg += `\nTerm: ${utmTerm}`;
    if (utmContent) msg += `\nContent: ${utmContent}`;

    try {
      const res = await fetch(`https://api.telegram.org/bot${TG_CONFIG.TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TG_CONFIG.CHAT_ID, message_thread_id: TG_CONFIG.THREAD_ID, text: msg, parse_mode: 'HTML' })
      });
      if (res.ok) {
        setSubmitStatus('success');
        setTimeout(() => { 
          setIsModalOpen(false); 
          setSubmitStatus('idle'); 
          setRefNumber('');
        }, 6000);
      } else {
        setSubmitStatus('error');
        setTimeout(() => setSubmitStatus('idle'), 3000);
      }
    } catch { 
      setSubmitStatus('error'); 
      setTimeout(() => setSubmitStatus('idle'), 3000);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen transition-colors duration-500 dark:bg-stone-950 bg-stone-50 overflow-x-hidden">
      {isLoading && <Preloader />}
      <ScrollProgress />
      
      {/* Navigation */}
      <nav className={`fixed w-full z-[100] transition-all duration-500 ${scrollY > 50 && !isMenuOpen ? 'bg-white/95 dark:bg-stone-950/95 backdrop-blur-md py-3 shadow-sm border-b dark:border-stone-800' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center relative">
          <a href="#" className="font-serif text-2xl font-bold dark:text-white tracking-tight z-[110]">
            Burnout<span className="text-brand-600 italic">Lab</span>
          </a>
          
          <div className="hidden md:flex items-center space-x-10">
            {['about', 'schedule', 'team', 'pricing'].map(item => (
              <a key={item} href={`#${item}`} className="text-sm font-medium dark:text-stone-300 hover:text-brand-600 transition-colors capitalize tracking-wide">{item}</a>
            ))}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              aria-label="Toggle Theme"
              className="p-2 dark:text-stone-200 text-stone-700 hover:text-brand-600 transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setIsModalOpen(true)} className="px-6 py-2 bg-stone-900 dark:bg-brand-600 text-white rounded-full text-sm font-bold shadow-lg hover:scale-105 active:scale-95 transition-all">
              {t.nav.book}
            </button>
          </div>

          <div className="md:hidden flex items-center space-x-4 z-[110]">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              aria-label="Toggle Theme"
              className="dark:text-white p-2 text-stone-800"
            >
              {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
            </button>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              aria-label={isMenuOpen ? "Close Menu" : "Open Menu"}
              aria-expanded={isMenuOpen}
              className="dark:text-white p-2 text-stone-800 transition-transform active:scale-90"
            >
              {isMenuOpen ? <X size={32} /> : <Menu size={32} />}
            </button>
          </div>
        </div>

        <div className={`fixed inset-0 z-[105] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible delay-300'}`}>
          <div className={`absolute inset-0 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-[20px] backdrop-saturate-150 transition-all duration-700 ease-out ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`} />
          <div className={`absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-brand-400/20 rounded-full blur-[100px] animate-pulse-slow transition-all duration-1000 ${isMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`} />
          <div className={`absolute bottom-[-10%] left-[-20%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse-slow transition-all duration-1000 delay-300 ${isMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`} />

          <div className="relative flex flex-col items-center justify-center h-full px-6 space-y-12 overflow-y-auto pt-20">
            <div className="flex flex-col space-y-8 text-center">
              {['about', 'schedule', 'team', 'pricing'].map((item, idx) => (
                <div key={item} className={`transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] ${isMenuOpen ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-12 blur-md'}`} style={{ transitionDelay: isMenuOpen ? `${150 + idx * 100}ms` : '0ms' }}>
                  <a href={`#${item}`} onClick={() => setIsMenuOpen(false)} className="text-5xl font-serif dark:text-white capitalize tracking-tighter hover:text-brand-600 transition-all block relative group">
                    <span className="relative z-10">{item}</span>
                    <span className="absolute -inset-x-4 h-px bg-brand-600 bottom-0 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                  </a>
                </div>
              ))}
            </div>
            
            <div className={`pt-12 w-full max-w-sm transition-all duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] ${isMenuOpen ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-20 blur-md'}`} style={{ transitionDelay: isMenuOpen ? '550ms' : '0ms' }}>
              <button onClick={() => { setIsModalOpen(true); setIsMenuOpen(false); }} className="w-full py-6 bg-brand-600 text-white rounded-[2rem] font-bold shadow-2xl active:scale-95 transition-all text-xl flex items-center justify-center space-x-3 group overflow-hidden relative">
                <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <Calendar className="relative z-10" />
                <span className="relative z-10">{t.nav.book}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative h-screen flex flex-col items-center justify-center overflow-hidden bg-stone-950">
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
             <video autoPlay loop muted playsInline className="w-full h-full object-cover transition-transform duration-75 ease-out will-change-transform" style={{ transform: `scale(${1 + scrollY * 0.0005})` }}>
              <source src={ASSETS.VIDEO_MOBILE} media="(max-width: 767px)" type="video/mp4" />
              <source src={ASSETS.VIDEO_BG} media="(min-width: 768px)" type="video/mp4" />
            </video>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 z-10" />
        <div className="absolute inset-0 bg-stone-950 z-10 pointer-events-none will-change-[opacity]" style={{ opacity: Math.min(scrollY / (window.innerHeight * 0.7), 1) * 0.9 }} />
        
        <div className="relative z-20 text-center px-6 max-w-4xl pt-16">
          <Reveal direction="down" distance={20} delay={100}>
            <span className="inline-block px-5 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full text-white text-[11px] font-bold mb-10 uppercase tracking-[0.2em] shadow-lg">{t.hero.date}</span>
          </Reveal>
          <Reveal delay={300} direction="up" distance={30} className="mb-8">
            <h1 className="text-4xl md:text-8xl font-serif text-white leading-[1.1] tracking-tight drop-shadow-2xl">{t.hero.titlePrefix} <br/><span className="italic text-brand-200 font-light">{t.hero.titleHighlight}</span></h1>
          </Reveal>
          <Reveal delay={500} direction="up" distance={20} className="mb-14">
            <p className="text-lg md:text-2xl text-stone-200 font-light max-w-2xl mx-auto leading-relaxed drop-shadow-md">{t.hero.desc}</p>
          </Reveal>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            <Reveal delay={700} direction="up" distance={20}>
              <button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto px-12 py-5 bg-brand-600 text-white rounded-full font-bold shadow-2xl hover:bg-brand-700 hover:-translate-y-1 active:scale-95 transition-all animate-pulse-glow">{t.hero.ctaApply}</button>
            </Reveal>
            <Reveal delay={850} direction="up" distance={20}>
              <button onClick={() => setIsVideoOpen(true)} className="flex items-center space-x-4 text-white font-medium hover:text-brand-200 transition-all group animate-soft-pulse" style={{ animationDelay: '1s' }}>
                <span className="w-14 h-14 rounded-full border border-white/30 bg-white/5 backdrop-blur-sm flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all shadow-lg scale-100 group-hover:scale-110"><Play size={18} fill="currentColor" /></span>
                <span className="text-[12px] font-bold uppercase tracking-wide">{t.hero.watchVideo}</span>
              </button>
            </Reveal>
          </div>
        </div>
      </header>

      {/* Stats Block */}
      <section className="relative z-30 -mt-16 md:-mt-20 px-6 max-w-7xl mx-auto">
        <Reveal direction="up" distance={40} delay={1400}>
          <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] md:rounded-[4rem] shadow-2xl overflow-hidden border border-stone-100 dark:border-stone-800 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone-100 dark:divide-stone-800">
            {t.stats.map((stat, i) => (
              <div key={i} className="p-8 md:p-12 text-center group hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors cursor-default">
                <div className="transition-all duration-300 ease-out group-hover:scale-110 group-hover:drop-shadow-lg">
                  <div className="text-4xl md:text-6xl font-serif font-bold text-stone-900 dark:text-white mb-3 group-hover:text-brand-600 transition-colors">{stat.value}</div>
                  <div className="text-[10px] md:text-[11px] font-bold text-stone-400 dark:text-stone-500 tracking-[0.3em] uppercase">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 px-6 bg-stone-50 dark:bg-stone-950">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <Reveal direction="left">
            <div className="space-y-10">
              <div className="flex items-center space-x-4">
                <div className="h-[2px] w-12 bg-brand-600" />
                <span className="text-xs font-bold text-brand-600 tracking-[0.2em] uppercase">{t.about.philosophy}</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-serif dark:text-white leading-[1.15]">{t.about.title}</h2>
              <p className="text-lg md:text-xl text-stone-600 dark:text-stone-400 leading-relaxed font-light">{t.about.desc}</p>
              <div className="space-y-8 pt-4">
                 {[ 
                   { icon: Brain, title: t.about.neuroTitle, desc: t.about.neuroDesc },
                   { icon: Activity, title: t.about.toolsTitle, desc: t.about.toolsDesc } 
                 ].map((feat, idx) => (
                   <div key={idx} className="flex space-x-8 group">
                     <div className="w-14 h-14 bg-white dark:bg-stone-900 rounded-2xl flex items-center justify-center shrink-0 shadow-md border border-stone-100 dark:border-stone-800 group-hover:border-brand-300 transition-colors">
                       <feat.icon className="text-brand-600" size={26} />
                     </div>
                     <div>
                       <h4 className="font-bold dark:text-white mb-2 text-lg">{feat.title}</h4>
                       <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">{feat.desc}</p>
                     </div>
                   </div>
                 ))}
              </div>
            </div>
          </Reveal>
          <Reveal direction="right" className="relative">
            <div className="rounded-[4rem] overflow-hidden shadow-2xl aspect-[4/5] relative group border-8 border-white dark:border-stone-900">
              <img src={ASSETS.ABOUT_IMG} loading="lazy" decoding="async" alt="Japan Retreat" className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-10 inset-x-8 md:inset-x-12 p-6 md:p-8 bg-black/40 backdrop-blur-md rounded-[2.5rem] border border-white/10 shadow-2xl">
                <p className="text-white font-serif italic text-xl md:text-2xl text-center leading-relaxed drop-shadow-md">{t.about.imageQuote}</p>
              </div>
            </div>
            <div className="absolute -bottom-10 -left-6 p-8 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-stone-100 dark:border-stone-800 animate-float z-30">
               <div className="text-[10px] font-bold text-stone-400 tracking-[0.2em] mb-2 uppercase">{t.about.cortisolLevel}</div>
               <div className="text-3xl font-bold text-brand-600 dark:text-brand-500">{t.about.cortisolChange}</div>
               <div className="w-full bg-stone-100 dark:bg-stone-800 h-1 rounded-full mt-4 overflow-hidden">
                  <div className="bg-brand-500 h-full w-[45%] rounded-full" />
               </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Schedule */}
      <section id="schedule" className="py-32 bg-stone-100 dark:bg-stone-900/40 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <Reveal><h2 className="text-4xl md:text-6xl font-serif dark:text-white mb-6">{t.schedule.title}</h2></Reveal>
            <Reveal delay={200}><p className="text-stone-500 dark:text-stone-400 text-lg md:text-xl font-light">{t.schedule.subtitle}</p></Reveal>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {t.schedule.days.map((d, i) => (
              <Reveal key={i} delay={i * 150}>
                <div className="p-12 bg-white dark:bg-stone-900 rounded-[3.5rem] h-full border border-stone-100 dark:border-stone-800 hover:border-brand-500/30 transition-all duration-500 group relative overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2">
                  <span className="absolute -top-4 -right-2 text-[140px] font-serif font-black text-stone-200/60 dark:text-stone-700/50 leading-none select-none group-hover:text-brand-500/10 transition-colors z-0">{d.ghost}</span>
                  <div className="relative z-10 space-y-8">
                    <span className="inline-block px-4 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-[10px] font-bold text-brand-600 tracking-[0.2em] rounded-full uppercase">{d.day}</span>
                    <h3 className="text-2xl font-serif dark:text-white leading-tight group-hover:text-brand-600 transition-colors">{d.title}</h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed font-light">{d.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Mentors */}
      <section id="team" className="py-32 px-6 bg-white dark:bg-stone-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <Reveal><h2 className="text-4xl md:text-6xl font-serif dark:text-white mb-6">{t.team.title}</h2></Reveal>
            <Reveal delay={200}><p className="text-stone-500 dark:text-stone-400 text-lg font-light">{t.team.subtitle}</p></Reveal>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            {t.team.coaches.map((coach, i) => (
              <Reveal key={i} delay={i * 150} direction="up" distance={40}>
                <div className="group text-center space-y-6">
                  <ParallaxImage src={ASSETS.COACHES[i]} alt={coach.name} />
                  <div className="space-y-2">
                    <h4 className="text-xl font-serif dark:text-white leading-tight">{coach.name}</h4>
                    <p className="text-brand-600 dark:text-brand-500 text-[10px] font-bold uppercase tracking-widest">{coach.role}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs mx-auto leading-relaxed px-2">{coach.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 px-6 bg-stone-50 dark:bg-stone-900/20">
        <div className="max-w-7xl mx-auto">
           <div className="text-center mb-20">
            <Reveal><h2 className="text-4xl md:text-6xl font-serif dark:text-white mb-6">{t.pricing.title}</h2></Reveal>
            <Reveal delay={200}><p className="text-stone-500 dark:text-stone-400 text-lg font-light">{t.pricing.subtitle}</p></Reveal>
          </div>
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <Reveal direction="left">
               <div className="p-12 bg-white dark:bg-stone-900 rounded-[4rem] border border-stone-200 dark:border-stone-800 transition-all hover:shadow-xl flex flex-col h-full">
                 <h3 className="text-2xl font-bold dark:text-white mb-4">{t.pricing.shared}</h3>
                 <div className="text-5xl font-serif mb-10 dark:text-white">$2,390</div>
                 <ul className="space-y-5 mb-12 flex-grow">
                   {t.pricing.features.slice(0,4).map((f, i) => (
                     <li key={i} className="flex items-center text-sm text-stone-600 dark:text-stone-400"><CheckCircle size={18} className="text-brand-600 mr-4" />{f}</li>
                   ))}
                 </ul>
                 <button onClick={() => setIsModalOpen(true)} className="w-full py-5 rounded-2xl bg-stone-50 dark:bg-stone-800 dark:text-white font-bold hover:bg-brand-600 hover:text-white transition-all active:scale-95">Select Plan</button>
               </div>
            </Reveal>
            <Reveal direction="right">
               <div className="p-12 bg-stone-900 dark:bg-stone-800 text-white rounded-[4rem] shadow-2xl relative overflow-hidden flex flex-col h-full">
                 <div className="absolute top-0 right-0 px-6 py-2 bg-brand-600 text-[10px] font-bold uppercase tracking-widest rounded-bl-3xl">{t.pricing.popular}</div>
                 <h3 className="text-2xl font-bold mb-4">{t.pricing.single}</h3>
                 <div className="text-5xl font-serif mb-10">$2,890</div>
                 <ul className="space-y-5 mb-12 flex-grow">
                   {t.pricing.features.map((f, i) => (
                     <li key={i} className="flex items-center text-sm text-stone-300"><CheckCircle size={18} className="text-brand-600 mr-4" />{f}</li>
                   ))}
                 </ul>
                 <button onClick={() => setIsModalOpen(true)} className="w-full py-5 rounded-2xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition-all active:scale-95">Book Now</button>
               </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Free Lead Magnet Section */}
      <section className="py-32 px-6">
        <Reveal direction="up" distance={60}>
          <div className="max-w-7xl mx-auto bg-gradient-to-br from-[#4b1d8e] via-[#6d1a92] to-[#b61545] rounded-[3rem] md:rounded-[5rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(75,29,142,0.4)] relative border border-white/10 group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/30 blur-[120px] rounded-full -mr-20 -mt-20 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/20 blur-[100px] rounded-full -ml-20 -mb-20 animate-pulse-slow" />
            
            <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center p-10 md:p-24">
              <div className="space-y-10">
                <div className="inline-flex items-center space-x-3 px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-[11px] font-bold uppercase tracking-[0.15em]">
                  <Sparkles size={14} className="text-brand-300" />
                  <span>{t.leadMagnet.badge}</span>
                </div>
                <h2 className="text-4xl md:text-7xl font-serif text-white leading-tight tracking-tight">{t.leadMagnet.title}</h2>
                <p className="text-xl md:text-2xl text-stone-200/90 font-light leading-relaxed max-w-lg">{t.leadMagnet.desc}</p>
                <div className="pt-6">
                  <a href={telegramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-5 px-10 py-5 bg-white text-[#4b1d8e] rounded-2xl font-bold shadow-2xl hover:bg-stone-100 hover:-translate-y-1 transition-all active:scale-95 group/btn text-lg">
                    <MessageSquare size={22} className="group-hover/btn:scale-110 transition-transform" />
                    <span>{t.leadMagnet.cta}</span>
                  </a>
                </div>
              </div>

              <div className="relative lg:justify-self-end w-full max-w-[420px]">
                <div className="bg-[#1c1c1e] rounded-[3rem] p-4 shadow-[0_50px_100px_rgba(0,0,0,0.5)] border-[8px] border-[#2c2c2e] overflow-hidden aspect-[4/5] relative flex flex-col">
                  <div className="flex items-center space-x-3 p-3 border-b border-white/5 mb-4">
                    <div className="w-10 h-10 bg-[#5856d6] rounded-full flex items-center justify-center text-white"><Brain size={20} /></div>
                    <div>
                      <div className="text-white text-sm font-bold">{t.leadMagnet.botName}</div>
                      <div className="text-[#5856d6] text-[10px] font-medium tracking-wide uppercase">{t.leadMagnet.botStatus}</div>
                    </div>
                  </div>
                  <div className="flex-grow space-y-6 overflow-hidden">
                    <div className="bg-[#2c2c2e] text-white p-4 rounded-[1.5rem] rounded-tl-none max-w-[85%] text-sm animate-fade-in-up">{t.leadMagnet.msg1}</div>
                    <div className="flex justify-end animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                      <div className="bg-brand-600 text-white p-3 rounded-[1.5rem] rounded-tr-none text-sm font-medium">{t.leadMagnet.btnMsg}</div>
                    </div>
                    <div className="bg-[#2c2c2e] text-white p-5 rounded-[2rem] rounded-tl-none max-w-[90%] space-y-4 animate-fade-in-up shadow-lg border border-white/5" style={{ animationDelay: '1000ms' }}>
                      <p className="text-sm">{t.leadMagnet.msg2} 🎁</p>
                      <div className="bg-white/5 p-4 rounded-2xl flex items-center space-x-4 border border-white/10 group/file cursor-pointer hover:bg-white/10 transition-colors">
                        <div className="w-12 h-12 bg-brand-600/20 text-brand-500 rounded-xl flex items-center justify-center"><FileText size={24} /></div>
                        <div className="flex-grow">
                          <div className="text-xs font-bold text-white mb-0.5">{t.leadMagnet.fileLabel}</div>
                          <div className="text-[10px] text-stone-500 font-medium">PDF • 4.2 MB</div>
                        </div>
                        <FileDown size={18} className="text-stone-400 group-hover/file:text-white transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-brand-500 rounded-2xl shadow-2xl flex items-center justify-center text-white rotate-12 animate-float">
                  <Gift size={32} />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="py-24 bg-stone-950 text-center px-6 border-t border-stone-800">
        <Reveal direction="scale">
           <Feather size={56} className="mx-auto text-stone-800 mb-8" />
           <h2 className="text-4xl md:text-5xl font-serif text-white mb-8 tracking-tight">{t.download.title}</h2>
           <p className="text-stone-500 mb-14 max-w-xl mx-auto text-lg leading-relaxed font-light">{t.download.desc}</p>
           <a href={ASSETS.PDF} target="_blank" className="inline-flex items-center space-x-4 px-12 py-5 bg-white rounded-full text-black font-bold hover:bg-stone-200 transition-all hover:-translate-y-1 active:scale-95 shadow-2xl">
             <Download size={20} />
             <span className="text-lg">{t.download.button}</span>
           </a>
           <div className="mt-24 pt-12 border-t border-white/5 text-stone-700 text-[10px] font-bold uppercase tracking-[0.3em]">&copy; 2026 Burnout Lab Japan • Engineering Better Living</div>
        </Reveal>
      </footer>

      <VoiceAssistant show={scrollY > 300} />

      {/* Booking Modal */}
      <ModalOverlay isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} contentClassName="w-full max-w-md bg-white dark:bg-stone-900 rounded-[3.5rem] shadow-2xl overflow-hidden p-10 md:p-14">
        <button onClick={() => setIsModalOpen(false)} aria-label="Close" className="absolute top-8 right-8 dark:text-white text-stone-400 hover:text-brand-600 transition-colors z-20"><X size={28} /></button>
        {submitStatus === 'success' ? (
          <div className="text-center py-6">
            <Confetti />
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-brand-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-24 h-24 mx-auto text-green-500 relative z-10">
                <circle cx="12" cy="12" r="10" className="animate-draw" style={{ strokeDasharray: 100, animationDelay: '0s' }} />
                <path d="m9 12 2 2 4-4" className="animate-draw" style={{ strokeDasharray: 100, animationDelay: '0.4s' }} />
              </svg>
            </div>
            <h3 className="text-4xl font-serif dark:text-white mb-4 tracking-tight animate-fade-in-up" style={{ animationDelay: '0.6s' }}>{t.modal.success}</h3>
            <p className="text-stone-500 dark:text-stone-400 text-sm mb-10 leading-relaxed px-4 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>{t.modal.confirmMsg}</p>
            <div className="bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 p-6 rounded-3xl mb-4 relative group animate-subtle-bounce" style={{ animationDelay: '0.8s' }}>
              <p className="text-[10px] font-bold text-stone-400 tracking-[0.2em] mb-2 uppercase">{t.modal.refLabel}</p>
              <div className="text-3xl font-mono font-bold dark:text-white tracking-widest flex items-center justify-center space-x-3">
                <span>{refNumber}</span>
                <button onClick={() => navigator.clipboard.writeText(refNumber)} className="p-2 text-stone-400 hover:text-brand-600 transition-colors" title="Copy Reference"><Copy size={18} /></button>
              </div>
            </div>
            <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full mt-10 overflow-hidden">
              <div className="bg-brand-500 h-full animate-[grow_6s_linear_forwards]" />
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-4xl font-serif dark:text-white mb-3 tracking-tight">{t.modal.title}</h3>
            <p className="text-stone-500 dark:text-stone-400 text-sm mb-10 leading-relaxed">{t.modal.desc}</p>
            <form onSubmit={handleApply} className="space-y-6">
              <div className="space-y-1 opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <input name="user-name" required className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-2xl p-5 focus:ring-2 focus:ring-brand-600 dark:text-white transition-all" placeholder={t.modal.nameLabel} />
              </div>
              <div className="space-y-1 opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <input name="user-phone" required type="tel" className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-2xl p-5 focus:ring-2 focus:ring-brand-600 dark:text-white transition-all" placeholder={t.modal.phoneLabel} />
              </div>
              <div className="space-y-1 opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <select name="accommodation-type" className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-2xl p-5 focus:ring-2 focus:ring-brand-600 dark:text-white transition-all cursor-pointer">
                  <option value="Single">Single Suite</option>
                  <option value="Shared">Shared Room</option>
                </select>
              </div>
              <button disabled={isSubmitting || submitStatus !== 'idle'} className={`w-full py-5 rounded-2xl font-bold shadow-xl flex items-center justify-center space-x-3 transition-all duration-500 text-lg opacity-0 animate-fade-in-up ${submitStatus === 'idle' ? 'bg-brand-600 hover:bg-brand-700 active:scale-95' : ''} ${submitStatus === 'error' ? 'bg-red-600 animate-shake' : ''} text-white disabled:opacity-70 disabled:cursor-not-allowed`} style={{ animationDelay: '400ms' }}>
                {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : submitStatus === 'error' ? <div className="flex items-center space-x-2"><AlertCircle size={24} /><span>Error</span></div> : <span>{t.modal.submit}</span>}
              </button>
            </form>
          </>
        )}
      </ModalOverlay>

      {/* Video Modal */}
      <ModalOverlay isOpen={isVideoOpen} onClose={() => setIsVideoOpen(false)} contentClassName="w-full max-w-6xl aspect-video rounded-[2rem] shadow-[0_0_100px_rgba(244,63,94,0.3)] border border-white/10 bg-black relative" backdropClassName="bg-black/95 backdrop-blur-xl">
        <button onClick={() => setIsVideoOpen(false)} aria-label="Close" className="absolute -top-12 -right-2 text-white/50 hover:text-white p-2 transition-colors z-20"><X size={36} /></button>
        <video controls autoPlay className="w-full h-full rounded-[2rem]">
          <source src={ASSETS.FILM_VIDEO} />
        </video>
      </ModalOverlay>
    </div>
  );
}

// --- HELPERS ---

const Preloader = () => (
  <div className="fixed inset-0 z-[300] bg-stone-950 flex flex-col items-center justify-center animate-fade-out" style={{ animationDelay: '1.2s' }}>
    <Brain size={80} className="text-brand-600 animate-pulse-slow mb-8" />
    <h2 className="text-white font-serif tracking-[0.5em] uppercase text-2xl">Burnout<span className="text-brand-600 italic">Lab</span></h2>
    <div className="w-48 h-[1px] bg-white/10 mt-12 overflow-hidden relative">
      <div className="absolute inset-0 bg-brand-600 animate-grow" />
    </div>
  </div>
);

const ScrollProgress = () => {
  const [w, setW] = useState(0);
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setW((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return <div className="fixed top-0 left-0 h-1 bg-brand-600 z-[110] transition-all duration-200" style={{ width: `${w}%` }} />;
};