'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';

interface ChatBotProps {
  sessionToken: string;
  currentScene: string;
  gameContext?: {
    scene_id?: string;
    topic_id?: string;
    learning_objective?: string;
    help_policy?: { allowed_help_level?: string; spoiler_guard?: string };
    player_state?: Record<string, unknown>;
  };
}

const avatarMap = {
  idle:       '/assets/chatbot/Avatar_Idle.png',
  thinking:   '/assets/chatbot/Avatar_Thinking.png',
  explaining: '/assets/chatbot/Avatar_Explaining.png',
  confused:   '/assets/chatbot/Avatar_Confused.png',
};

export default function ChatBot({ sessionToken, currentScene, gameContext }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    { role: 'assistant', text: "Hi! I'm Emma. Ask me anything about what we're learning in the game!" },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [avatarState, setAvatarState] = useState<'idle' | 'thinking' | 'explaining' | 'confused'>('idle');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    const userMsg = inputValue.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setInputValue('');
    setAvatarState('thinking');
    setIsLoading(true);
    try {
      const context = {
        ...(gameContext || {}),
        scene_id: gameContext?.scene_id || currentScene || undefined,
      };
      const res = await apiClient.post('/chat/ask', {
        session_token: sessionToken,
        message: userMsg,
        context,
      });
      setMessages((prev) => [...prev, { role: 'assistant', text: res.data.assistant_message }]);
      setAvatarState('explaining');
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: "I'm having trouble right now. Try again!" }]);
      setAvatarState('confused');
    } finally {
      setIsLoading(false);
      setTimeout(() => setAvatarState('idle'), 3000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Expanded Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 rounded-2xl overflow-hidden shadow-2xl border border-[#C9A899]">
          {/* Panel Header */}
          <div className="bg-[#C9A899] px-4 py-3 flex items-center gap-3">
            <img
              src={avatarMap[avatarState]}
              alt="Emma avatar"
              className="w-12 h-12 rounded-full object-cover border-2 border-white"
            />
            <span className="text-[#2E2E2E] font-bold flex-1">Emma AI Tutor</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#2E2E2E] hover:text-red-600 font-bold text-lg leading-none"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          {/* Message List */}
          <div className="bg-[#F7F3EA] p-3 overflow-y-auto max-h-64 flex flex-col gap-2">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`rounded-xl px-3 py-2 max-w-[75%] text-sm ${
                  msg.role === 'user'
                    ? 'self-end bg-[#6AA6D9] text-white'
                    : 'self-start bg-white border border-[#C9A899] text-[#2E2E2E]'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="self-start bg-white border border-[#C9A899] text-[#2E2E2E] rounded-xl px-3 py-2 text-sm">
                <span className="animate-pulse">...</span>
              </div>
            )}
          </div>

          {/* Input Row */}
          <div className="bg-white border-t border-[#C9A899] flex items-center px-3 py-2 gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Emma something..."
              className="input-game flex-1 text-sm py-1"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim()}
              className="bg-[#6AA6D9] hover:bg-[#4A8CC4] disabled:opacity-50 text-white px-3 py-1 rounded-lg text-sm transition"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Chat Icon (collapsed) */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 cursor-pointer drop-shadow-lg hover:scale-105 transition p-0 bg-transparent border-none"
        aria-label="Open Emma chat"
      >
        <img
          src="/assets/chatbot/chatIcon.png"
          alt="Chat with Emma"
          className="w-full h-full object-contain"
        />
      </button>
    </>
  );
}
