import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Match from './pages/Match'
import RecipeDetail from './pages/RecipeDetail'
import ShoppingList from './pages/ShoppingList'
import Settings from './pages/Settings'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#FAFAF8]">
        <div className="max-w-[430px] mx-auto min-h-screen relative">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/match" element={<Match />} />
            <Route path="/recipe/:id" element={<RecipeDetail />} />
            <Route path="/shopping/:id" element={<ShoppingList />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
