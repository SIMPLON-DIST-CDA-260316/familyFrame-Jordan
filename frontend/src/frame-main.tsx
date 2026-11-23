import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Frame from './Frame.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Frame />
  </StrictMode>,
)
