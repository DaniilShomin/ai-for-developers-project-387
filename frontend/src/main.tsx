import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import App from './App.tsx'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/notifications/styles.css'

// Start MSW worker only when explicitly enabled via env variable
async function prepare() {
  if (import.meta.env.VITE_ENABLE_MSW === 'true') {
    const { worker } = await import('./mocks/browser')
    return worker.start({
      onUnhandledRequest: 'bypass',
    })
  }
  return Promise.resolve()
}

prepare().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <MantineProvider defaultColorScheme="light">
          <Notifications />
          <App />
        </MantineProvider>
      </BrowserRouter>
    </React.StrictMode>,
  )
})
