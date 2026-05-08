import { Routes, Route } from 'react-router-dom';
import DashBoard from './pages/DashBoard';
import WatchMovie from './pages/WatchMovie';

export default function App() {
  return (
    
      <Routes>
        <Route path='/' element={<DashBoard />} />
        <Route path='/watch/:id' element={<WatchMovie />} />
      </Routes>

  );
}
