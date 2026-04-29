import React, { useState } from "react";
import { cn } from "../../lib/utils";

export const StarButton = ({ title = "Launch App", icon: Icon, onClick, className }) => {
  return (
    <label className={cn("relative", className)}>
      <input 
        type="checkbox" 
        className="peer hidden" 
        onChange={(e) => {
          if (e.target.checked && onClick) {
            onClick();
            // Optional: reset after animation so it can be clicked again
            setTimeout(() => { e.target.checked = false; }, 600);
          }
        }} 
      />
      <div
        className="group inline-flex shrink-0 whitespace-nowrap cursor-pointer items-center justify-center gap-4 overflow-hidden rounded-full border-[3px] border-amber-500 fill-none py-3 px-12 text-[15px] font-bold text-amber-500 transition-all peer-checked:fill-amber-500 peer-checked:hover:text-white active:scale-95"
      >
        <div className="z-10 transition group-hover:translate-x-4">{title}</div>
        {Icon ? (
          <Icon className="size-6 transition duration-500 group-hover:scale-[1500%] group-hover:-translate-x-10" strokeWidth={2.5} />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
            className="size-6 transition duration-500 group-hover:scale-[1500%] group-hover:-translate-x-10"
          >
            <path
              d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
              strokeLinejoin="round"
              strokeLinecap="round"
            ></path>
          </svg>
        )}
      </div>
    </label>
  );
};
