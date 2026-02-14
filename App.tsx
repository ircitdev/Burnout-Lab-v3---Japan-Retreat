
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { 
  Calendar, Users, Brain, CheckCircle, Menu, X, Moon, Sun, Play, Download, 
  Feather, Send, FileText, Star, Quote, Facebook, Twitter, Linkedin, Activity, Loader2, AlertCircle, Mic, Sparkles
} from 'lucide-react';

// --- STATIC DATA ---

const TG_CONFIG = {
  TOKEN: "8394461945:AAEPNj0xw9UKweOgBwAGWSAMGBZoahvafTg",
  CHAT_ID: "-1003882096815",
  THREAD_ID: 5
};

const ASSETS = {
  PDF: "https://storage.googleapis.com/uspeshnyy-projects/burnout/Kochi%20Sakura%20-%20Burnout%20Bootcamp%20(April%202026).pdf",
  VIDEO_BG: "https://storage.googleapis.com/uspeshnyy-projects/burnout/hero.mp4",
  VIDEO_MOBILE: "https://storage.googleapis.com/uspeshnyy-projects/burnout/hero_m.mp4",
  FILM_VIDEO: "https://storage.googleapis.com/uspeshnyy-projects/burnout/kochi.mp4",
  ABOUT_IMG: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop",
  COACHES: [
    "https://storage.googleapis.com/uspeshnyy-projects/burnout/aksinia.jpg",
    "https://storage.googleapis.com/uspeshnyy-projects/burnout/Juan.jpg",
    "https://storage.googleapis.com/uspeshnyy-projects/burnout/Daniel.jpg",
    "https://storage.googleapis.com/uspeshnyy-projects/burnout/Shane.jpg",
    "https://storage.googleapis.com/uspeshnyy-projects/burnout/Anastasia.jpg"
  ]
};

const TRANSLATIONS = {
  EN: {
    nav: { about: "About", schedule: "Schedule", team: "Team", pricing: "Pricing", book: "Apply Now" },
    hero: {
      date: "March 30 — April 7, 2026 • Kochi, Japan",
      titlePrefix: "Bootcamp:",
      titleHighlight: "The Science of Reset",
      desc: "A neuroscience-based retreat for founders and leaders. Reset your nervous system in the silence of the Japanese mountains.",
      ctaApply: "Apply Now",
      ctaDetails: "Discover More",
      watchVideo: "Watch Film"
    },
    stats: { years: "years running", participants: "alumni leaders", experts: "scientists & coaches" },
    about: {
      philosophy: "PHILOSOPHY",
      title: "Recovery Laboratory",
      desc: "High performance demands high-quality recovery. We replaced spirituality with neurobiology. An engineering approach to your wellbeing.",
      neuroTitle: "Neurobiology of Stress",
      neuroDesc: "Understand the mechanics of burnout and master your biochemistry through proven protocols.",
      toolsTitle: "100+ Recovery Tools",
      toolsDesc: "A personalized toolkit for emergency resets and long-term resilience.",
      japanTitle: "Healing Environment",
      japanDesc: "Cedar forests and ancient onsens — the perfect context to activate the parasympathetic system.",
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
        { name: "Daniel Low", role: "PCC Coach", desc: "Master of creating safe spaces for deep work." }
      ]
    },
    testimonials: {
      title: "Alumni Stories",
      subtitle: "Hear from leaders who have successfully reset their systems.",
      list: [
        { name: "Alex K.", role: "CEO, Fintech", quote: "The scientific approach convinced me. Energy levels are back." },
        { name: "Maria S.", role: "Founder, EdTech", quote: "The silence and digital detox was exactly what my brain needed." },
        { name: "Dimitri V.", role: "VC Investor", quote: "I use the stress regulation tools I learned here daily." }
      ]
    },
    quiz: {
      title: "What is your Burnout Score?",
      subtitle: "Take our 3-minute Telegram quiz and get the 'Top 5 Protocols' PDF guide.",
      button: "Start Quiz in Telegram",
      bubbleBot1: "Ready to measure your cortisol risk?",
      bubbleUser: "Yes, let's start",
      bubbleBot2: "Great! Here is your free guide 🎁",
      magnetTitle: "Guide: Stress Relief.pdf"
    },
    pricing: {
      title: "Invest in Your State",
      subtitle: "Intimate group. Only 12 spots available for maximum comfort.",
      shared: "Shared Room",
      single: "Single Room",
      popular: "Leader's Choice",
      select: "Select Package",
      book: "Book Single",
      features: ["7 nights accommodation", "Land Cruiser transfers", "Curated nutrition", "Resilience Map", "Private room", "Total confidentiality"]
    },
    download: {
      title: "Explore the Details",
      desc: "Download the full brochure with detailed itinerary and scientific basis.",
      button: "Download PDF (12MB)"
    },
    modal: {
      title: "Start Recovery",
      desc: "Leave your details. We will contact you for a brief interview.",
      nameLabel: "Your Name",
      emailLabel: "Email",
      phoneLabel: "Phone Number",
      typeLabel: "Accommodation",
      submit: "Submit Application",
      sending: "Sending...",
      success: "Application Sent!",
      error: "Error. Please try again."
    }
  }
};

