"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface RadioOption {
  id: string;
  label: string;
  value: string;
  color: {
    border: string;
    dot: string;
    glow: string;
  };
}

interface RadioProps {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  label?: string;
}

export function Radio({
  options,
  value,
  onChange,
  className,
  label,
}: RadioProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {label && <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>}

      <div className="flex flex-col sm:flex-row gap-4">
        {options.map((option) => {
          const isSelected = value === option.value;

          return (
            <label
              key={option.id}
              className={cn(
                "group relative flex items-center p-4 rounded-xl cursor-pointer w-full sm:w-auto",
                "bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800",
                "hover:border-gray-300 dark:hover:border-slate-700 hover:shadow-sm",
                "transition-all duration-300",
              )}
            >
              <input
                type="radio"
                name="custom-radio"
                value={option.value}
                checked={isSelected}
                onChange={() => onChange(option.value)}
                className="sr-only"
                aria-label={option.label}
              />

              <div className="flex items-center w-full">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full border-2 transition-all duration-500 ease-out flex items-center justify-center mr-4 flex-shrink-0",
                    isSelected
                      ? cn(option.color.border, "scale-90")
                      : "border-gray-400 dark:border-slate-500 group-hover:border-gray-600 dark:group-hover:border-slate-400 group-hover:scale-110",
                  )}
                >
                  {/* Inner dot */}
                  <div
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-all duration-300",
                      isSelected ? cn(option.color.dot, "scale-100") : "scale-0 bg-gray-600 dark:bg-slate-400",
                    )}
                  />

                  {/* Animated ring */}
                  {isSelected && (
                    <div
                      className={cn(
                        "absolute w-9 h-9 rounded-full border-2 border-transparent animate-spin",
                        option.color.border,
                        "shadow-lg",
                        option.color.glow,
                      )}
                      style={{
                        borderTopColor: "currentColor",
                        animationDuration: "2s",
                      }}
                    />
                  )}
                </div>

                <span
                  className={cn(
                    "font-medium transition-colors duration-300",
                    isSelected ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200",
                  )}
                >
                  {option.label}
                </span>
              </div>

              {/* Background selection highlight via parent layout style overlay */}
              {isSelected && (
                <motion.div
                  layoutId="radio-background"
                  className={cn("absolute inset-0 rounded-xl bg-gradient-to-r opacity-[0.03] dark:opacity-[0.05]", option.color.border)}
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
