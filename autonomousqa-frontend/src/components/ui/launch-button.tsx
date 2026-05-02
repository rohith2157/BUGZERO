import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LaunchButton({ 
  text = "START LAUNCH APP", 
  icon, 
  className, 
  ...props 
}) {
  return (
    <button
      className={cn(
        "group flex items-center justify-center gap-4 rounded-full border-[3px] border-[#FF9900] px-10 py-4 bg-transparent transition-all duration-300 hover:bg-[#FF9900]/10 hover:shadow-[0_0_20px_rgba(255,153,0,0.3)] active:scale-95",
        className
      )}
      {...props}
    >
      <span className="text-2xl font-black uppercase tracking-wider text-[#FF9900]">
        {text}
      </span>
      {icon || (
        <Star 
          className="h-8 w-8 text-[#FF9900] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" 
          strokeWidth={2.5} 
        />
      )}
    </button>
  );
}
