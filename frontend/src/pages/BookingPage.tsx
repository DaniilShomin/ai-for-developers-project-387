import { useEffect, useState } from 'react'
import {
  Container,
  Title,
  Paper,
  Group,
  Text,
  Button,
  Box,
  Stack,
  Loader,
  Alert,
  TextInput,
  Grid,
  ScrollArea,
  Card,
  Textarea,
  Badge,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { Calendar } from '@mantine/dates'
import {
  IconArrowLeft,
  IconArrowRight,
  IconAlertCircle,
  IconCheck,
  IconClock,
} from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '@/api/client'
import { generateTimeSlots, isSlotAvailable } from '@/utils/timeSlots'
import type {
  BookingWithDetails,
  EventType,
  Owner,
  TimeSlot,
} from '@/types/api'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import 'dayjs/locale/ru'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('ru')

type BookingStep = 'select-event' | 'select-datetime' | 'confirm' | 'success'

export function BookingPage() {
  const navigate = useNavigate()

  // Data states
  const [owner, setOwner] = useState<Owner | null>(null)
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(
    null
  )
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [existingBookings, setExistingBookings] = useState<
    BookingWithDetails[]
  >([])

  // UI states
  const [step, setStep] = useState<BookingStep>('select-event')
  const [isLoading, setIsLoading] = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Mobile responsive
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [mobileDateTimeStep, setMobileDateTimeStep] = useState<'date' | 'time'>('date')

  // Form states
  const [bookerName, setBookerName] = useState('')
  const [bookerEmail, setBookerEmail] = useState('')
  const [bookerPhone, setBookerPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [formErrors, setFormErrors] = useState<{
    name?: string
    email?: string
  }>({})

  // Load owner and event types on mount
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      const ownerData = await apiClient.getOwner()
      setOwner(ownerData)

      const types = await apiClient.getEventTypes(ownerData.id)
      setEventTypes(types)
    } catch (err) {
      setError('Не удалось загрузить данные. Попробуйте позже.')
    } finally {
      setIsLoading(false)
    }
  }

  // Load bookings when date and event type selected
  const loadBookingsForDate = async (date: Date, eventType: EventType) => {
    if (!owner) return

    setSlotsLoading(true)
    try {
      const dateFrom = dayjs(date).startOf('day').toISOString()
      const dateTo = dayjs(date).endOf('day').toISOString()

      const bookings = await apiClient.getBookings(
        owner.id,
        'confirmed',
        dateFrom,
        dateTo
      )
      setExistingBookings(bookings)

      // Generate slots locally
      const slots = generateTimeSlots(eventType, owner, date, bookings)
      setAvailableSlots(slots)
    } catch (err) {
      console.error('Failed to load bookings:', err)
      setAvailableSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }

  const handleEventTypeSelect = (eventType: EventType) => {
    setSelectedEventType(eventType)
    setStep('select-datetime')
    setSelectedDate(null)
    setSelectedSlot(null)
    setAvailableSlots([])
    setMobileDateTimeStep('date')
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedSlot(null)
    if (selectedEventType && owner) {
      loadBookingsForDate(date, selectedEventType)
    }
    if (isMobile) {
      setMobileDateTimeStep('time')
    }
  }

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot)
  }

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('select-datetime')
      if (isMobile) {
        setMobileDateTimeStep('time')
      }
    } else if (step === 'select-datetime') {
      if (isMobile && mobileDateTimeStep === 'time' && selectedDate) {
        setMobileDateTimeStep('date')
        setSelectedDate(null)
        setSelectedSlot(null)
      } else {
        setStep('select-event')
        setSelectedEventType(null)
        setSelectedDate(null)
        setSelectedSlot(null)
        setMobileDateTimeStep('date')
      }
    } else {
      navigate('/')
    }
  }

  const handleContinue = () => {
    if (step === 'select-datetime' && selectedSlot) {
      setStep('confirm')
    }
  }

  const validateForm = () => {
    const errors: { name?: string; email?: string } = {}

    if (!bookerName.trim()) {
      errors.name = 'Введите имя'
    }

    if (!bookerEmail.trim()) {
      errors.email = 'Введите email'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookerEmail)) {
      errors.email = 'Некорректный email'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (
      !validateForm() ||
      !selectedSlot ||
      !selectedEventType ||
      !owner ||
      !selectedDate
    ) {
      return
    }

    // Re-verify slot is still available (pre-booking check)
    const isStillAvailable = isSlotAvailable(
      selectedSlot.startTime,
      selectedEventType.duration,
      existingBookings
    )

    if (!isStillAvailable) {
      setError('Это время уже занято. Пожалуйста, выберите другой слот.')
      // Reload slots
      if (selectedEventType && selectedDate) {
        loadBookingsForDate(selectedDate, selectedEventType)
      }
      setStep('select-datetime')
      setSelectedSlot(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await apiClient.createBooking({
        eventTypeId: selectedEventType.id,
        ownerId: owner.id,
        startTime: selectedSlot.startTime,
        bookerName: bookerName.trim(),
        bookerEmail: bookerEmail.trim(),
        bookerPhone: bookerPhone.trim() || undefined,
        notes: notes.trim() || undefined,
      })

      setStep('success')
      setBookerName('')
      setBookerEmail('')
      setBookerPhone('')
      setNotes('')
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Не удалось создать запись'
      // Check for conflict error
      if (errorMessage.includes('409') || errorMessage.includes('conflict')) {
        setError('Это время уже занято. Пожалуйста, выберите другой слот.')
        // Reload slots
        if (selectedEventType && selectedDate) {
          loadBookingsForDate(selectedDate, selectedEventType)
        }
        setStep('select-datetime')
        setSelectedSlot(null)
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

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

  const formatSelectedDate = (date: Date | null) => {
    if (!date) return 'Дата не выбрана'
    return dayjs(date).format('dddd, D MMMM')
  }

  const formatSelectedTime = (slot: TimeSlot | null) => {
    if (!slot) return 'Время не выбрано'
    return `${dayjs(slot.startTime).format('HH:mm')} - ${dayjs(
      slot.endTime
    ).format('HH:mm')}`
  }

  // ==================== Success View ====================
  if (step === 'success') {
    return (
      <Container size="xl" py={40}>
        <Paper
          p="xl"
          radius="md"
          withBorder
          style={{
            borderColor: '#e5e7eb',
            background: '#fff',
            maxWidth: 500,
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <Box mb="lg">
            <IconCheck
              size={64}
              color="#22c55e"
              style={{ margin: '0 auto' }}
            />
          </Box>
          <Title order={2} mb="md" style={{ fontWeight: 700 }}>
            Запись подтверждена!
          </Title>
          <Text c="dimmed" mb="xl">
            Мы отправили подтверждение на ваш email. Ждём вас в назначенное
            время.
          </Text>
          <Group justify="center">
            <Button
              color="orange"
              onClick={() => navigate('/events')}
              radius="md"
              styles={{
                root: {
                  backgroundColor: '#f97316',
                },
              }}
            >
              Мои записи
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setStep('select-event')
                setSelectedEventType(null)
                setSelectedDate(null)
                setSelectedSlot(null)
              }}
              radius="md"
              styles={{
                root: {
                  borderColor: '#e5e7eb',
                  color: '#374151',
                },
              }}
            >
              Новая запись
            </Button>
          </Group>
        </Paper>
      </Container>
    )
  }

  // ==================== Loading State ====================
  if (isLoading && step === 'select-event') {
    return (
      <Container size="xl" py={40}>
        <Box style={{ textAlign: 'center', paddingTop: 100 }}>
          <Loader size="lg" />
          <Text c="dimmed" mt="md">
            Загрузка...
          </Text>
        </Box>
      </Container>
    )
  }

  // ==================== Select Event Type View ====================
  if (step === 'select-event') {
    return (
      <Container size="xl" py={40}>
        <Title order={2} mb="xl" style={{ fontWeight: 700 }}>
          Выберите тип встречи
        </Title>

        {eventTypes.length === 0 ? (
          <Paper
            p="xl"
            radius="md"
            withBorder
            style={{ textAlign: 'center' }}
          >
            <IconClock size={48} color="#adb5bd" style={{ margin: '0 auto' }} />
            <Text c="dimmed" mt="md">
              Пока нет доступных типов встреч.
              <br />
              Пожалуйста, обратитесь к администратору.
            </Text>
            <Button onClick={() => navigate('/')} mt="lg" variant="outline">
              На главную
            </Button>
          </Paper>
        ) : (
          <Grid gutter="lg">
            {eventTypes.map(eventType => (
              <Grid.Col key={eventType.id} span={{ base: 12, sm: 6, md: 4 }}>
                <Card
                  withBorder
                  padding="lg"
                  radius="md"
                  style={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onClick={() => handleEventTypeSelect(eventType)}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow =
                      '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <Stack gap="sm">
                    <Text fw={600} size="lg">
                      {eventType.title}
                    </Text>
                    {eventType.description && (
                      <Text size="sm" c="dimmed" lineClamp={2}>
                        {eventType.description}
                      </Text>
                    )}
                    <Group gap="xs" mt="xs">
                      <IconClock size={16} color="#f97316" />
                      <Text size="sm" fw={500}>
                        {formatDuration(eventType.duration)}
                      </Text>
                    </Group>
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        )}

        <Group justify="center" mt="xl">
          <Button
            variant="outline"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate('/')}
            radius="md"
          >
            Назад
          </Button>
        </Group>
      </Container>
    )
  }

  // ==================== Select Date & Time View ====================
  if (step === 'select-datetime') {
    // Mobile wizard mode
    if (isMobile) {
      return (
        <Container size="xl" py={{ base: 'md', md: 'xl' }}>
          {/* Mobile Header with mini info */}
          <Box mb="md">
            <Group gap="xs" mb="xs">
              <Badge color="orange" variant="light">
                {selectedEventType?.title}
              </Badge>
              <Text size="sm" c="dimmed">
                {selectedEventType && formatDuration(selectedEventType.duration)}
              </Text>
            </Group>
            <Title order={3} style={{ fontWeight: 700 }}>
              {mobileDateTimeStep === 'date' ? 'Выберите дату' : 'Выберите время'}
            </Title>
          </Box>

          {/* Step 1: Date Selection */}
          {mobileDateTimeStep === 'date' && (
            <Stack gap="md">
              <Paper
                p="md"
                radius="md"
                withBorder
                style={{
                  borderColor: '#e5e7eb',
                  background: '#fff',
                }}
              >
                <Calendar
                  locale="ru"
                  date={currentMonth}
                  onDateChange={setCurrentMonth}
                  minDate={new Date()}
                  className="custom-calendar"
                  getDayProps={date => ({
                    selected: selectedDate
                      ? dayjs(date).isSame(selectedDate, 'date')
                      : false,
                    onClick: () => handleDateSelect(new Date(date)),
                  })}
                />
              </Paper>

              <Button
                variant="outline"
                fullWidth
                leftSection={<IconArrowLeft size={16} />}
                onClick={handleBack}
                radius="md"
              >
                Изменить тип встречи
              </Button>
            </Stack>
          )}

          {/* Step 2: Time Selection */}
          {mobileDateTimeStep === 'time' && selectedDate && (
            <Stack gap="md">
              <Paper
                p="md"
                radius="md"
                withBorder
                style={{
                  borderColor: '#e5e7eb',
                  background: '#fff',
                }}
              >
                <Stack gap="md">
                  <Group justify="space-between">
                    <Text fw={600}>Выбранная дата</Text>
                    <Text>{formatSelectedDate(selectedDate)}</Text>
                  </Group>

                  <Box>
                    <Text fw={600} mb="sm">Доступное время</Text>

                    {slotsLoading && (
                      <Box py="xl" style={{ textAlign: 'center' }}>
                        <Loader size="sm" />
                        <Text size="sm" c="dimmed" mt="xs">
                          Загрузка слотов...
                        </Text>
                      </Box>
                    )}

                    {!slotsLoading && availableSlots.length === 0 && (
                      <Box py="xl" style={{ textAlign: 'center' }}>
                        <Text c="dimmed">
                          Нет доступных слотов на эту дату
                          <br />
                          <Text size="sm" mt="xs">
                            Все время занято или вне рабочих часов
                          </Text>
                        </Text>
                      </Box>
                    )}

                    {!slotsLoading && availableSlots.length > 0 && (
                      <ScrollArea h={300}>
                        <Stack gap="xs">
                          {availableSlots.map(slot => {
                            const isSelected = selectedSlot?.id === slot.id

                            return (
                              <Button
                                key={slot.id}
                                variant={isSelected ? 'filled' : 'default'}
                                color={isSelected ? 'orange' : undefined}
                                fullWidth
                                justify="space-between"
                                onClick={() => handleSlotSelect(slot)}
                                styles={{
                                  root: {
                                    border: isSelected
                                      ? 'none'
                                      : '1px solid #e5e7eb',
                                    backgroundColor: isSelected
                                      ? '#f97316'
                                      : '#fff',
                                    color: isSelected ? '#fff' : '#000',
                                    height: '50px',
                                    borderRadius: '8px',
                                  },
                                  label: {
                                    width: '100%',
                                  },
                                }}
                              >
                                <Group justify="space-between" w="100%" wrap="nowrap">
                                  <span>
                                    {dayjs(slot.startTime).format('HH:mm')} -{' '}
                                    {dayjs(slot.endTime).format('HH:mm')}
                                  </span>
                                  <span
                                    style={{
                                      color: isSelected
                                        ? 'rgba(255,255,255,0.8)'
                                        : '#22c55e',
                                      fontSize: '14px',
                                    }}
                                  >
                                    Свободно
                                  </span>
                                </Group>
                              </Button>
                            )
                          })}
                        </Stack>
                      </ScrollArea>
                    )}
                  </Box>
                </Stack>
              </Paper>

              {/* Mobile Navigation Buttons */}
              <Group grow>
                <Button
                  variant="outline"
                  leftSection={<IconArrowLeft size={16} />}
                  onClick={() => setMobileDateTimeStep('date')}
                  radius="md"
                >
                  Изменить дату
                </Button>
                <Button
                  color="orange"
                  rightSection={<IconArrowRight size={16} />}
                  onClick={handleContinue}
                  disabled={!selectedSlot}
                  radius="md"
                  styles={{
                    root: {
                      backgroundColor: '#f97316',
                    },
                  }}
                >
                  Продолжить
                </Button>
              </Group>
            </Stack>
          )}
        </Container>
      )
    }

    // Desktop 3-panel layout
    return (
      <Container size="xl" py={40}>
        <Title order={2} mb="xl" style={{ fontWeight: 700 }}>
          Запись: {selectedEventType?.title}
        </Title>

        <Box
          h="min(460px, 90vh)"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '24px',
          }}
          className="booking-grid"
        >
          {/* Left Panel - Information */}
          <Paper
            p="lg"
            radius="md"
            withBorder
            h="100%"
            style={{
              borderColor: '#e5e7eb',
              background: '#fff',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
              <Text fw={600} size="lg" mb="lg">
                Информация
              </Text>

              <Stack gap="md">
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>
                    Тип встречи
                  </Text>
                  <Text fw={500} size="md">
                    {selectedEventType?.title}
                  </Text>
                </Box>

                <Box>
                  <Text size="sm" c="dimmed" mb={4}>
                    Длительность
                  </Text>
                  <Text fw={500} size="md">
                    {selectedEventType &&
                      formatDuration(selectedEventType.duration)}
                  </Text>
                </Box>

                <Box>
                  <Text size="sm" c="dimmed" mb={4}>
                    Выбранная дата
                  </Text>
                  <Text fw={500} size="md">
                    {formatSelectedDate(selectedDate)}
                  </Text>
                </Box>

                <Box>
                  <Text size="sm" c="dimmed" mb={4}>
                    Выбранное время
                  </Text>
                  <Text fw={500} size="md">
                    {formatSelectedTime(selectedSlot)}
                  </Text>
                </Box>

                {selectedDate && (
                  <Box>
                    <Text size="sm" c="dimmed" mb={4}>
                      Доступно слотов
                    </Text>
                    <Text fw={500} size="md">
                      {availableSlots.length}
                    </Text>
                  </Box>
                )}
              </Stack>

              <Button
                variant="outline"
                fullWidth
                mt="xl"
                leftSection={<IconArrowLeft size={16} />}
                onClick={handleBack}
                radius="md"
              >
                Изменить тип встречи
              </Button>
            </Paper>

            {/* Center - Calendar */}
            <Paper
              p="lg"
              radius="md"
              withBorder
              h="100%"
              style={{
                borderColor: '#e5e7eb',
                background: '#fff',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Text fw={600} size="lg" mb="md">
                Выберите дату
              </Text>

              <Calendar
                locale="ru"
                date={currentMonth}
                onDateChange={setCurrentMonth}
                minDate={new Date()}
                className="custom-calendar"
                getDayProps={date => ({
                  selected: selectedDate
                    ? dayjs(date).isSame(selectedDate, 'date')
                    : false,
                  onClick: () => handleDateSelect(new Date(date)),
                })}
              />
            </Paper>

            {/* Right - Time Slots */}
            <Paper
              p="lg"
              radius="md"
              withBorder
              h="100%"
              style={{
                borderColor: '#e5e7eb',
                background: '#fff',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Stack h="100%" justify="space-between" gap="sm" style={{ flex: 1 }}>
                  <Text fw={600} size="lg">
                    Доступное время
                  </Text>

                  <Box style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                    {!selectedDate && (
                      <Text c="dimmed">
                        Сначала выберите дату в календаре.
                      </Text>
                    )}

                    {selectedDate && slotsLoading && (
                      <Box py="xl" style={{ textAlign: 'center' }}>
                        <Loader size="sm" />
                        <Text size="sm" c="dimmed" mt="xs">
                          Загрузка слотов...
                        </Text>
                      </Box>
                    )}

                    {selectedDate && !slotsLoading && availableSlots.length === 0 && (
                      <Box py="xl" style={{ textAlign: 'center' }}>
                        <Text c="dimmed">
                          Нет доступных слотов на эту дату
                          <br />
                          <Text size="sm" mt="xs">
                            Все время занято или вне рабочих часов
                          </Text>
                        </Text>
                      </Box>
                    )}

                    {selectedDate && !slotsLoading && availableSlots.length > 0 && (
                      <ScrollArea h="100%">
                        <Stack gap="xs">
                          {availableSlots.map(slot => {
                            const isSelected =
                              selectedSlot?.id === slot.id

                            return (
                              <Button
                                key={slot.id}
                                variant={isSelected ? 'filled' : 'default'}
                                color={isSelected ? 'orange' : undefined}
                                fullWidth
                                justify="space-between"
                                onClick={() => handleSlotSelect(slot)}
                                styles={{
                                  root: {
                                    border: isSelected
                                      ? 'none'
                                      : '1px solid #e5e7eb',
                                    backgroundColor: isSelected
                                      ? '#f97316'
                                      : '#fff',
                                    color: isSelected ? '#fff' : '#000',
                                    height: '46px',
                                    borderRadius: '8px',
                                  },
                                  label: {
                                    width: '100%',
                                  },
                                }}
                              >
                                <Group justify="space-between" w="100%" wrap="nowrap">
                                  <span>
                                    {dayjs(slot.startTime).format('HH:mm')} -{' '}
                                    {dayjs(slot.endTime).format('HH:mm')}
                                  </span>
                                  <span
                                    style={{
                                      color: isSelected
                                        ? 'rgba(255,255,255,0.8)'
                                        : '#22c55e',
                                      fontSize: '14px',
                                    }}
                                  >
                                    Свободно
                                  </span>
                                </Group>
                              </Button>
                            )
                          })}
                        </Stack>
                      </ScrollArea>
                    )}
                  </Box>

                  {selectedDate && !slotsLoading && availableSlots.length > 0 && (
                    <Group justify="space-between">
                      <Button
                        variant="outline"
                        leftSection={<IconArrowLeft size={16} />}
                        onClick={handleBack}
                        radius="md"
                      >
                        Назад
                      </Button>
                      <Button
                        color="orange"
                        rightSection={<IconArrowRight size={16} />}
                        onClick={handleContinue}
                        disabled={!selectedSlot}
                        radius="md"
                        styles={{
                          root: {
                            backgroundColor: '#f97316',
                          },
                        }}
                      >
                        Продолжить
                      </Button>
                    </Group>
                  )}
                </Stack>
              </Paper>
            </Box>
      </Container>
    )
  }

  // ==================== Confirmation Form View ====================
  if (step === 'confirm') {
    return (
      <Container size="xl" py={40}>
        <Title order={2} mb="xl" style={{ fontWeight: 700 }}>
          Подтверждение записи
        </Title>

        <Grid gutter="xl">
          {/* Left Panel - Information */}
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Paper
              p="lg"
              radius="md"
              withBorder
              style={{ borderColor: '#e5e7eb', background: '#fff' }}
            >
              <Text fw={600} size="lg" mb="lg">
                Детали встречи
              </Text>

              <Stack gap="md">
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>
                    Тип встречи
                  </Text>
                  <Text fw={500} size="md">
                    {selectedEventType?.title}
                  </Text>
                </Box>

                <Box>
                  <Text size="sm" c="dimmed" mb={4}>
                    Длительность
                  </Text>
                  <Text fw={500} size="md">
                    {selectedEventType &&
                      formatDuration(selectedEventType.duration)}
                  </Text>
                </Box>

                <Box>
                  <Text size="sm" c="dimmed" mb={4}>
                    Дата и время
                  </Text>
                  <Text fw={500} size="md">
                    {formatSelectedDate(selectedDate)},{' '}
                    {formatSelectedTime(selectedSlot)}
                  </Text>
                </Box>
              </Stack>

              <Button
                variant="outline"
                fullWidth
                mt="xl"
                leftSection={<IconArrowLeft size={16} />}
                onClick={handleBack}
                radius="md"
              >
                Изменить дату и время
              </Button>
            </Paper>
          </Grid.Col>

          {/* Right Panel - Form */}
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Paper
              p="lg"
              radius="md"
              withBorder
              style={{ borderColor: '#e5e7eb', background: '#fff' }}
            >
              <Text fw={600} size="lg" mb="lg">
                Ваши данные
              </Text>

              <Stack gap="md">
                <TextInput
                  label="Имя"
                  placeholder="Введите ваше имя"
                  value={bookerName}
                  onChange={e => setBookerName(e.target.value)}
                  error={formErrors.name}
                  radius="md"
                  required
                />

                <TextInput
                  label="Email"
                  placeholder="your@email.com"
                  value={bookerEmail}
                  onChange={e => setBookerEmail(e.target.value)}
                  error={formErrors.email}
                  radius="md"
                  required
                />

                <TextInput
                  label="Телефон"
                  placeholder="+7 (999) 123-45-67"
                  value={bookerPhone}
                  onChange={e => setBookerPhone(e.target.value)}
                  radius="md"
                />

                <Textarea
                  label="Заметки"
                  placeholder="Дополнительная информация (необязательно)"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  minRows={3}
                  radius="md"
                />

                {error && (
                  <Alert color="red" icon={<IconAlertCircle size={16} />}>
                    {error}
                  </Alert>
                )}

                <Button
                  color="orange"
                  fullWidth
                  onClick={handleSubmit}
                  disabled={isLoading}
                  radius="md"
                  size="md"
                  mt="sm"
                  styles={{
                    root: {
                      backgroundColor: '#f97316',
                    },
                  }}
                >
                  {isLoading ? (
                    <Loader size="sm" color="white" />
                  ) : (
                    'Подтвердить запись'
                  )}
                </Button>
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>
    )
  }

  return null
}
