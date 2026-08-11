import { useEffect, useRef, useState } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;

// Anime une valeur numérique de sa valeur affichée vers la cible
// (easing easeOutCubic). Si la cible change en cours d'animation, on repart
// de la valeur affichée (pas de saut arrière). Respecte prefers-reduced-motion.
export default function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(target ?? 0);
  const currentRef = useRef(target ?? 0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      currentRef.current = target;
      setValue(target);
      return undefined;
    }

    const from = currentRef.current;
    if (from === target) {
      setValue(target);
      return undefined;
    }

    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = from + (target - from) * eased;
      currentRef.current = current;
      setValue(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        currentRef.current = target;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}
