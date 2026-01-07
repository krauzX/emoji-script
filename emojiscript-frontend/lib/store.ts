import { create } from "zustand";
import { persist } from "zustand/middleware";

type TargetLanguage = "javascript";

type SyntaxMode = "emoji" | "markup";

interface EditorState {
  code: string;
  output: string;
  error: string | null;
  warnings: string[];
  isTranspiling: boolean;
  targetLanguage: TargetLanguage;
  syntaxMode: SyntaxMode;
  usedMarkup: boolean;
  setCode: (code: string) => void;
  setOutput: (output: string) => void;
  setError: (error: string | null) => void;
  setWarnings: (warnings: string[]) => void;
  setIsTranspiling: (isTranspiling: boolean) => void;
  setTargetLanguage: (language: TargetLanguage) => void;
  setSyntaxMode: (mode: SyntaxMode) => void;
  setUsedMarkup: (used: boolean) => void;
}

interface ThemeState {
  theme: "dark";
}

interface SettingsState {
  autoTranspile: boolean;
  fontSize: number;
  showSuggestions: boolean;
  setAutoTranspile: (autoTranspile: boolean) => void;
  setFontSize: (fontSize: number) => void;
  setShowSuggestions: (show: boolean) => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      code: '<print>"Hello, EmojiScript! 🎉"</print>',
      output: "",
      error: null,
      warnings: [],
      isTranspiling: false,
      targetLanguage: "javascript",
      syntaxMode: "markup",
      usedMarkup: false,
      setCode: (code) => set({ code }),
      setOutput: (output) => set({ output, error: null }),
      setError: (error) => set({ error }),
      setWarnings: (warnings) => set({ warnings }),
      setIsTranspiling: (isTranspiling) => set({ isTranspiling }),
      setTargetLanguage: (targetLanguage) => set({ targetLanguage }),
      setSyntaxMode: (syntaxMode) => set({ syntaxMode }),
      setUsedMarkup: (usedMarkup) => set({ usedMarkup }),
    }),
    {
      name: "emojiscript-editor",
      partialize: (state) => ({
        targetLanguage: state.targetLanguage,
        syntaxMode: state.syntaxMode,
      }),
    }
  )
);

// Dark mode only - always returns dark
export const useThemeStore = create<ThemeState>()(() => ({
  theme: "dark",
}));

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      autoTranspile: true,
      fontSize: 14,
      showSuggestions: true,
      setAutoTranspile: (autoTranspile) => set({ autoTranspile }),
      setFontSize: (fontSize) => set({ fontSize }),
      setShowSuggestions: (showSuggestions) => set({ showSuggestions }),
    }),
    {
      name: "emojiscript-settings",
    }
  )
);
