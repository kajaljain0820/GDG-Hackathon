import { cn } from '@/lib/utils';
import React from 'react';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    ({ className, ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={cn(
                    "w-full bg-white/80 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 transition-all duration-300",
                    className
                )}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"
