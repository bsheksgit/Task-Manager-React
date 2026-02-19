import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { StyledEngineProvider } from '@mui/material/styles';
import GlobalStyles from '@mui/material/GlobalStyles';
import store from './store/index.js';
import { Provider } from 'react-redux';
import Login from './pages/Login.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
  <Provider store={store}>
  <StyledEngineProvider enableCssLayer>
  <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
    <App />
  </StyledEngineProvider>
  </Provider>
  </StrictMode>,
)
