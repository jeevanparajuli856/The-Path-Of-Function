'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="h-screen overflow-hidden relative">
      {/* Banner as full-screen background */}
      <img
        src="/assets/banner.png"
        alt="The Path of Function"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Dark scrim for readability */}
      <div className="absolute inset-0 bg-black/30" />

      {/* All content overlaid */}
      <div className="relative z-10 h-full flex flex-col justify-between px-6 py-10">
        {/* Tagline + CTA — placed below banner title text */}
        <div className="flex-1 flex flex-col items-center justify-end gap-4 pb-24">
          <p className="text-white text-xl drop-shadow-lg tracking-wide">
            Learn Python functions through story
          </p>
          <button
            onClick={() => router.push('/code-entry')}
            className="btn-game text-xl py-4 px-16 hover:scale-105 transform transition shadow-xl"
          >
            Enter Game
          </button>
        </div>

        {/* Bottom — feature cards */}
        <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto w-full">
          <div className="bg-white/70 backdrop-blur-sm border border-[#C9A899] rounded-xl p-5">
            <h3 className="text-[#6AA6D9] font-bold text-lg mb-1">Learn</h3>
            <p className="text-[#2E2E2E] text-sm">Master programming concepts through interactive storytelling</p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm border border-[#C9A899] rounded-xl p-5">
            <h3 className="text-[#6AA6D9] font-bold text-lg mb-1">Practice</h3>
            <p className="text-[#2E2E2E] text-sm">Solve challenges and verify your understanding with code</p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm border border-[#C9A899] rounded-xl p-5">
            <h3 className="text-[#6AA6D9] font-bold text-lg mb-1">Progress</h3>
            <p className="text-[#2E2E2E] text-sm">Track your learning journey and unlock achievements</p>
          </div>
        </div>
      </div>
    </div>
  );
}
