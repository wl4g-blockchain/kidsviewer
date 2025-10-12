import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  getSystemTheme: () => 'light' | 'dark';
  updateTheme: () => void;
}

// 检测系统主题
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  
  const hour = new Date().getHours();
  // 6:00-18:00 为白天，18:00-6:00 为夜晚
  return hour >= 6 && hour < 18 ? 'light' : 'dark';
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'auto',
      isDark: getSystemTheme() === 'dark',
      
      setMode: (mode: ThemeMode) => {
        set({ mode });
        get().updateTheme();
      },
      
      toggleTheme: () => {
        const { mode } = get();
        const newMode = mode === 'light' ? 'dark' : 'light';
        set({ mode: newMode });
        get().updateTheme();
      },
      
      getSystemTheme,
      
      updateTheme: () => {
        const { mode } = get();
        let isDark: boolean;
        
        switch (mode) {
          case 'light':
            isDark = false;
            break;
          case 'dark':
            isDark = true;
            break;
          case 'auto':
          default:
            isDark = getSystemTheme() === 'dark';
            break;
        }
        
        set({ isDark });
        
        // 更新HTML根元素的class
        if (typeof document !== 'undefined') {
          const root = document.documentElement;
          if (isDark) {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        }
      },
    }),
    {
      name: 'kidsviewer-theme',
      partialize: (state) => ({ mode: state.mode }),
    }
  )
);

// 初始化主题
if (typeof window !== 'undefined') {
  const store = useThemeStore.getState();
  store.updateTheme();
  
  // 监听系统主题变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (store.mode === 'auto') {
      store.updateTheme();
    }
  });
  
  // 每分钟检查一次时间变化（用于auto模式）
  setInterval(() => {
    if (store.mode === 'auto') {
      store.updateTheme();
    }
  }, 60000);
}
