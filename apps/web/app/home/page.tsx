"use client";

import { useState } from "react";
import { cn } from "@repo/ui/lib/utils";
import Link from "next/link";
import { LayoutGroup, motion, Transition } from "motion/react";
import HeyOdama from "@repo/ui/svgs/hey-odama";

export default function Hero() {
    const [actions] = useState([
        {
            href: '#', // Placeholder for your actual signup link
            label: "Get Started",
            type: "primary",
            _id: "free",
        },
    ]);

    // Define common transition for elements
    const transition: Transition = { type: "spring", damping: 30, stiffness: 400 };

    return (
        <section className="relative h-screen w-full overflow-hidden border-b border-[--border] dark:border-[--dark-border]">
            {/* Grid Background */}
            <div className="absolute top-0 left-0 z-0 grid h-full w-full grid-cols-[clamp(28px,10vw,120px)_auto_clamp(28px,10vw,120px)]">
                <div className="col-span-1 flex h-full items-center justify-center border-r border-[--border] dark:border-[--dark-border]" />
                <div className="col-span-1 flex h-full items-center justify-center" />
                <div className="col-span-1 flex h-full items-center justify-center border-l border-[--border] dark:border-[--dark-border]" />
            </div>

            {/* Blobs */}
            <figure className="pointer-events-none absolute -bottom-[70%] left-1/2 z-0 block aspect-square w-[520px] -translate-x-1/2 rounded-full bg-orange-200 blur-[200px] dark:bg-orange-400" />
            <figure className="pointer-events-none absolute top-16 left-[4vw] z-20 hidden aspect-square w-[32vw] rounded-full bg-orange-100 opacity-50 blur-[100px] md:block dark:bg-orange-600/20" />
            <figure className="pointer-events-none absolute right-[7vw] bottom-[-50px] z-20 hidden aspect-square w-[30vw] rounded-full bg-orange-100 opacity-50 blur-[100px] md:block dark:bg-orange-600/20" />

            {/* Main Content */}
            <div className="relative z-10 flex h-full flex-col divide-y divide-[--border] dark:divide-[--dark-border]">

                {/* Text Area */}
                <div className="flex flex-1 flex-col items-center justify-center">
                    <div className="mx-auto flex min-h-72 max-w-[80vw] shrink-0 flex-col items-center justify-center gap-2 px-2 py-4 sm:px-16 lg:px-24">
                        <div className="flex items-center gap-x-2">
                            <p className="text-4xl sm:text-6xl font-medium tracking-[-1.44px]">Hey</p>
                            <div className="flex items-center">
                                <HeyOdama className="w-10 sm:w-16 h-auto" />
                                <p className="text-4xl sm:text-6xl font-medium tracking-[-1.44px]">
                                    dama
                                </p>
                            </div>
                        </div>
                        <LayoutGroup>
                            <motion.h1
                                className="flex max-w-5xl flex-wrap items-center justify-center gap-x-3 text-center text-[clamp(32px,7vw,64px)] leading-none font-medium tracking-[-1.44px] text-pretty text-gray-900 md:tracking-[-2.16px] dark:text-gray-50"
                                layout
                            >
                                {/* Animation 1: Headline Part 1 */}
                                <motion.span
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ ...transition, delay: 0.2 }}
                                    layout
                                >
                                    It&apos;s basically Google Meet but{" "}
                                </motion.span>
                                {/* Animation 2: Headline Part 2 (Staggered) */}
                                <motion.span
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ ...transition, delay: 0.3 }}
                                    layout
                                    className="text-orange-600 dark:text-orange-500"
                                >
                                    {" "}
                                    on steroids.
                                </motion.span>
                            </motion.h1>
                        </LayoutGroup>

                        {/* Animation 3: Subheadline */}
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...transition, duration: 0.6, delay: 0.5 }}
                            className="text-md max-w-2xl text-center text-pretty text-muted-foreground md:text-lg"
                        >
                            Yeah, we cloned the big guys. But we stripped out the tracking, the bloat, and the corporate despair. It&rsquo;s just video chat, but fast enough to get a speeding ticket.
                        </motion.h2>
                    </div>
                </div>

                {/* Animation 4: Bottom Bar (Slides up) */}
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...transition, duration: 0.8, delay: 0.7 }}
                    className="flex w-full items-center justify-center py-6 bg-white/50 backdrop-blur-sm dark:bg-black/50"
                >
                    <div className="flex w-full max-w-[80vw] flex-col items-center justify-start md:max-w-[392px]!">
                        {actions?.map(({ href, label, type, _id }) => (
                            <Link
                                key={_id}
                                target="_blank"
                                className={cn(
                                    "h-14! flex-col items-center justify-center rounded-none text-base! font-semibold uppercase tracking-wide",
                                    type === "primary"
                                        ? "bg-brand flex w-full text-white hover:bg-orange-600 transition-all"
                                        : "max-w-sm:border-x-0! flex w-full border-x! border-y-0! border-[--border] bg-transparent! backdrop-blur-xl transition-colors duration-150 hover:bg-black/5! dark:border-[--dark-border] dark:hover:bg-white/5!",
                                )}
                                href={href}
                            >
                                {label}
                            </Link>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}