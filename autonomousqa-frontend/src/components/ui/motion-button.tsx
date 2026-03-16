'use client'

import { FC } from 'react'
import { ArrowRight } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
function cn(...inputs: any[]) { return twMerge(clsx(inputs)) }

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  variant?: 'primary' | 'secondary'
  classes?: string
  animate?: boolean
  delay?: number
}

const MotionButton: FC<Props> = ({ label, classes, onClick, ...props }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'bg-background group relative h-14 min-w-[220px] cursor-pointer rounded-full border-[none] p-1 flex items-center pr-8 outline-none',
        classes
      )}
      {...props}
    >
      <span
        className='circle bg-primary absolute left-1 m-0 block h-12 w-12 overflow-hidden rounded-full duration-500 group-hover:w-[calc(100%-8px)]'
        aria-hidden='true'
      ></span>
      <div className='icon absolute left-4 duration-500 group-hover:translate-x-1'>
        <ArrowRight className='text-background size-6' />
      </div>
      <span className='button-text text-foreground group-hover:text-background font-manrope relative z-10 w-full text-center pl-10 text-lg font-medium tracking-tight whitespace-nowrap duration-500'>
        {label}
      </span>
    </button>
  )
}

export default MotionButton
