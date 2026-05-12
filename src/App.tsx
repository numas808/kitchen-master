import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Settings from './pages/Settings'
import Stock from './pages/Stock'
import RecipeHub from './pages/RecipeHub'

function App() {
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
