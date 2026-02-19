import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import TreePage from './TreePage'



function HomePage() {
  return <>


  </>
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/tree" replace />} />
      <Route path="/tree" element={<TreePage />} />
    </Routes>
  )
}

export default App
