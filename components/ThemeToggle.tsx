'use client'

import { useTheme } from '@/hooks/useTheme'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme()

  if (!mounted) {
    // SSR placeholder — same dimensions, no flicker
    return (
      <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-100 rounded-xl" />
          <div>
            <p className="text-sm font-medium text-slate-900">Appearance</p>
            <p className="text-xs text-slate-500 mt-0.5">Loading…</p>
          </div>
        </div>
        <div className="w-14 h-8 rounded-full bg-slate-200" />
      </div>
    )
  }

  const isDark = theme === 'dark'

  return (
    <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-200 transition-colors duration-200">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center transition-colors">
          {isDark ? (
            <Moon className="w-4.5 h-4.5 text-slate-600" />
          ) : (
            <Sun className="w-4.5 h-4.5 text-slate-600" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">Appearance</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {isDark ? 'Dark' : 'Light'} mode is active
          </p>
        </div>
      </div>

      {/* Animated pill toggle */}
      <button
        role="switch"
        aria-checked={isDark}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        onClick={toggleTheme}
        className={`
          relative inline-flex h-8 w-14 items-center rounded-full
          transition-colors duration-300 ease-in-out
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
          focus-visible:ring-slate-400
          ${isDark ? 'bg-slate-700' : 'bg-slate-300'}
        `}
      >
        {/* Background icons */}
        <Sun  className="absolute left-1.5 w-3.5 h-3.5 text-amber-500 opacity-60" />
        <Moon className="absolute right-1.5 w-3.5 h-3.5 text-slate-400 opacity-60" />

        {/* Sliding thumb */}
        <span
          className={`
            inline-flex h-6 w-6 items-center justify-center rounded-full
            shadow-md
            transition-transform duration-300 ease-in-out
            ${isDark ? 'translate-x-7' : 'translate-x-1'}
          `}
          style={{ backgroundColor: '#ffffff' }}
        >
          {isDark ? (
            <Moon className="w-3.5 h-3.5 text-slate-700" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          )}
        </span>
      </button>
    </div>
  )
}
