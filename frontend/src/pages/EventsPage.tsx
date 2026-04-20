import { useState, useEffect } from 'react'
import {
  Container,
  Title,
  Paper,
  Group,
  Text,
  Loader,
  Alert,
  Stack,
  Badge,
  Box,
} from '@mantine/core'
import { IconAlertCircle, IconCalendar, IconClock } from '@tabler/icons-react'
import { apiClient } from '@/api/client'
import type { BookingWithDetails } from '@/types/api'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import 'dayjs/locale/ru'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('ru')

export function EventsPage() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get owner first
        const ownerData = await apiClient.getOwner()

        // Get all confirmed bookings
        const data = await apiClient.getBookings(ownerData.id, 'confirmed')
        setBookings(data)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Не удалось загрузить бронирования'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} мин`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) {
      return `${hours} ч`
    }
    return `${hours} ч ${mins} мин`
  }

  return (
    <Container size="xl" py={40}>
      <Title order={2} mb="xl">
        Предстоящие события
      </Title>

      {loading && (
        <Group justify="center" py="xl">
          <Loader />
        </Group>
      )}

      {error && (
        <Alert color="red" icon={<IconAlertCircle size={16} />} mb="md">
          {error}
        </Alert>
      )}

      {!loading && !error && bookings.length === 0 && (
        <Paper p="xl" radius="md" withBorder ta="center">
          <Text c="dimmed">Нет предстоящих событий</Text>
        </Paper>
      )}

      <Stack gap="md">
        {bookings.map(booking => (
          <Paper key={booking.id} p={{ base: 'md', md: 'lg' }} radius="md" withBorder>
            <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
              <Stack gap="xs" style={{ flex: 1 }}>
                {/* Event Type */}
                <Text fw={600} size="lg" c="orange">
                  {booking.eventType.title}
                </Text>

                {/* Booker Info */}
                <Box>
                  <Text fw={500}>{booking.booker.name}</Text>
                  <Text size="sm" c="dimmed">
                    {booking.booker.email}
                  </Text>
                  {booking.booker.phone && (
                    <Text size="sm" c="dimmed">
                      {booking.booker.phone}
                    </Text>
                  )}
                </Box>

                {/* Date & Time */}
                <Group gap="xs" mt={4}>
                  <IconCalendar size={16} color="#6b7280" />
                  <Text size="sm" c="dimmed">
                    {dayjs(booking.startTime).format('D MMMM YYYY')}
                  </Text>
                </Group>

                <Group gap="xs">
                  <IconClock size={16} color="#6b7280" />
                  <Text size="sm" c="dimmed">
                    {dayjs(booking.startTime).format('HH:mm')} -{' '}
                    {dayjs(booking.endTime).format('HH:mm')}
                    <Text span size="sm" c="gray" ml={4}>
                      ({formatDuration(booking.eventType.duration)})
                    </Text>
                  </Text>
                </Group>

                {booking.notes && (
                  <Text size="sm" c="dimmed" mt={4}>
                    Заметки: {booking.notes}
                  </Text>
                )}

                <Text size="sm" c="dimmed" mt={4}>
                  Создано:{' '}
                  {dayjs(booking.createdAt).format('DD.MM.YYYY, HH:mm')}
                </Text>
              </Stack>
              <Badge color="green" variant="light">
                Подтверждено
              </Badge>
            </Group>
          </Paper>
        ))}
      </Stack>
    </Container>
  )
}
