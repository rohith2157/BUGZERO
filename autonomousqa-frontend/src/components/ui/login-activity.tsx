import React, { useState } from "react";
import { motion } from "framer-motion";

/**
 * Utility for tailwind class merging. If you have a cn utility, use that instead.
 * But we'll inline a simple version or use standard template literals if cn isn't strictly necessary.
 */
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

type LoginActivityProps = {
  cardTitle?: string;
  cardDescription?: string;
  data?: number[]; // last 10 bars
};

export const LoginActivity = ({
  cardTitle = "Login activity",
  cardDescription = "Recent successful sign-ins across regions.",
  data = [6, 4, 7, 5, 8, 9, 5, 7, 6, 10],
}: LoginActivityProps) => {
  const max = Math.max(1, ...data);
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className={cn(
        "relative",
        "flex flex-col justify-between",
        "h-[20rem] w-[350px] max-w-[350px]",
        "rounded-2xl border border-white/5 bg-[#1A1A1A] p-6 shadow-xl", 
        "glass-card"
      )}
      style={{
         background: hovered ? 'rgba(255, 255, 255, 0.05)' : '#000000',
         border: '1px solid rgba(255, 255, 255, 0.05)',
         transition: 'background 0.3s ease'
      }}
    >
      <div>
        <h3 className="text-base font-semibold text-white tracking-tight" style={{ color: 'var(--text-primary)' }}>{cardTitle}</h3>
        <p className="mt-1 text-sm text-neutral-400" style={{ color: 'var(--text-secondary)' }}>
          {cardDescription}
        </p>
      </div>

      <div className="mt-6 flex h-40 items-end justify-between gap-2">
        {data.map((value, i) => {
          const height = (value / max) * 100;
          return (
            <motion.div
              key={i}
              initial={{ height: 0, opacity: 0.6 }}
              animate={{
                height: `${height}%`,
                opacity: 1,
                scale: hovered ? 1.05 : 1,
                boxShadow: hovered
                  ? "0 8px 24px rgba(212, 168, 83, 0.25)"
                  : "0 0 0 rgba(0,0,0,0)",
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-6 rounded-sm"
              style={{
                 background: 'linear-gradient(to bottom, var(--color-accent-gold) 0%, rgba(212, 168, 83, 0.4) 100%)',
              }}
            />
          );
        })}
      </div>

      <motion.div
        className="mt-4 text-[11px] font-medium uppercase tracking-wider text-neutral-500"
        animate={{ opacity: hovered ? 1 : 0.7 }}
        style={{ color: 'var(--text-tertiary)' }}
      >
        last 24h
      </motion.div>
    </motion.div>
  );
};

export default LoginActivity;