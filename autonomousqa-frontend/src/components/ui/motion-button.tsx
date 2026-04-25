'use client'

import { FC } from 'react'
import { motion } from 'framer-motion'
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
    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        'bg-background group relative h-14 w-[240px] cursor-pointer rounded-full border-[none] outline-none',
        classes
      )}
      {...props}
    >
      <div className="absolute inset-y-0 left-[-8%] w-full flex items-center justify-start z-0">
        <span className='circle bg-primary absolute left-1 h-12 w-12 overflow-hidden rounded-full duration-500 group-hover:w-[calc(108%-8px)]' aria-hidden='true'></span>
        <ArrowRight className='text-background size-6 absolute left-4 z-10 duration-500 group-hover:translate-x-1' />
      </div>

      <div className="relative z-10 flex h-full items-center justify-center w-full px-6 pointer-events-none">
        <span className='button-text text-foreground group-hover:text-background font-manrope text-lg font-bold tracking-tight whitespace-nowrap duration-500'>
          {label}
        </span>
      </div>
    </motion.button>
  )
}

export default MotionButton