// --- CUSTOM HOOKS ---

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  triggerOnce?: boolean;
}

function useIntersectionObserver(options: UseIntersectionObserverOptions = {}) {
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
    const handleScroll = () => setScrollPos(window.scrollY);
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
      className={`transition-all duration-[1000ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] ${className}`}
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

const VoiceAssistant: React.FC<{ content: any; show: boolean }> = ({ content, show }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
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
          systemInstruction: "You are the Burnout Lab assistant. Professional and scientific. Keep it brief. Help users with information about the Burnout Bootcamp retreat in Japan." 
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
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.interrupted) {
              for (const source of audioRefs.current.sources.values()) {
                try { source.stop(); } catch {}
              }
              audioRefs.current.sources.clear();
              nextStartTimeRef.current = 0;
            }

            const base64 = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64) {
              const buffer = await decodeAudioData(decodeBase64(base64), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer; source.connect(outputCtx.destination);
              
              source.addEventListener('ended', () => {
                audioRefs.current.sources.delete(source);
              });

              nextStartTimeRef.current = Math.max(outputCtx.currentTime, nextStartTimeRef.current);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              audioRefs.current.sources.add(source);
            }
          },
          onerror: (e) => { setError("Connection error"); setIsActive(false); setIsConnecting(false); cleanup(); },
          onclose: () => { setIsActive(false); cleanup(); }
        }
      });
    } catch (e) { setError("Microphone error"); setIsConnecting(false); }
  };

  if (!show && !isActive) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isActive ? (
        <button 
          onClick={connect}
          className="w-16 h-16 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-[0_0_20px_rgba(244,63,94,0.4)] flex items-center justify-center transition-all hover:scale-110 active:scale-95 group relative overflow-hidden"
        >
          {/* Attention grabber animation */}
          <div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-150 transition-transform duration-500 rounded-full blur-xl" />
          <div className="absolute inset-0 animate-ping bg-brand-600 opacity-20 rounded-full" />
          {isConnecting ? <Loader2 className="animate-spin" /> : <Sparkles className="group-hover:animate-pulse z-10" />}
        </button>
      ) : (
        <div className="bg-white dark:bg-stone-900 backdrop-blur-xl border border-stone-200 dark:border-stone-800 p-6 rounded-[2rem] shadow-2xl w-64 text-center animate-fade-in-up">
           <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
             <Mic size={24} />
           </div>
           <p className="text-sm font-medium dark:text-white mb-4">I'm listening...</p>
           <button onClick={() => { setIsActive(false); cleanup(); }} className="w-full py-2 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs font-bold hover:bg-brand-50 transition-colors">End Session</button>
        </div>
      )}
      {error && <div className="absolute bottom-full right-0 mb-4 bg-red-500 text-white text-[10px] px-3 py-1 rounded-full whitespace-nowrap">{error}</div>}
    </div>
  );
};

// --- MAIN APPLICATION ---

