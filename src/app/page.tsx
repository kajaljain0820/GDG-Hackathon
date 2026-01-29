'use client';

import AuthForm from '@/components/Platform/AuthForm';
import GlassCard from '@/components/ui/GlassCard';
import { Users, BrainCircuit, ArrowDown, Zap, TrendingUp, Activity, BookOpen } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const features = [
    {
      title: "Neural Notebook",
      description: "Upload PDFs and watch our AI visualize concepts in real-time. Context-aware notes that evolve with you.",
      icon: BrainCircuit,
      color: "blue"
    },
    {
      title: "Live Campus",
      description: "Real-time Unity Field. See who's studying what right now. Connect instantly with peers on the same path.",
      icon: Users,
      color: "purple"
    },
    {
      title: "AI Doubt Engine",
      description: "Stuck? Get instant, context-aware answers. Queries are auto-escalated to seniors if AI is unsure.",
      icon: Zap,
      color: "rose"
    },
    {
      title: "Focus Analytics",
      description: "Track your attention spans, topic coverage, and learning velocity. Data-driven insights for better grades.",
      icon: TrendingUp,
      color: "amber"
    },
    {
      title: "Skill Matching",
      description: "Find the perfect study partner based on complementary skills and current curriculum focus.",
      icon: Activity,
      color: "indigo"
    },
    {
      title: "Professor Sync",
      description: "Direct line to faculty. Dashboard integration for assignment tracking and doubt escalation.",
      icon: BookOpen,
      color: "emerald"
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string, text: string, border: string, shadow: string, gradient: string }> = {
      blue: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20', shadow: 'shadow-blue-500/10', gradient: 'from-blue-500 to-cyan-400' },
      purple: { bg: 'bg-purple-500/10', text: 'text-purple-600', border: 'border-purple-500/20', shadow: 'shadow-purple-500/10', gradient: 'from-purple-500 to-pink-400' },
      rose: { bg: 'bg-rose-500/10', text: 'text-rose-600', border: 'border-rose-500/20', shadow: 'shadow-rose-500/10', gradient: 'from-rose-500 to-orange-400' },
      amber: { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20', shadow: 'shadow-amber-500/10', gradient: 'from-amber-500 to-yellow-400' },
      indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-600', border: 'border-indigo-500/20', shadow: 'shadow-indigo-500/10', gradient: 'from-indigo-600 to-violet-400' },
      emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20', shadow: 'shadow-emerald-500/10', gradient: 'from-emerald-500 to-teal-400' },
    };
    return colors[color];
  };

  return (
    <div className="flex flex-col w-full relative">
      {/* Section 1: Entrance / Login - The "Portal" */}
      <section className="min-h-screen w-full flex items-center justify-center relative p-6 md:p-20 overflow-hidden" id="start">
        <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">

          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            className="flex flex-col items-start overflow-visible pb-4 pr-8"
          >
            <h1 className="text-[100px] md:text-[180px] font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-green-600 via-emerald-500 to-green-400 leading-[0.9] select-none drop-shadow-lg -ml-4 pb-2 pr-4">
              SparkLink
            </h1>
            <p className="text-2xl md:text-3xl font-light tracking-[0.5em] mt-2 uppercase bg-clip-text text-transparent bg-gradient-to-r from-slate-600 to-slate-400">
              University OS
            </p>
            <p className="mt-8 text-lg text-slate-600 max-w-md leading-relaxed">
              Your entire digital campus, reimagined. Context-aware AI notes, real-time collaboration, and a living 3D knowledge graph.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="flex justify-center md:justify-end"
          >
            <AuthForm />
          </motion.div>
        </div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-400 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] tracking-widest uppercase">Scroll to Explore</span>
          <ArrowDown className="w-4 h-4" />
        </motion.div>
      </section>

      {/* Section 2: Features - "Neo-Cylinder" Design with Tight Spacing & Organic Connectors */}
      <section className="min-h-screen w-full relative py-24 px-4 md:px-0 overflow-hidden bg-slate-50/30" id="features" ref={containerRef}>

        {/* Localized Immersive Atmosphere (Inside Section) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-green-200/20 rounded-full blur-[80px]" />
          <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-emerald-200/20 rounded-full blur-[80px]" />
        </div>

        <div className="max-w-6xl mx-auto relative relative z-10">

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-24 relative z-10"
          >
            <h2 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-500 tracking-tighter mb-6">Core Modules</h2>
            <p className="text-slate-500 text-xl font-medium max-w-2xl mx-auto">
              Advanced subsystems powering your academic evolution.
            </p>
          </motion.div>


          {/* Zig-Zag Glass Pipe Spine */}
          <div className="absolute left-0 top-32 bottom-0 w-full hidden md:block z-0 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="pipe-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                  <stop offset="50%" stopColor="rgba(226, 232, 240, 0.4)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
                </linearGradient>
                <filter id="glass-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* 
                  Path Logic:
                  Zig Zags between items but hits X=50% at roughly 8%, 25%, 41%, 58%, 75%, 91% (Estimated centers for 6 items)
                  To make a nice ZigZag, we pull the mid-points (between items) out to 45% and 55%.
                */}
              <motion.path
                d="
                    M 50 0 
                    Q 45 4, 50 8 
                    Q 55 16, 50 25 
                    Q 45 33, 50 41 
                    Q 55 50, 50 58 
                    Q 45 66, 50 75 
                    Q 55 83, 50 91
                    L 50 100
                  "
                stroke="url(#pipe-gradient)"
                strokeWidth="6"
                fill="none"
                filter="url(#glass-glow)"
                className="drop-shadow-sm"
              />

              {/* Inner Pulsing Core Wire */}
              <motion.path
                d="
                    M 50 0 
                    Q 45 4, 50 8 
                    Q 55 16, 50 25 
                    Q 45 33, 50 41 
                    Q 55 50, 50 58 
                    Q 45 66, 50 75 
                    Q 55 83, 50 91
                    L 50 100
                  "
                stroke="#4CAF50"
                strokeWidth="2"
                fill="none"
                pathLength={useTransform(scrollYProgress, [0, 0.9], [0, 1])}
                strokeOpacity="0.6"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="relative flex flex-col w-full gap-10">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isEven = index % 2 === 0;
              const colors = getColorClasses(feature.color);

              return (
                <div key={feature.title} className={`w-full flex ${isEven ? 'md:justify-start' : 'md:justify-end'} justify-center relative perspective-1000 items-center`}>

                  {/* Organic Neural Connector (Desktop) */}
                  <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 ${isEven ? 'right-1/2 mr-8' : 'left-1/2 ml-8'} w-32 h-24 z-0 pointer-events-none`}>
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                      {/* Curved Pipe Connector - C Curves */}
                      <path
                        d={isEven
                          ? "M100,50 C50,50 50,50 0,50"
                          : "M0,50 C50,50 50,50 100,50"
                        }
                        stroke="#cbd5e1"
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                        className="opacity-40"
                      />
                      {/* Animated Pulse on Wire */}
                      <path
                        d={isEven
                          ? "M100,50 C50,50 50,50 0,50"
                          : "M0,50 C50,50 50,50 100,50"
                        }
                        stroke={`url(#gradient-${index})`}
                        strokeWidth="2"
                        fill="none"
                        className="animate-pulse"
                        strokeDasharray="10 10"
                      >
                        <animate
                          attributeName="stroke-dashoffset"
                          from="50"
                          to="0"
                          dur="1s"
                          repeatCount="indefinite"
                        />
                      </path>
                      <defs>
                        <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="transparent" />
                          <stop offset="50%" stopColor={isEven ? '#4CAF50' : '#66BB6A'} />
                          <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  {/* Capsule Pod Card */}
                  <motion.div
                    initial={{
                      opacity: 0,
                      x: isEven ? -100 : 100,
                      scale: 0.9,
                      rotateY: isEven ? -15 : 15
                    }}
                    whileInView={{
                      opacity: 1,
                      x: 0,
                      scale: 1,
                      rotateY: 0
                    }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ type: "spring", stiffness: 50, damping: 15 }}
                    className={`w-full md:w-[42%] relative group cursor-pointer z-10`}
                  >
                    {/* The Glow Behind */}
                    <div className={`absolute -inset-4 rounded-[60px] bg-gradient-to-r ${colors.gradient} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-700`} />

                    {/* The Pod Container - Super Rounded */}
                    <div className="relative bg-white/60 backdrop-blur-xl border border-white/60 rounded-[50px] p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 overflow-hidden">

                      <div className="flex flex-col md:flex-row items-center gap-6 p-6 md:p-8">
                        {/* Icon Bubble */}
                        <div className={`w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-[30px] ${colors.bg} ${colors.text} border-2 ${colors.border} flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                          <Icon className="w-8 h-8 md:w-10 md:h-10" strokeWidth={1.5} />
                        </div>

                        {/* Content */}
                        <div className="flex flex-col text-center md:text-left">
                          <h3 className="text-2xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                          <p className="text-slate-500 text-sm md:text-base leading-relaxed font-medium">
                            {feature.description}
                          </p>
                        </div>
                      </div>

                      {/* Interactive Shine */}
                      <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 group-hover:animate-[shine_1s_ease-in-out]" />
                    </div>
                  </motion.div>

                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="py-20 flex flex-col items-center justify-center relative bg-gradient-to-t from-slate-50 to-transparent" id="end">
        <div className="text-center mb-16 px-6">
          <h2 className="text-4xl font-bold text-slate-900 mb-6 tracking-tight">Ready to Enroll?</h2>
          <p className="text-slate-500 text-xl font-light mb-10 max-w-lg mx-auto">Your digital campus awaits. Join the future of collaborative learning today.</p>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-8 py-4 bg-green-600 text-white rounded-full font-bold shadow-xl hover:shadow-2xl hover:scale-105 hover:bg-green-500 transition-all flex items-center gap-2 mx-auto">
            Enter Portal <ArrowDown className="w-4 h-4 rotate-180" />
          </button>
        </div>

        <div className="w-full border-t border-slate-200 mt-auto">
          <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col items-center justify-center gap-4">
            <p className="text-slate-500 text-sm font-medium mb-2">
              Developed by <span className="text-slate-900 font-bold">Team Codeify</span>
            </p>

            <div className="flex items-center gap-4">
              <a
                href="https://github.com/RITHIKKUMARAN"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-slate-600 text-xs hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all font-mono group"
              >
                <svg height="16" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" className="fill-current group-hover:text-[#181717]"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path></svg>
                GitHub
              </a>

              <a
                href="https://www.linkedin.com/in/rithikkumarank"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-slate-600 text-xs hover:bg-slate-50 hover:text-blue-700 hover:border-blue-200 transition-all font-mono group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="group-hover:text-[#0A66C2]"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                LinkedIn
              </a>
            </div>

            <p className="text-slate-400 text-[10px] mt-2">© 2025 SparkLink. All rights reserved.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
