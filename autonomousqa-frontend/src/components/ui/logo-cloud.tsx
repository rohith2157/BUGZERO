import React from 'react';
import { InfiniteSlider } from './infinite-slider';
import { ProgressiveBlur } from './progressive-blur';

export const LogoCloud = ({ isDark }) => {
    // If it's dark mode, we invert the black logos to white.
    // If it's light mode, we keep them black.
    const logoStyle = { 
        filter: isDark ? 'brightness(0) invert(1)' : 'brightness(0)',
        opacity: 0.6,
        transition: 'opacity 0.2s ease',
        cursor: 'pointer'
    };

    return (
        <section style={{ paddingBottom: '64px' }}>
            <div className="group relative m-auto max-w-6xl px-6">
                <div className="flex flex-col items-center md:flex-row">
                    <div className="inline md:max-w-44 md:border-r border-white/10 md:pr-6 mb-6 md:mb-0">
                        <p className="text-center md:text-end text-sm text-gray-500 font-medium">Powering the best teams</p>
                    </div>
                    <div className="relative py-6 md:w-[calc(100%-11rem)] overflow-hidden">
                        <InfiniteSlider
                            durationOnHover={40}
                            duration={25}
                            gap={112}>
                            <div className="flex">
                                <img
                                    className="mx-auto h-5 w-fit"
                                    src="https://html.tailus.io/blocks/customers/nvidia.svg"
                                    alt="Nvidia Logo"
                                    height="20"
                                    width="auto"
                                    style={logoStyle}
                                />
                            </div>

                            <div className="flex">
                                <img
                                    className="mx-auto w-fit"
                                    src="https://html.tailus.io/blocks/customers/column.svg"
                                    alt="Column Logo"
                                    height="16"
                                    width="auto"
                                    style={{ filter: 'brightness(0) invert(1)' }}
                                />
                            </div>
                            <div className="flex">
                                <img
                                    className="mx-auto w-fit"
                                    src="https://html.tailus.io/blocks/customers/github.svg"
                                    alt="GitHub Logo"
                                    height="16"
                                    width="auto"
                                    style={{ filter: 'brightness(0) invert(1)' }}
                                />
                            </div>
                            <div className="flex">
                                <img
                                    className="mx-auto w-fit"
                                    src="https://html.tailus.io/blocks/customers/nike.svg"
                                    alt="Nike Logo"
                                    height="20"
                                    width="auto"
                                    style={{ filter: 'brightness(0) invert(1)' }}
                                />
                            </div>
                            <div className="flex">
                                <img
                                    className="mx-auto w-fit"
                                    src="https://html.tailus.io/blocks/customers/lemonsqueezy.svg"
                                    alt="Lemon Squeezy Logo"
                                    height="20"
                                    width="auto"
                                    style={{ filter: 'brightness(0) invert(1)' }}
                                />
                            </div>
                            <div className="flex">
                                <img
                                    className="mx-auto w-fit"
                                    src="https://html.tailus.io/blocks/customers/laravel.svg"
                                    alt="Laravel Logo"
                                    height="16"
                                    width="auto"
                                    style={{ filter: 'brightness(0) invert(1)' }}
                                />
                            </div>
                            <div className="flex">
                                <img
                                    className="mx-auto w-fit"
                                    src="https://html.tailus.io/blocks/customers/lilly.svg"
                                    alt="Lilly Logo"
                                    height="28"
                                    width="auto"
                                    style={{ filter: 'brightness(0) invert(1)' }}
                                />
                            </div>

                            <div className="flex">
                                <img
                                    className="mx-auto w-fit"
                                    src="https://html.tailus.io/blocks/customers/openai.svg"
                                    alt="OpenAI Logo"
                                    height="24"
                                    width="auto"
                                    style={{ filter: 'brightness(0) invert(1)' }}
                                />
                            </div>
                        </InfiniteSlider>

                        <ProgressiveBlur
                            className="pointer-events-none absolute left-0 top-0 h-full w-20"
                            direction="left"
                            blurIntensity={1}
                        />
                        <ProgressiveBlur
                            className="pointer-events-none absolute right-0 top-0 h-full w-20"
                            direction="right"
                            blurIntensity={1}
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}
