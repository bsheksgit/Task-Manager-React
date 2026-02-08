import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { StyledEngineProvider } from '@mui/material/styles';
import GlobalStyles from '@mui/material/GlobalStyles';


createRoot(document.getElementById('root')).render(
  <StrictMode>
  <StyledEngineProvider enableCssLayer>
  <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
    <App />
  </StyledEngineProvider>
  </StrictMode>,
)
