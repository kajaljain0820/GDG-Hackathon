import { cn } from '@/lib/utils';
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', ...props }, ref) => {
        const variants = {
            primary: "bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white shadow-lg shadow-green-500/20",
            secondary: "bg-white/80 hover:bg-white text-slate-700 border border-slate-200",
            ghost: "hover:bg-green-50 text-slate-600 hover:text-green-700",
            outline: "border border-green-200 bg-transparent hover:bg-green-50 text-green-700 hover:text-green-800"
        };

        return (
            <button
                ref={ref}
                className={cn(
                    "px-6 py-3 rounded-xl font-medium transition-all duration-300 active:scale-95 flex items-center justify-center",
                    variants[variant],
                    className
                )}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"