const BurnoutLanding = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const scrollY = useScrollPos();
  const t = TRANSLATIONS.EN;

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.body.style.overflow = (isModalOpen || isVideoOpen || isMenuOpen) ? 'hidden' : '';
  }, [isDarkMode, isModalOpen, isVideoOpen, isMenuOpen]);

  const handleApply = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const data = new FormData(e.currentTarget);
    const msg = `<b>New Lead:</b>\nName: ${data.get('user-name')}\nPhone: ${data.get('user-phone')}\nAcc: ${data.get('accommodation-type')}`;

    try {
      const res = await fetch(`https://api.telegram.org/bot${TG_CONFIG.TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TG_CONFIG.CHAT_ID, message_thread_id: TG_CONFIG.THREAD_ID, text: msg, parse_mode: 'HTML' })
      });
      if (res.ok) {
        setSubmitStatus('success');
        setTimeout(() => { setIsModalOpen(false); setSubmitStatus('idle'); }, 2000);
      } else setSubmitStatus('error');
    } catch { setSubmitStatus('error'); }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen transition-colors duration-500 dark:bg-stone-950 bg-stone-50 overflow-x-hidden selection:bg-brand-100 selection:text-brand-900">
      {isLoading && <Preloader fadeOut={!isLoading} />}
      <ScrollProgress />
      
      {/* Navigation */}
      <nav className={`fixed w-full z-[60] transition-all duration-500 ${scrollY > 50 || isMenuOpen ? 'bg-white/95 dark:bg-stone-950/95 backdrop-blur-md py-3 shadow-sm' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center relative z-[75]">
          <a href="#" className="font-serif text-2xl font-bold dark:text-white tracking-tight">
            Burnout<span className="text-brand-600 italic">Lab</span>
          </a>
          
          <div className="hidden md:flex items-center space-x-10">
            {['about', 'schedule', 'team', 'pricing'].map(item => (
              <a key={item} href={`#${item}`} className="text-sm font-medium dark:text-stone-300 hover:text-brand-600 transition-colors capitalize tracking-wide">{item}</a>
            ))}
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 dark:text-stone-200 text-stone-700 hover:text-brand-600 transition-colors">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setIsModalOpen(true)} className="px-6 py-2 bg-stone-900 dark:bg-brand-600 text-white rounded-full text-sm font-bold shadow-lg hover:scale-105 active:scale-95 transition-all">
              {t.nav.book}
            </button>
          </div>

          <div className="md:hidden flex items-center space-x-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="dark:text-white p-2 text-stone-800">
              {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
            </button>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="dark:text-white p-2 text-stone-800 transition-transform active:scale-90">
              {isMenuOpen ? <X size={32} /> : <Menu size={32} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay - Fixed Layout */}
        <div className={`fixed inset-0 bg-white/98 dark:bg-stone-950/98 z-[65] transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col items-center justify-center h-full px-6 space-y-12">
            <div className="space-y-8 text-center">
              {['about', 'schedule', 'team', 'pricing'].map((item, idx) => (
                <div key={item} className={`transition-all duration-500 delay-${idx * 100} ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                  <a 
                    href={`#${item}`} 
                    onClick={() => setIsMenuOpen(false)} 
                    className="text-4xl font-serif dark:text-white capitalize tracking-tight hover:text-brand-600 transition-colors block"
                  >
                    {item}
                  </a>
                </div>
              ))}
            </div>
            <div className={`pt-8 w-full max-w-xs transition-all duration-700 delay-500 ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              <button 
                onClick={() => { setIsModalOpen(true); setIsMenuOpen(false); }} 
                className="w-full py-5 bg-brand-600 text-white rounded-2xl font-bold shadow-xl shadow-brand-900/30 active:scale-95 transition-all text-lg"
              >
                Apply Now
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Refined Animations */}
      <header className="relative h-screen flex items-center justify-center overflow-hidden">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src={window.innerWidth < 768 ? ASSETS.VIDEO_MOBILE : ASSETS.VIDEO_BG} />
        </video>
        <div className="absolute inset-0 bg-black/45 dark:bg-black/65 z-10" />
        <div className="relative z-20 text-center px-6 max-w-4xl pt-16">
          <Reveal direction="down" distance={40}>
            <span className="inline-block px-5 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-full text-white text-[11px] font-bold mb-10 uppercase tracking-[0.2em] shadow-lg">
              {t.hero.date}
            </span>
          </Reveal>
          <Reveal delay={200} direction="up" distance={50} className="mb-8">
            <h1 className="text-5xl md:text-8xl font-serif text-white leading-[1.1] tracking-tight drop-shadow-2xl">
              {t.hero.titlePrefix} <br/><span className="italic text-brand-200 font-light">{t.hero.titleHighlight}</span>
            </h1>
          </Reveal>
          <Reveal delay={400} direction="up" distance={40} className="mb-14">
            <p className="text-lg md:text-2xl text-stone-200 font-light max-w-2xl mx-auto leading-relaxed drop-shadow-md">
              {t.hero.desc}
            </p>
          </Reveal>
          <Reveal delay={600} direction="scale" className="flex flex-col sm:flex-row items-center justify-center gap-8">
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="w-full sm:w-auto px-12 py-5 bg-brand-600 text-white rounded-full font-bold shadow-[0_15px_30px_rgba(244,63,94,0.3)] hover:bg-brand-700 hover:-translate-y-1 active:scale-95 transition-all"
            >
              {t.hero.ctaApply}
            </button>
            <button 
              onClick={() => setIsVideoOpen(true)} 
              className="flex items-center space-x-4 text-white font-medium hover:text-brand-200 transition-all group"
            >
              <span className="w-14 h-14 rounded-full border border-white/30 bg-white/5 backdrop-blur-sm flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all shadow-lg scale-100 group-hover:scale-110">
                <Play size={18} fill="currentColor" />
              </span>
              <span className="text-lg tracking-wide uppercase text-[12px] font-bold">{t.hero.watchVideo}</span>
            </button>
          </Reveal>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-bounce">
          <div className="w-px h-16 bg-gradient-to-b from-white/0 via-white/50 to-white/0" />
        </div>
      </header>

      {/* About Section */}
      <section id="about" className="py-32 px-6 bg-stone-50 dark:bg-stone-950">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <Reveal direction="left">
            <div className="space-y-10">
              <div className="flex items-center space-x-4">
                <div className="h-[2px] w-12 bg-brand-600" />
                <span className="text-xs font-bold text-brand-600 tracking-[0.2em]">{t.about.philosophy}</span>
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
          <Reveal direction="right" className="relative lg:pl-10">
            <div className="rounded-[4rem] overflow-hidden shadow-2xl aspect-[4/5] relative group border-8 border-white dark:border-stone-900">
              <img src={ASSETS.ABOUT_IMG} alt="Japan" className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
              <p className="absolute bottom-12 inset-x-12 text-white font-serif italic text-2xl text-center leading-relaxed drop-shadow-lg">
                {t.about.imageQuote}
              </p>
            </div>
            <div className="absolute -bottom-10 -left-6 p-10 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-stone-100 dark:border-stone-800 animate-float z-30">
               <div className="text-[10px] font-bold text-stone-400 tracking-[0.2em] mb-2 uppercase">{t.about.cortisolLevel}</div>
               <div className="text-3xl font-bold text-brand-600 dark:text-brand-500">{t.about.cortisolChange}</div>
               <div className="w-full bg-stone-100 dark:bg-stone-800 h-1 rounded-full mt-4 overflow-hidden">
                  <div className="bg-brand-500 h-full w-[45%] rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
               </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Schedule - Enhanced Ghost Numbers */}
      <section id="schedule" className="py-32 bg-stone-100 dark:bg-stone-900/40 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 space-y-6">
            <Reveal><h2 className="text-4xl md:text-6xl font-serif dark:text-white leading-tight">{t.schedule.title}</h2></Reveal>
            <Reveal delay={200}><p className="text-stone-500 dark:text-stone-400 text-lg md:text-xl font-light">{t.schedule.subtitle}</p></Reveal>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {t.schedule.days.map((d, i) => (
              <Reveal key={i} delay={i * 150} className="h-full">
                <div className="p-12 bg-white dark:bg-stone-900 rounded-[3.5rem] h-full border border-stone-100 dark:border-stone-800 hover:border-brand-500/30 transition-all duration-500 group relative overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2">
                  {/* More noticeable numbers */}
                  <span className="absolute -top-4 -right-2 text-[140px] font-serif font-black text-stone-200/60 dark:text-stone-700/50 leading-none select-none group-hover:text-brand-500/10 transition-colors duration-700 z-0">
                    {d.ghost}
                  </span>
                  <div className="relative z-10 space-y-8">
                    <span className="inline-block px-4 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-[10px] font-bold text-brand-600 tracking-[0.2em] rounded-full uppercase">
                      {d.day}
                    </span>
                    <h3 className="text-2xl font-serif dark:text-white leading-tight group-hover:text-brand-600 transition-colors">{d.title}</h3>
                    <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed font-light">{d.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-32 px-6 bg-white dark:bg-stone-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <Reveal><h2 className="text-4xl md:text-6xl font-serif dark:text-white mb-6 leading-tight">{t.team.title}</h2></Reveal>
            <Reveal delay={200}><p className="text-stone-500 dark:text-stone-400 text-lg font-light">{t.team.subtitle}</p></Reveal>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {t.team.coaches.map((coach, i) => (
              <Reveal key={i} delay={i * 200} direction="up" distance={40}>
                <div className="group text-center space-y-6">
                  <div className="relative mx-auto w-64 h-80 rounded-[3rem] overflow-hidden shadow-xl grayscale hover:grayscale-0 transition-all duration-700 border-4 border-white dark:border-stone-900">
                    <img src={ASSETS.COACHES[i % ASSETS.COACHES.length]} alt={coach.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-serif dark:text-white group-hover:text-brand-600 transition-colors">{coach.name}</h4>
                    <p className="text-brand-600 dark:text-brand-500 text-xs font-bold uppercase tracking-widest">{coach.role}</p>
                    <p className="text-sm text-stone-500 dark:text-stone-400 max-w-xs mx-auto leading-relaxed">{coach.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Restored with Reveal animations */}
      <section className="py-32 bg-stone-50 dark:bg-stone-900/30 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 space-y-6">
            <Reveal><h2 className="text-4xl md:text-6xl font-serif dark:text-white leading-tight">{t.testimonials.title}</h2></Reveal>
            <Reveal delay={200}><p className="text-stone-500 dark:text-stone-400 text-lg md:text-xl font-light">{t.testimonials.subtitle}</p></Reveal>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {t.testimonials.list.map((testimonial, i) => (
              <Reveal key={i} delay={i * 200} direction="up" distance={50} className="h-full">
                <div className="p-10 bg-white dark:bg-stone-900 rounded-[3rem] h-full shadow-md border border-stone-100 dark:border-stone-800 hover:border-brand-300 transition-all duration-500 relative flex flex-col group">
                  <div className="mb-8 text-brand-200 dark:text-stone-800 opacity-50 group-hover:text-brand-400 transition-colors">
                    <Quote size={40} fill="currentColor" />
                  </div>
                  <p className="text-lg text-stone-600 dark:text-stone-300 italic mb-10 leading-relaxed font-serif flex-grow">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center space-x-4 pt-6 border-t border-stone-50 dark:border-stone-800">
                    <div className="w-12 h-12 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center text-stone-400">
                      <Users size={20} />
                    </div>
                    <div>
                      <h5 className="font-bold dark:text-white text-sm">{testimonial.name}</h5>
                      <p className="text-xs text-stone-500 uppercase tracking-widest mt-0.5">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 px-6 bg-white dark:bg-stone-950">
        <div className="max-w-7xl mx-auto">
           <div className="text-center mb-24 space-y-6">
            <Reveal><h2 className="text-4xl md:text-6xl font-serif dark:text-white leading-tight">{t.pricing.title}</h2></Reveal>
            <Reveal delay={200}><p className="text-stone-500 dark:text-stone-400 text-lg font-light">{t.pricing.subtitle}</p></Reveal>
          </div>
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto items-stretch">
            <Reveal direction="left" distance={60} className="h-full">
               <div className="p-12 bg-stone-50 dark:bg-stone-900 rounded-[4rem] border border-stone-200 dark:border-stone-800 transition-all duration-500 hover:shadow-xl flex flex-col h-full hover:border-brand-500/20">
                 <h3 className="text-2xl font-bold dark:text-white mb-4">{t.pricing.shared}</h3>
                 <div className="text-5xl font-serif mb-10 dark:text-white tracking-tighter">$2,390</div>
                 <ul className="space-y-5 mb-12 flex-grow">
                   {t.pricing.features.slice(0,4).map((f, i) => (
                     <li key={i} className="flex items-center text-sm text-stone-600 dark:text-stone-400"><CheckCircle size={18} className="text-brand-600 mr-4 shrink-0" />{f}</li>
                   ))}
                 </ul>
                 <button onClick={() => setIsModalOpen(true)} className="w-full py-5 rounded-2xl bg-white dark:bg-stone-800 dark:text-white font-bold hover:bg-brand-600 hover:text-white transition-all shadow-sm active:scale-95">Select Plan</button>
               </div>
            </Reveal>
            <Reveal direction="right" distance={60} delay={200} className="h-full">
               <div className="p-12 bg-stone-900 dark:bg-stone-800 text-white rounded-[4rem] shadow-2xl relative overflow-hidden transition-all duration-500 hover:-translate-y-4 flex flex-col h-full border border-brand-600/30">
                 <div className="absolute top-0 right-0 px-6 py-2 bg-brand-600 text-[10px] font-bold uppercase tracking-widest rounded-bl-3xl z-10">{t.pricing.popular}</div>
                 <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 to-transparent opacity-50" />
                 <h3 className="text-2xl font-bold mb-4 relative z-10">{t.pricing.single}</h3>
                 <div className="text-5xl font-serif mb-10 relative z-10 tracking-tighter">$2,890</div>
                 <ul className="space-y-5 mb-12 flex-grow relative z-10">
                   {t.pricing.features.map((f, i) => (
                     <li key={i} className="flex items-center text-sm text-stone-300"><CheckCircle size={18} className="text-brand-600 mr-4 shrink-0" />{f}</li>
                   ))}
                 </ul>
                 <button onClick={() => setIsModalOpen(true)} className="w-full py-5 rounded-2xl bg-brand-600 text-white font-bold shadow-xl shadow-brand-900/50 hover:bg-brand-700 transition-all active:scale-95 relative z-10">Book Now</button>
               </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Quiz Section */}
      <section className="py-32 px-6 bg-stone-50 dark:bg-stone-900/20">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
           <Reveal direction="left">
             <div className="space-y-8">
               <h2 className="text-4xl md:text-6xl font-serif dark:text-white leading-[1.1]">{t.quiz.title}</h2>
               <p className="text-lg text-stone-500 dark:text-stone-400 max-w-md leading-relaxed font-light">{t.quiz.subtitle}</p>
               <button className="flex items-center space-x-5 px-10 py-5 bg-[#24A1DE] text-white rounded-[1.5rem] font-bold hover:scale-105 hover:bg-[#2091c8] active:scale-95 transition-all shadow-xl shadow-[#24A1DE]/20 group">
                 <Send size={22} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                 <span className="text-lg tracking-tight">{t.quiz.button}</span>
               </button>
             </div>
           </Reveal>
           <Reveal direction="scale" delay={300}>
             <div className="p-12 md:p-16 bg-white dark:bg-stone-900 rounded-[4rem] border border-stone-200 dark:border-stone-800 space-y-10 shadow-xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-50 dark:bg-brand-900/10 rounded-full blur-3xl opacity-50" />
                <div className="flex items-start space-x-5 relative">
                  <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white shrink-0 shadow-lg"><Brain size={22} /></div>
                  <div className="p-5 bg-stone-50 dark:bg-stone-800 rounded-[1.5rem] rounded-tl-none shadow-sm text-sm dark:text-white leading-relaxed">{t.quiz.bubbleBot1}</div>
                </div>
                <div className="flex items-start space-x-5 flex-row-reverse relative">
                  <div className="w-12 h-12 rounded-2xl bg-stone-200 dark:bg-stone-700 flex items-center justify-center shrink-0 ml-5 shadow-sm"><Users size={22} className="text-stone-500" /></div>
                  <div className="p-5 bg-brand-600 rounded-[1.5rem] rounded-tr-none text-white text-sm shadow-xl leading-relaxed">{t.quiz.bubbleUser}</div>
                </div>
                <div className="p-8 bg-stone-50 dark:bg-stone-800/50 rounded-[2.5rem] flex items-center space-x-8 border border-brand-600/5 group cursor-pointer hover:border-brand-400 transition-colors">
                  <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-600 shadow-sm"><FileText size={28} /></div>
                  <div className="space-y-1">
                    <div className="text-sm font-bold dark:text-white">{t.quiz.magnetTitle}</div>
                    <div className="text-[10px] text-stone-400 uppercase tracking-[0.1em] font-medium">1.2 MB • PDF DOCUMENT</div>
                  </div>
                </div>
             </div>
           </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-32 bg-stone-950 border-t border-white/5 text-center px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.03),transparent_70%)] pointer-events-none" />
        <Reveal direction="scale">
           <div className="mb-12">
             <Feather size={56} className="mx-auto text-stone-800 hover:text-brand-900 transition-colors duration-1000" />
           </div>
           <h2 className="text-4xl md:text-5xl font-serif text-white mb-8 leading-tight tracking-tight">{t.download.title}</h2>
           <p className="text-stone-500 mb-14 max-w-xl mx-auto text-lg leading-relaxed font-light">{t.download.desc}</p>
           <a href={ASSETS.PDF} target="_blank" className="inline-flex items-center space-x-4 px-12 py-5 bg-white rounded-full text-black font-bold hover:bg-stone-200 transition-all hover:-translate-y-1 shadow-2xl active:scale-95">
             <Download size={20} />
             <span className="text-lg tracking-tight">{t.download.button}</span>
           </a>
           <div className="mt-32 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0 text-stone-700 text-[10px] font-bold uppercase tracking-[0.3em] relative z-10">
             <div>&copy; 2026 Burnout Lab Japan</div>
             <div className="flex space-x-8">
               <a href="#" className="hover:text-brand-600 transition-colors">Instagram</a>
               <a href="#" className="hover:text-brand-600 transition-colors">Twitter</a>
             </div>
             <div>Engineering Better Living</div>
           </div>
        </Reveal>
      </footer>

      {/* Modal & Overlays */}
      <VoiceAssistant content={t} show={scrollY > 300} />

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity duration-500" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white dark:bg-stone-900 p-10 md:p-14 rounded-[3.5rem] w-full max-w-md shadow-2xl animate-fade-in-up border border-white/10">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 dark:text-white text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-colors"><X size={28} /></button>
            <h3 className="text-4xl font-serif dark:text-white mb-3 tracking-tight">{t.modal.title}</h3>
            <p className="text-stone-500 dark:text-stone-400 text-sm mb-10 leading-relaxed">{t.modal.desc}</p>
            {submitStatus === 'success' ? (
              <div className="text-center py-14 space-y-6 animate-fade-in-up">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-green-500 shadow-inner">
                  <CheckCircle size={56} />
                </div>
                <p className="text-2xl font-bold dark:text-white tracking-tight">{t.modal.success}</p>
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] block ml-1">{t.modal.nameLabel}</label>
                  <input name="user-name" required className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-2xl p-5 focus:ring-2 focus:ring-brand-600 dark:text-white transition-all shadow-sm" placeholder="Your Full Name" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] block ml-1">{t.modal.phoneLabel}</label>
                  <input name="user-phone" required type="tel" className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-2xl p-5 focus:ring-2 focus:ring-brand-600 dark:text-white transition-all shadow-sm" placeholder="+1 (555) 000-0000" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] block ml-1">{t.modal.typeLabel}</label>
                  <select name="accommodation-type" className="w-full bg-stone-50 dark:bg-stone-800 border-none rounded-2xl p-5 focus:ring-2 focus:ring-brand-600 dark:text-white transition-all shadow-sm cursor-pointer appearance-none">
                    <option value="Single">Single Room Suite</option>
                    <option value="Shared">Shared Twin Room</option>
                  </select>
                </div>
                <button disabled={isSubmitting} className="w-full py-5 bg-brand-600 text-white rounded-2xl font-bold shadow-xl shadow-brand-900/20 flex items-center justify-center space-x-3 hover:bg-brand-700 active:scale-95 transition-all text-lg tracking-tight disabled:opacity-70">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <span>{t.modal.submit}</span>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {isVideoOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
          <button onClick={() => setIsVideoOpen(false)} className="absolute top-10 right-10 text-white/50 hover:text-white transition-all z-[110] p-4"><X size={36} /></button>
          <video controls autoPlay className="w-full max-w-6xl aspect-video rounded-[2.5rem] shadow-[0_0_100px_rgba(244,63,94,0.3)] z-[105] border-4 border-white/5">
            <source src={ASSETS.FILM_VIDEO} />
          </video>
        </div>
      )}
    </div>
  );
};

// --- INTERNAL HELPERS ---

const Preloader = ({ fadeOut }: { fadeOut: boolean }) => (
  <div className={`fixed inset-0 z-[200] bg-stone-950 flex flex-col items-center justify-center transition-opacity duration-1000 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
    <div className="relative mb-8">
      <Brain size={80} className="text-brand-600 animate-pulse-slow relative z-10" strokeWidth={1} />
      <div className="absolute inset-0 bg-brand-600 rounded-full blur-[60px] opacity-20 animate-pulse" />
    </div>
    <h2 className="text-white font-serif tracking-[0.5em] uppercase text-2xl drop-shadow-lg">
      Burnout<span className="text-brand-600 italic">Lab</span>
    </h2>
    <div className="w-48 h-[1px] bg-white/5 mt-12 overflow-hidden relative rounded-full">
      <div className="absolute inset-0 bg-brand-600 animate-grow" />
    </div>
    <p className="mt-8 text-stone-600 text-[10px] font-bold uppercase tracking-[0.3em]">The Science of Reset</p>
  </div>
);

const ScrollProgress = () => {
  const [w, setW] = useState(0);
  useEffect(() => {
    const h = () => setW((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
    window.addEventListener('scroll', h); return () => window.removeEventListener('scroll', h);
  }, []);
  return <div className="fixed top-0 left-0 h-1 bg-gradient-to-r from-brand-600 to-brand-400 z-[100] transition-all duration-200" style={{ width: `${w}%` }} />;
};

const CursorTrail = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [isClicking, setIsClicking] = useState(false);

  useEffect(() => {
    const m = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    const d = () => setIsClicking(true);
    const u = () => setIsClicking(false);
    window.addEventListener('mousemove', m);
    window.addEventListener('mousedown', d);
    window.addEventListener('mouseup', u);
    return () => {
      window.removeEventListener('mousemove', m);
      window.removeEventListener('mousedown', d);
      window.removeEventListener('mouseup', u);
    };
  }, []);

  if (window.innerWidth < 1024) return null;
  
  return (
    <>
      <div 
        className={`fixed w-10 h-10 border border-brand-600/40 rounded-full pointer-events-none z-[9999] transition-transform duration-200 ease-out-expo mix-blend-difference ${isClicking ? 'scale-75' : 'scale-100'}`} 
        style={{ left: pos.x - 20, top: pos.y - 20 }} 
      />
      <div 
        className="fixed w-1 h-1 bg-brand-600 rounded-full pointer-events-none z-[9999]" 
        style={{ left: pos.x - 2, top: pos.y - 2 }} 
      />
    </>
  );
};

export default BurnoutLanding;
