import React, { useState, ChangeEvent } from 'react';
import { cn } from "@/lib/utils";
import { User } from 'lucide-react';

export const DialogBox = () => {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('John Doe');
    const [username, setUsername] = useState('@johndoe');

    const handleNameChange = (e) => setName(e.target.value);
    const handleUsernameChange = (e) => setUsername(e.target.value);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const handleSave = () => {
        // Save logic here
        setOpen(false);
    };

    return (
        <>
            <button
                type="button"
                onClick={handleOpen}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border-none bg-transparent cursor-pointer text-[var(--text-secondary)] text-[13px] font-medium transition-all duration-100 hover:bg-[var(--glass-subtle)] hover:text-[var(--text-primary)]"
                aria-haspopup="dialog"
                aria-expanded={open}
            >
                <User size={14} />
                Edit Profile
            </button>
            {open && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    onClick={handleClose}
                >
                    <div 
                        className="bg-[#18181b] rounded-2xl shadow-2xl p-8 w-full max-w-md relative text-white border border-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={handleClose}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-white text-2xl focus:outline-none transition-colors"
                            aria-label="Close"
                        >
                            &times;
                        </button>
                        <h2 className="text-2xl font-bold mb-1 tracking-tight text-white">Edit profile</h2>
                        <p className="text-zinc-400 mb-7 text-sm">Make changes to your profile here. Click save when you're done.</p>
                        <form onSubmit={e => { e.preventDefault(); handleSave(); }} autoComplete="off">
                            <div className="mb-5">
                                <label htmlFor="name" className="block text-sm font-semibold mb-2 text-zinc-300">Name</label>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={handleNameChange}
                                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white focus:border-[var(--color-accent-gold)] focus:ring-1 focus:ring-[var(--color-accent-gold)] outline-none transition-all"
                                    autoComplete="off"
                                    required
                                />
                            </div>
                            <div className="mb-8">
                                <label htmlFor="username" className="block text-sm font-semibold mb-2 text-zinc-300">Username</label>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={handleUsernameChange}
                                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white focus:border-[var(--color-accent-gold)] focus:ring-1 focus:ring-[var(--color-accent-gold)] outline-none transition-all"
                                    autoComplete="off"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-4 py-2 rounded-lg border border-white/10 bg-transparent text-zinc-300 font-medium hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-[var(--color-accent-gold)] text-[#101112] font-semibold shadow hover:brightness-110 transition-all"
                                >
                                    Save changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};
