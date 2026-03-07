'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';

interface ChatBotProps {
  sessionToken: string;
  currentScene: string;
  isBlocked?: boolean;
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

export default function ChatBot({ sessionToken, currentScene, isBlocked = false, gameContext }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    { role: 'assistant', text: "Hi! I'm Emma. Ask me anything about what we're learning in the game!" },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [avatarState, setAvatarState] = useState<'idle' | 'thinking' | 'explaining' | 'confused'>('idle');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading || isBlocked) return;
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

  if (isBlocked) {
    return null;
  }

  return (
    <>
      {/* Game Pause Overlay - makes game unclickable when chat is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 z-[100]"
          style={{ pointerEvents: 'auto' }}
        />
      )}

      {/* Expanded Panel - Visual Novel Style Dialogue Box */}
      {isOpen && (
        <div className="fixed bottom-28 right-6 z-[110] w-96 rounded-3xl overflow-hidden shadow-2xl" 
             style={{ 
               backgroundColor: 'rgba(249, 246, 240, 0.98)',
               border: '3px solid #C9A899',
               backdropFilter: 'blur(10px)'
             }}>
          {/* Panel Header - Like VN Name Tag */}
          <div className="bg-gradient-to-r from-[#C9A899] to-[#D4B5A5] px-4 py-3 flex items-center gap-3 border-b-2 border-[#B8978A]">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden shadow-lg">
                <img
                  src={avatarMap[avatarState]}
                  alt="Emma avatar"
                  className="w-full h-full object-cover object-center scale-[1.65]"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1">
              <span className="text-[#2E2E2E] font-bold text-lg block">Ask Emma</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#2E2E2E] hover:text-red-600 font-bold text-2xl leading-none w-8 h-8 flex items-center justify-center hover:bg-white/30 rounded-full transition"
              aria-label="Close chat"
            >
              ×
            </button>
          </div>

          {/* Message List - Visual Novel Dialogue Style */}
          <div className="p-4 overflow-y-auto max-h-80 flex flex-col gap-3" 
               style={{ 
                 backgroundColor: 'rgba(247, 243, 234, 0.95)',
                 backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(201, 168, 153, 0.05) 0%, transparent 50%)'
               }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    <img
                      src={avatarMap[avatarState]}
                      alt="Emma"
                      className="w-full h-full object-cover object-center scale-[1.65]"
                    />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-3 max-w-[80%] shadow-md ${
                    msg.role === 'user'
                      ? 'bg-[#6AA6D9] text-white'
                      : 'bg-white/90 border-2 border-[#C9A899] text-[#2E2E2E]'
                  }`}
                  style={{
                    backdropFilter: msg.role === 'assistant' ? 'blur(5px)' : 'none'
                  }}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  <img
                    src={avatarMap.thinking}
                    alt="Emma thinking"
                    className="w-full h-full object-cover object-center scale-[1.65]"
                  />
                </div>
                <div className="bg-white/90 border-2 border-[#C9A899] text-[#2E2E2E] rounded-2xl px-4 py-3 shadow-md">
                  <span className="animate-pulse">Emma is thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Row - Visual Novel Style */}
          <div className="bg-gradient-to-r from-[#F0EBE0] to-[#F7F3EA] border-t-2 border-[#C9A899] p-3">
            <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2 shadow-inner border border-[#C9A899]">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Emma something..."
                className="flex-1 text-sm py-1 bg-transparent border-none outline-none text-[#2E2E2E] placeholder-[#9A9A9A]"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !inputValue.trim()}
                className="bg-[#6AA6D9] hover:bg-[#5A96C9] disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-md hover:shadow-lg"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Icon (collapsed) */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-[110] w-24 h-24 cursor-pointer drop-shadow-lg hover:scale-105 transition p-0 bg-transparent border-none"
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
