const ease = [0.22, 1, 0.36, 1] as const;
import { useReducedMotion } from "framer-motion";



export function useReveal() {
    const prefersReducedMotion = useReducedMotion() ?? false;

    return {
        hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
        show: (i: number) => ({
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            transition: {
                delay: prefersReducedMotion ? 0 : 0.18 * i,
                duration: prefersReducedMotion ? 0 : 1.2,
                ease,
            },
        }),
    };
}