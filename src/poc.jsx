import { createRoot } from 'react-dom/client';
import HomeScreen from './poc/HomeScreen.jsx';
import './styles/base.css';
import './styles/card.css';

const container = document.getElementById('poc-root');
const root = container._root ?? createRoot(container);
container._root = root;
root.render(<HomeScreen />);

if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    root.unmount();
    container._root = null;
  });
}
