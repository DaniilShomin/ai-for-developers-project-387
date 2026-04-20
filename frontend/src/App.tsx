import { Routes, Route } from 'react-router-dom'
import {
  AppShell,
  Group,
  Title,
  Button,
  UnstyledButton,
  Divider,
  Menu,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import {
  IconCalendarEvent,
  IconSettings,
  IconUser,
  IconMenu2,
} from '@tabler/icons-react'
import { LandingPage } from './pages/LandingPage'
import { BookingPage } from './pages/BookingPage'
import { EventsPage } from './pages/EventsPage'
import { EventTypesPage } from './pages/EventTypesPage'
import { OwnerPage } from './pages/OwnerPage'
import { useNavigate } from 'react-router-dom'
import './index.css'

function App() {
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <AppShell header={{ height: 70 }} padding="md">
      <AppShell.Header style={{ borderBottom: '1px solid #e5e7eb' }}>
        <Group
          h="100%"
          px="md"
          justify="space-between"
          style={{ maxWidth: 1400, margin: '0 auto' }}
        >
          <UnstyledButton
            onClick={() => navigate('/')}
            style={{
              cursor: 'pointer',
            }}
          >
            <Group>
              <IconCalendarEvent size={28} color="#f97316" />
              <Title order={4}>Calendar</Title>
            </Group>
          </UnstyledButton>

          {isMobile ? (
            <Group gap="sm">
              <Button
                color="orange"
                radius="xl"
                onClick={() => navigate('/booking')}
                size="sm"
                styles={{
                  root: {
                    backgroundColor: '#f97316',
                  },
                }}
              >
                Записаться
              </Button>

              <Menu position="bottom-end" withArrow>
                <Menu.Target>
                  <Button variant="subtle" size="sm" leftSection={<IconMenu2 size={18} />}>
                    Ещё
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconCalendarEvent size={16} />}
                    onClick={() => navigate('/events')}
                  >
                    Предстоящие события
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconSettings size={16} />}
                    onClick={() => navigate('/event-types')}
                  >
                    Типы событий
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconUser size={16} />}
                    onClick={() => navigate('/owner')}
                  >
                    Настройки
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          ) : (
            <Group gap="lg">
              {/* Guest Actions */}
              <Button
                color="orange"
                radius="xl"
                onClick={() => navigate('/booking')}
                styles={{
                  root: {
                    backgroundColor: '#f97316',
                  },
                }}
              >
                Записаться
              </Button>

              <Divider orientation="vertical" h={24} />

              {/* Owner/Navigation Actions */}
              <UnstyledButton
                onClick={() => navigate('/events')}
                style={{
                  color: '#9ca3af',
                  fontWeight: 500,
                }}
              >
                Предстоящие события
              </UnstyledButton>

              <UnstyledButton
                onClick={() => navigate('/event-types')}
                style={{
                  color: '#9ca3af',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <IconSettings size={16} />
                Типы событий
              </UnstyledButton>

              <UnstyledButton
                onClick={() => navigate('/owner')}
                style={{
                  color: '#9ca3af',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <IconUser size={16} />
                Настройки
              </UnstyledButton>
            </Group>
          )}
        </Group>
      </AppShell.Header>

      <AppShell.Main
        style={{
          background:
            'linear-gradient(135deg, #dbeafe 0%, #fff 50%, #ffedd5 100%)',
          minHeight: 'calc(100vh - 70px)',
        }}
      >
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/event-types" element={<EventTypesPage />} />
          <Route path="/owner" element={<OwnerPage />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  )
}

export default App
