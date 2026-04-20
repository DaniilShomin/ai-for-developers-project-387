import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  Container,
  Group,
  LoadingOverlay,
  NativeSelect,
  Select,
  Stack,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconUser, IconClock } from '@tabler/icons-react'
import { apiClient } from '@/api/client'
import type { Owner } from '@/types/api'

// Generate time options with 15-minute step
const generateTimeOptions = () => {
  const options: string[] = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const h = hour.toString().padStart(2, '0')
      const m = minute.toString().padStart(2, '0')
      options.push(`${h}:${m}`)
    }
  }
  return options
}

const TIME_OPTIONS = generateTimeOptions()

const TIMEZONE_OPTIONS = [
  { value: 'Europe/Moscow', label: 'Europe/Moscow (Москва)' },
  { value: 'Europe/London', label: 'Europe/London (Лондон)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'America/New_York (Нью-Йорк)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (Токио)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (Дубай)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (Сидней)' },
]

interface FormValues {
  name: string
  email: string
  timezone: string
  workStart: string
  workEnd: string
}

export function OwnerPage() {
  const [owner, setOwner] = useState<Owner | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<FormValues>({
    initialValues: {
      name: '',
      email: '',
      timezone: 'Europe/Moscow',
      workStart: '09:00',
      workEnd: '18:00',
    },
    validate: {
      name: value => (value.trim().length > 0 ? null : 'Имя обязательно'),
      email: value => {
        if (!value.trim()) {
          return 'Email обязателен'
        }
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          return 'Введите корректный email'
        }
        return null
      },
    },
  })

  useEffect(() => {
    loadOwner()
  }, [])

  const loadOwner = async () => {
    try {
      setIsLoading(true)
      const ownerData = await apiClient.getOwner()
      setOwner(ownerData)

      // Populate form with owner data
      form.setValues({
        name: ownerData.name,
        email: ownerData.email,
        timezone: ownerData.timezone,
        workStart: ownerData.workStart,
        workEnd: ownerData.workEnd,
      })
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось загрузить данные владельца',
        color: 'red',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (values: FormValues) => {
    if (!owner) return

    try {
      setIsSaving(true)
      await apiClient.updateOwner({
        name: values.name,
        email: values.email,
        timezone: values.timezone,
        workStart: values.workStart,
        workEnd: values.workEnd,
      })

      notifications.show({
        title: 'Успешно',
        message: 'Настройки сохранены',
        color: 'green',
      })

      // Refresh owner data
      const updatedOwner = await apiClient.getOwner()
      setOwner(updatedOwner)
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось сохранить настройки',
        color: 'red',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Container size="md" py="xl">
      <LoadingOverlay visible={isLoading} />

      <Box mb="xl">
        <Title order={2}>Настройки профиля</Title>
        <Box component="span" c="dimmed" size="sm">
          Управление данными владельца и рабочим временем
        </Box>
      </Box>

      <Card withBorder p="xl">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="lg">
            {/* Profile Section */}
            <Box>
              <Group gap="xs" mb="md">
                <IconUser size={20} color="#f97316" />
                <Title order={4}>Личные данные</Title>
              </Group>

              <Stack gap="md">
                <TextInput
                  label="Имя"
                  placeholder="Введите ваше имя"
                  {...form.getInputProps('name')}
                  required
                />

                <TextInput
                  label="Email"
                  placeholder="email@example.com"
                  {...form.getInputProps('email')}
                  required
                />

                <NativeSelect
                  label="Часовой пояс"
                  description="Выберите ваш часовой пояс"
                  data={TIMEZONE_OPTIONS}
                  {...form.getInputProps('timezone')}
                />
              </Stack>
            </Box>

            {/* Working Hours Section */}
            <Box mt="md">
              <Group gap="xs" mb="md">
                <IconClock size={20} color="#f97316" />
                <Title order={4}>Рабочее время</Title>
              </Group>

              <Group grow>
                <Select
                  label="Начало работы"
                  placeholder="09:00"
                  data={TIME_OPTIONS}
                  {...form.getInputProps('workStart')}
                  searchable
                />

                <Select
                  label="Окончание работы"
                  placeholder="18:00"
                  data={TIME_OPTIONS}
                  {...form.getInputProps('workEnd')}
                  searchable
                />
              </Group>
            </Box>

            {/* Submit Button */}
            <Group justify="flex-end" mt="xl">
              <Button type="submit" loading={isSaving} color="orange">
                Сохранить изменения
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>
    </Container>
  )
}
