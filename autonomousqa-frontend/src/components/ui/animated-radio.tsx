"use client"

import { useState } from "react"
import { motion } from "framer-motion"

interface RadioOption {
    id: string
    value: string
    label: string
}

const options: RadioOption[] = [
    { id: "radio-live-test", value: "live-test", label: "Live Test" },
    { id: "radio-dashboard", value: "dashboard", label: "Dashboard" },
    { id: "radio-settings", value: "settings", label: "Settings" },
]

export default function AnimatedRadio() {
    const [selectedValue, setSelectedValue] = useState("dashboard")

    const handleChange = (value: string) => {
        setSelectedValue(value)
    }

    const getGliderTransform = () => {
        const index = options.findIndex((option) => option.value === selectedValue)
        return `translateY(${index * 100}%)`
    }

    return (
        <div className="flex items-center justify-center">
            <div className="relative flex flex-col pl-3 scale-150">
                {options.map((option) => (
                    <div key={option.id} className="relative z-20 py-1">
                        <input
                            id={option.id}
                            name="radio"
                            type="radio"
                            value={option.value}
                            checked={selectedValue === option.value}
                            onChange={(e) => handleChange(e.target.value)}
                            className="absolute w-full h-full m-0 opacity-0 cursor-pointer z-30 appearance-none"
                        />
                        <label
                            htmlFor={option.id}
                            className={`cursor-pointer text-xl py-2 px-1 block transition-all duration-300 ease-in-out ${selectedValue === option.value
                                    ? 'text-sky-500 dark:text-sky-400'
                                    : 'text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            {option.label}
                        </label>
                    </div>
                ))}

                {/* Glider Bar */}
                <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-neutral-800 to-transparent">
                    <div
                        className="relative h-1/3 w-full bg-gradient-to-b from-transparent via-sky-500 dark:via-sky-400 to-transparent transition-transform duration-500 ease-[cubic-bezier(0.37,1.95,0.66,0.56)]"
                        style={{ transform: getGliderTransform() }}
                    >
                        <div className="absolute top-1/2 -translate-y-1/2 h-3/5 w-[300%] bg-sky-500 dark:bg-sky-400 blur-[10px]" />
                        <div className="absolute left-0 h-full w-36 bg-gradient-to-r from-sky-500/20 dark:from-sky-500/20 to-transparent" />
                    </div>
                </div>
            </div>
        </div>
    )
}
