'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    hoverEffect?: boolean;
    intensity?: 'low' | 'medium' | 'high';
}

export default function GlassCard({ children, className, hoverEffect = false, intensity = 'medium' }: GlassCardProps) {
    const intensityStyles = {
        low: "bg-white/40 border-white/40 shadow-lg shadow-blue-500/5",
        medium: "bg-white/60 border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
        high: "bg-gradient-to-br from-white/80 via-white/40 to-white/20 border border-white/40 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] backdrop-blur-2xl"
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            whileHover={hoverEffect ? { scale: 1.02, rotateX: 2, rotateY: 2 } : {}}
            className={cn(
                "backdrop-blur-xl rounded-[2rem] relative overflow-hidden transition-all duration-500 group",
                intensityStyles[intensity],
                hoverEffect && "hover:shadow-[0_20px_50px_rgba(76,175,80,0.12)] hover:border-green-200/50",
                className
            )}
        >
            {/* Shine Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out]" />
            </div>

            {/* Noise Texture for granularity */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            <div className="relative z-10 h-full">
                {children}
            </div>
        </motion.div>
    );
}
