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



            <p className="text-slate-400 text-[10px] mt-2">© 2025 SparkLink. All rights reserved.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
