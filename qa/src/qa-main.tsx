import React from 'react'
import ReactDOM from 'react-dom/client'
import { QAShell } from './QAShell'
import '../../src/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QAShell />
  </React.StrictMode>,
)
