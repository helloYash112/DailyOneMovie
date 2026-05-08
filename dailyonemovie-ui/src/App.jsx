import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import WatchMovie from './pages/WatchMovie';

export default function App() {
  return (
    
      <Routes>
        <Route path='/' element={<Dashboard />} />
        <Route path='/watch/:id' element={<WatchMovie />} />
      </Routes>

  );
}
