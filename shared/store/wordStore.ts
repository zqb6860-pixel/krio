import { create } from 'zustand';
import type { Word, WordBook } from '../types';

interface WordState {
  // 当前词库
  currentWordBook: WordBook | null;
  wordBooks: WordBook[];
  
  // 当前学习的单词列表
  currentWords: Word[];
  currentWordIndex: number;
  
  // 待复习单词
  reviewWords: Word[];
  
  // 搜索
  searchResults: Word[];
  
  // Actions
  setCurrentWordBook: (book: WordBook) => void;
  setWordBooks: (books: WordBook[]) => void;
  setCurrentWords: (words: Word[]) => void;
  nextWord: () => void;
  previousWord: () => void;
  setWordIndex: (index: number) => void;
  setReviewWords: (words: Word[]) => void;
  setSearchResults: (words: Word[]) => void;
}

export const useWordStore = create<WordState>((set) => ({
  currentWordBook: null,
  wordBooks: [],
  currentWords: [],
  currentWordIndex: 0,
  reviewWords: [],
  searchResults: [],

  setCurrentWordBook: (book) => set({ currentWordBook: book }),
  setWordBooks: (books) => set({ wordBooks: books }),
  setCurrentWords: (words) => set({ currentWords: words, currentWordIndex: 0 }),
  nextWord: () =>
    set((state) => ({
      currentWordIndex: Math.min(
        state.currentWordIndex + 1,
        state.currentWords.length - 1
      ),
    })),
  previousWord: () =>
    set((state) => ({
      currentWordIndex: Math.max(state.currentWordIndex - 1, 0),
    })),
  setWordIndex: (index) => set({ currentWordIndex: index }),
  setReviewWords: (words) => set({ reviewWords: words }),
  setSearchResults: (words) => set({ searchResults: words }),
}));
