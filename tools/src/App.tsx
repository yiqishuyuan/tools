import { HelmetProvider } from 'react-helmet-async'
import AppRouter from './router'
import { ThemeModeProvider } from './context/ThemeModeContext'

function App() {
  return (
    <HelmetProvider>
      <ThemeModeProvider>
        <AppRouter />
      </ThemeModeProvider>
    </HelmetProvider>
  )
}

export default App
