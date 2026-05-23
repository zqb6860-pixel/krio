'use client';

import { useState, useRef, useCallback } from 'react';

interface AudioButtonProps {
  audioUrl?: string | null;
  word?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'white' | 'ghost';
}

/**
 * 单词发音按钮组件
 * 支持从 dictionaryapi.dev 音频 URL 播放
 * 如果没有音频URL，使用浏览器 Web Speech API 作为备选
 */
export function AudioButton({ audioUrl, word, size = 'md', variant = 'default' }: AudioButtonProps) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(async () => {
    if (playing) return;
    setPlaying(true);

    try {
      if (audioUrl) {
        // 使用真实音频文件播放
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => setPlaying(false);
        audioRef.current.onerror = () => {
          // 如果音频加载失败，回退到 TTS
          speakWithTTS(word || '');
          setPlaying(false);
        };
        await audioRef.current.play();
      } else if (word) {
        // 使用浏览器 Web Speech API 作为备选
        speakWithTTS(word);
      }
    } catch {
      // 播放失败时尝试 TTS
      if (word) speakWithTTS(word);
    }

    // 安全超时：最多 3 秒后重置状态
    setTimeout(() => setPlaying(false), 3000);
  }, [audioUrl, word, playing]);

  const sizeClasses = {
    sm: 'w-7 h-7 text-sm',
    md: 'w-10 h-10 text-lg',
    lg: 'w-12 h-12 text-xl',
  };

  const variantClasses = {
    default: 'bg-blue-50 hover:bg-blue-100 text-blue-600',
    white: 'bg-white/20 hover:bg-white/30 text-white',
    ghost: 'hover:bg-slate-100 text-slate-500',
  };

  return (
    <button
      onClick={(e) => { e.stopPropagation(); play(); }}
      disabled={playing}
      className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-full flex items-center justify-center transition-all duration-200 ${
        playing ? 'animate-pulse scale-110' : 'hover:scale-105'
      }`}
      title="播放发音"
    >
      {playing ? '🔊' : '🔈'}
    </button>
  );
}

/**
 * 使用浏览器 Web Speech API 朗读单词
 */
function speakWithTTS(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  
  // 取消之前的朗读
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.85;
  utterance.pitch = 1;
  
  // 尝试选择英文语音
  const voices = window.speechSynthesis.getVoices();
  const enVoice = voices.find(v => v.lang.startsWith('en-US')) || 
                  voices.find(v => v.lang.startsWith('en'));
  if (enVoice) utterance.voice = enVoice;
  
  window.speechSynthesis.speak(utterance);
}
