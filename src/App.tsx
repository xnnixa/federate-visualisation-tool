import './App.css'
import { Route, Routes, Link } from 'react-router-dom'
import TreePage from './TreePage'
import BlockPage from "./BlockPage.tsx";



function HomePage() {
  return <>
    <h1>Building Blocks Explorer</h1>
    <Link to="/tree"> Go to tree view</Link>
    <br></br>
    <Link to="/blocks"> Go to block view (not implemented yet)</Link>



  </>
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/blocks" element={<BlockPage />}></Route>
      <Route path="/tree" element={<TreePage />} />
    </Routes>
  )
}

export default App
