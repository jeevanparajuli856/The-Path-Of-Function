'use client';

import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/store';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const session = useGameStore((state) => state.session);

  useEffect(() => {
    // If user already has a valid session, redirect to game
    if (session && useGameStore.getState().isSessionValid()) {
      router.push('/game');
    }
  }, [session, router]);

  const handleStartGame = () => {
    router.push('/code-entry');
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="text-center max-w-2xl">
        {/* Title */}
        <h1 className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          The Path of Function
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-slate-300 mb-8">
          An Interactive Journey Through Programming Functions
        </p>

        {/* Description */}
        <div className="bg-slate-800 bg-opacity-50 border border-slate-700 rounded-lg p-8 mb-12">
          <p className="text-slate-200 text-lg leading-relaxed mb-4">
            Embark on an adventure where programming concepts come to life. Learn about functions,
            parameters, return values, and more through interactive challenges and real-world scenarios.
          </p>
          <p className="text-slate-300 text-sm">
            Each checkpoint will test your knowledge with code verification challenges.
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleStartGame}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-4 px-12 rounded-lg text-lg transition duration-200 transform hover:scale-105 inline-block"
        >
          Enter Game
        </button>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="bg-slate-800 bg-opacity-30 border border-slate-700 rounded-lg p-6">
            <h3 className="text-cyan-400 font-bold text-lg mb-2">Learn</h3>
            <p className="text-slate-300 text-sm">Master programming concepts through interactive storytelling</p>
          </div>
          <div className="bg-slate-800 bg-opacity-30 border border-slate-700 rounded-lg p-6">
            <h3 className="text-cyan-400 font-bold text-lg mb-2">Practice</h3>
            <p className="text-slate-300 text-sm">Solve challenges and verify your understanding with code</p>
          </div>
          <div className="bg-slate-800 bg-opacity-30 border border-slate-700 rounded-lg p-6">
            <h3 className="text-cyan-400 font-bold text-lg mb-2">Progress</h3>
            <p className="text-slate-300 text-sm">Track your learning journey and unlock achievements</p>
          </div>
        </div>
      </div>
    </div>
  );
}
