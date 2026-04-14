import { createRoot } from 'react-dom/client';
import { ReplayApp } from './ReplayApp.jsx';
import '../styles/base.css';
import '../styles/grid.css';
import './replay.css';

createRoot(document.getElementById('root')).render(<ReplayApp />);
