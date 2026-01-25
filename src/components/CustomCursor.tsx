'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function CustomCursor() {
    const cursorRef = useRef<HTMLDivElement>(null);
    const followerRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [isClicking, setIsClicking] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches) return;

        const cursor = cursorRef.current;
        const follower = followerRef.current;

        gsap.set([cursor, follower], { xPercent: -50, yPercent: -50, x: -100, y: -100 });

        const moveCursor = (e: MouseEvent) => {
            gsap.to(cursor, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.1,
                ease: 'power2.out'
            });
            gsap.to(follower, {
                x: e.clientX,
                y: e.clientY,
                duration: 0.3,
                ease: 'power2.out'
            });
        };

        const handleMouseDown = () => setIsClicking(true);
        const handleMouseUp = () => setIsClicking(false);

        const handleHover = () => setIsHovering(true);
        const handleUnhover = () => setIsHovering(false);

        const addHoverListeners = () => {
            const interactiveElements = document.querySelectorAll('a, button, input, textarea, [role="button"], .interactive, label, [onClick]');
            interactiveElements.forEach((el) => {
                el.removeEventListener('mouseenter', handleHover);
                el.removeEventListener('mouseleave', handleUnhover);
                el.addEventListener('mouseenter', handleHover);
                el.addEventListener('mouseleave', handleUnhover);
            });
        }

        addHoverListeners();

        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) shouldUpdate = true;
            });
            if (shouldUpdate) addHoverListeners();
        });

        observer.observe(document.body, { childList: true, subtree: true });

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        const cursor = cursorRef.current;
        const follower = followerRef.current;

        // Constant styling variables
        const baseColor = '#4f46e5'; // Indigo-600

        if (isHovering) {
            gsap.to(cursor, { scale: 1, duration: 0.3 });
            gsap.to(follower, {
                scale: 1.5,
                borderColor: baseColor,
                borderWidth: '2px', // Ensure thickness is maintained
                duration: 0.3
            });
        } else {
            gsap.to(cursor, { scale: 1, duration: 0.3 });
            gsap.to(follower, {
                scale: 1,
                borderColor: baseColor,
                borderWidth: '2px',
                duration: 0.3
            });
        }
    }, [isHovering]);

    useEffect(() => {
        const follower = followerRef.current;
        const cursor = cursorRef.current;

        if (isClicking) {
            gsap.to([cursor, follower], { scale: 0.8, duration: 0.15, ease: 'power2.out' });
        } else {
            gsap.to(cursor, { scale: 1, duration: 0.3 });
            gsap.to(follower, { scale: isHovering ? 1.5 : 1, duration: 0.3, ease: 'power2.out' });
        }
    }, [isClicking, isHovering]);

    return (
        <>
            <div
                ref={cursorRef}
                className="fixed top-0 left-0 w-2.5 h-2.5 bg-[#4f46e5] rounded-full pointer-events-none z-[9999] hidden lg:block"
            />
            <div
                ref={followerRef}
                className="fixed top-0 left-0 w-8 h-8 border-2 border-[#4f46e5] rounded-full pointer-events-none z-[9998] hidden lg:block"
            />
            <style jsx global>{`
        @media (pointer: fine) and (min-width: 1024px) {
          body, a, button, input, textarea, [role="button"], select, label {
            cursor: none !important;
          }
        }
      `}</style>
        </>
    );
}
