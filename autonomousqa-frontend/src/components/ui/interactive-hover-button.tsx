import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";

interface InteractiveHoverButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    text?: string;
    icon?: React.ReactNode;
    isActive?: boolean;
    collapsed?: boolean;
}

const InteractiveHoverButton = React.forwardRef<
    HTMLButtonElement,
    InteractiveHoverButtonProps
>(({ text = "Button", icon, isActive, collapsed, className, ...props }, ref) => {
    return (
        <button
            ref={ref}
            className={cn(
                "group relative w-full cursor-pointer overflow-hidden rounded-lg font-semibold transition-all duration-300 mt-1",
                collapsed ? "px-2 py-2 flex justify-center" : "px-3 py-[9px]",
                isActive
                    ? "bg-[rgba(212,168,83,0.08)] text-[var(--text-primary)] border border-transparent"
                    : "bg-transparent text-[var(--text-tertiary)] border border-transparent hover:border-[var(--border-subtle)]",
                className,
            )}
            {...props}
        >
            {/* Active Sidebar Indicator line */}
            {isActive && (
                <div className="absolute left-0 top-[20%] h-[60%] w-1 rounded-r-md bg-[var(--color-accent-gold)] shadow-[2px_0_8px_rgba(212,168,83,0.4)] z-30" />
            )}

            {/* Default State (Visible before hover) */}
            <div className={cn(
                "flex items-center gap-3 transition-all duration-300 relative z-10",
                !collapsed && "group-hover:translate-x-12 group-hover:opacity-0"
            )}>
                {icon && (
                    <span className={cn("flex-shrink-0 transition-opacity", isActive ? "text-[var(--color-accent-gold)] opacity-100" : "opacity-60")}>
                        {icon}
                    </span>
                )}
                {!collapsed && (
                    <span className="inline-block whitespace-nowrap text-[13px] font-medium tracking-tight">
                        {text}
                    </span>
                )}
            </div>

            {/* Hover State (Sliding in) */}
            {!collapsed && (
                <>
                    <div className="absolute left-0 top-0 z-20 flex h-full w-full translate-x-12 flex-row items-center justify-center gap-2 text-[#09090B] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                        <span className="whitespace-nowrap text-[13px] font-bold">{text}</span>
                        <ArrowRight size={16} strokeWidth={2.5} />
                    </div>
                    {/* The expanding glow background */}
                    <div className="absolute left-[20%] top-[40%] h-2 w-2 scale-[1] rounded-lg bg-[var(--color-accent-gold)] transition-all duration-300 group-hover:left-[0%] group-hover:top-[0%] group-hover:h-full group-hover:w-full group-hover:scale-[1.8] opacity-0 group-hover:opacity-100"></div>
                </>
            )}
        </button>
    );
});

InteractiveHoverButton.displayName = "InteractiveHoverButton";

export { InteractiveHoverButton };
