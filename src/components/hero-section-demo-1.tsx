"use client";

import LandingPageNavBar from "./LandingPageNavBar";

type HeroSectionOneProps = {
  isDarkMode: boolean;

  onLogin?: () => void;
};

const titleWords = "Classroom Support, Simplified. ".split(" ");

export default function HeroSectionOne({
  isDarkMode,
  
  onLogin,
}: HeroSectionOneProps) {
  return (
    <div className="relative mx-auto flex max-w-7xl flex-col items-center w-full justify-center">
    
      <div className="absolute inset-y-0 left-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute top-0 h-40 w-px bg-gradient-to-b from-transparent via-violet-500 to-transparent" />
      </div>
      <div className="absolute inset-y-0 right-0 h-full w-px bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute h-40 w-px bg-gradient-to-b from-transparent via-violet-500 to-transparent" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px w-full bg-neutral-200/80 dark:bg-neutral-800/80">
        <div className="absolute mx-auto h-px w-40 bg-gradient-to-r from-transparent via-violet-500 to-transparent" />
      </div>
      <div className="px-4 py-10 md:py-20">
        <h1 className="relative z-10 mx-auto max-w-4xl text-center text-2xl font-bold text-slate-700 md:text-4xl lg:text-7xl dark:text-slate-300">
          {titleWords.map((word, index) => (
            <span key={index} className="mr-2 inline-block transition-opacity duration-500 ease-in-out">
              {word}
            </span>
          ))}
        </h1>
        <p className="relative z-10 mx-auto max-w-xl py-4 text-center text-lg font-normal text-neutral-600 dark:text-neutral-400 transition-opacity duration-700 ease-in-out">
        Assign, track, and complete AV tasks effortlessly.
        </p>
        <div className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-4 transition-opacity duration-700 ease-in-out">
          <button
            className="w-60 transform rounded-lg bg-black px-6 py-2 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            onClick={onLogin}
          >
            Log In
          </button>
          <button
            className="w-60 transform rounded-lg border border-gray-300 bg-white px-6 py-2 font-medium text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-100 dark:border-gray-700 dark:bg-black dark:text-white dark:hover:bg-gray-900"
            onClick={() => window.open("https://avoc-proposal.vercel.app", "_blank")}
          >
            Read Proposal
          </button>
        </div>
        <div className="relative z-10 mt-20 rounded-3xl border border-neutral-200 bg-neutral-100 p-4 shadow-md transition-opacity duration-1000 ease-in-out dark:border-neutral-800 dark:bg-neutral-900">
          <div className="w-full overflow-hidden rounded-xl border border-gray-300 dark:border-gray-700">
          {isDarkMode ? (
            <img
              src="landdark.png"
              alt="Landing page preview"
              className="aspect-[16/9] h-auto w-full object-cover"
              height={1000}
              width={1000}
            />
            ) : (
              <img
                src="land.png"
                alt="Landing page preview"
                className="aspect-[16/9] h-auto w-full object-cover"
                height={1000}
                width={1000}
              />
            )}
          
          </div>
        </div>
      </div>
    </div>
  );
}
