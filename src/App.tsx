import { useEffect, useState, type FormEvent } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Settings from './pages/Settings'
import Stock from './pages/Stock'
import RecipeHub from './pages/RecipeHub'
import { fetchAccessSession, loginWithAccessPassword } from './services/accessAuth'

function AccessGate({ onUnlocked }: { onUnlocked: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await loginWithAccessPassword(password)
      onUnlocked()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'パスワード認証に失敗しました。')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed,_#fae8ff_45%,_#fafaf8)] px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[430px] items-center justify-center">
        <div className="w-full rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.16)] backdrop-blur">
          <p className="text-xs font-bold tracking-[0.24em] text-[#1F6B5B]">PRIVATE ACCESS</p>
          <h1 className="mt-3 text-2xl font-black text-slate-900">Kitchen Master</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">このアプリはパスワード保護されています。アクセス用パスワードを入力してください。</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">Access Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#1F6B5B] focus:bg-white"
                placeholder="パスワードを入力"
                autoComplete="current-password"
              />
            </label>

            {error ? <p className="text-sm font-medium text-[#C2410C]">{error}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting || password.trim().length === 0}
              className="w-full rounded-2xl bg-[#1F6B5B] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#185548] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? '確認中...' : 'アクセスする'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [accessState, setAccessState] = useState<{
    isLoading: boolean
    isAuthenticated: boolean
    protectionEnabled: boolean
  }>({
    isLoading: true,
    isAuthenticated: false,
    protectionEnabled: true,
  })

  useEffect(() => {
    let active = true

    const loadAccessSession = async () => {
      try {
        const session = await fetchAccessSession()

        if (!active) {
          return
        }

        setAccessState({
          isLoading: false,
          isAuthenticated: session.authenticated || !session.protectionEnabled,
          protectionEnabled: session.protectionEnabled,
        })
      } catch {
        if (!active) {
          return
        }

        setAccessState({
          isLoading: false,
          isAuthenticated: false,
          protectionEnabled: true,
        })
      }
    }

    loadAccessSession()

    return () => {
      active = false
    }
  }, [])

  if (accessState.isLoading) {
    return <div className="min-h-screen bg-[#FAFAF8]" />
  }

  if (accessState.protectionEnabled && !accessState.isAuthenticated) {
    return <AccessGate onUnlocked={() => setAccessState((current) => ({ ...current, isAuthenticated: true }))} />
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#FAFAF8]">
        <div className="max-w-[430px] mx-auto min-h-screen relative">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/stockhub" element={<Stock />} />
            <Route path="/recipehub" element={<RecipeHub />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
