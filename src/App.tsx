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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef8ef,_#f3e7d6_45%,_#f6f0e7)] px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[430px] items-center justify-center">
        <div className="w-full rounded-[28px] border border-[#e7d9c5]/80 bg-[#fffaf2]/90 p-6 shadow-[0_24px_80px_rgba(91,69,43,0.18)] backdrop-blur">
          <p className="text-xs font-bold tracking-[0.24em] text-[#7a5c3e]">PRIVATE ACCESS</p>
          <h1 className="mt-3 text-2xl font-black text-[#3f3328]">Kitchen Master</h1>
          <p className="mt-3 text-sm leading-6 text-[#746353]">このアプリはパスワード保護されています。アクセス用パスワードを入力してください。</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-[#5f4f40]">Access Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-[#ddc9b1] bg-[#f8efe3] px-4 py-3 text-sm text-[#3f3328] outline-none transition focus:border-[#7a5c3e] focus:bg-[#fffdf9]"
                placeholder="パスワードを入力"
                autoComplete="current-password"
              />
            </label>

            {error ? <p className="text-sm font-medium text-[#a44a2a]">{error}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting || password.trim().length === 0}
              className="w-full rounded-2xl bg-[#7a5c3e] px-4 py-3 text-sm font-bold text-[#fff8ed] transition hover:bg-[#664b31] disabled:cursor-not-allowed disabled:opacity-60"
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
    return <div className="min-h-screen bg-[#f6f0e7]" />
  }

  if (accessState.protectionEnabled && !accessState.isAuthenticated) {
    return <AccessGate onUnlocked={() => setAccessState((current) => ({ ...current, isAuthenticated: true }))} />
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#f6f0e7]">
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
