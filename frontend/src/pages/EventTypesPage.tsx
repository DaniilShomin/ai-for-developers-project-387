import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Group,
  LoadingOverlay,
  Modal,
  ScrollArea,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
  NumberInput,
  ActionIcon,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { notifications } from '@mantine/notifications'
import {
  IconEdit,
  IconTrash,
  IconPlus,
  IconClock,
} from '@tabler/icons-react'
import { apiClient } from '@/api/client'
import type { EventType, Owner } from '@/types/api'

interface EventTypeFormData {
  title: string
  description: string
  duration: number
}

export function EventTypesPage() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [owner, setOwner] = useState<Owner | null>(null)
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEventType, setEditingEventType] = useState<EventType | null>(
    null
  )
  const [formData, setFormData] = useState<EventTypeFormData>({
    title: '',
    description: '',
    duration: 30,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      // Get default owner first
      const ownerData = await apiClient.getOwner()
      setOwner(ownerData)

      // Get event types for this owner
      const types = await apiClient.getEventTypes(ownerData.id)
      setEventTypes(types)
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось загрузить данные',
        color: 'red',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingEventType(null)
    setFormData({ title: '', description: '', duration: 30 })
    setIsModalOpen(true)
  }

  const handleEdit = (eventType: EventType) => {
    setEditingEventType(eventType)
    setFormData({
      title: eventType.title,
      description: eventType.description || '',
      duration: eventType.duration,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (eventType: EventType) => {
    if (!confirm(`Удалить тип события "${eventType.title}"?`)) {
      return
    }

    try {
      await apiClient.deleteEventType(eventType.id)
      notifications.show({
        title: 'Успешно',
        message: 'Тип события удалён',
        color: 'green',
      })
      loadData()
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось удалить тип события',
        color: 'red',
      })
    }
  }

  const handleSubmit = async () => {
    if (!owner) return

    if (!formData.title.trim()) {
      notifications.show({
        title: 'Ошибка',
        message: 'Название обязательно',
        color: 'red',
      })
      return
    }

    if (formData.duration < 15) {
      notifications.show({
        title: 'Ошибка',
        message: 'Минимальная длительность - 15 минут',
        color: 'red',
      })
      return
    }

    try {
      if (editingEventType) {
        await apiClient.updateEventType(editingEventType.id, {
          title: formData.title,
          description: formData.description || undefined,
          duration: formData.duration,
        })
        notifications.show({
          title: 'Успешно',
          message: 'Тип события обновлён',
          color: 'green',
        })
      } else {
        await apiClient.createEventType({
          title: formData.title,
          description: formData.description || undefined,
          duration: formData.duration,
          ownerId: owner.id,
        })
        notifications.show({
          title: 'Успешно',
          message: 'Тип события создан',
          color: 'green',
        })
      }

      setIsModalOpen(false)
      loadData()
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось сохранить тип события',
        color: 'red',
      })
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

  return (
    <Container size="lg" py="xl">
      <LoadingOverlay visible={isLoading} />

      <Flex justify="space-between" align="center" mb="xl">
        <Box>
          <Title order={2}>Типы событий</Title>
          <Text c="dimmed" size="sm">
            Управление типами встреч и их длительностью
          </Text>
        </Box>
        <Button leftSection={<IconPlus size={16} />} onClick={handleCreate}>
          Создать тип
        </Button>
      </Flex>

      {eventTypes.length === 0 && !isLoading ? (
        <Card withBorder p="xl">
          <Stack align="center" gap="md">
            <IconClock size={48} color="#adb5bd" />
            <Text c="dimmed" ta="center">
              Пока нет созданных типов событий.
              <br />
              Создайте первый тип, чтобы гости могли записываться на встречи.
            </Text>
            <Button onClick={handleCreate}>Создать первый тип</Button>
          </Stack>
        </Card>
      ) : (
        <ScrollArea>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Название</Table.Th>
                <Table.Th>Описание</Table.Th>
                <Table.Th>Длительность</Table.Th>
                <Table.Th style={{ width: 100 }}>Действия</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {eventTypes.map(eventType => (
                <Table.Tr key={eventType.id}>
                  <Table.Td>
                    <Text fw={500}>{eventType.title}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed" lineClamp={2}>
                      {eventType.description || '—'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text>{formatDuration(eventType.duration)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={() => handleEdit(eventType)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleDelete(eventType)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}

      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEventType ? 'Редактировать тип' : 'Создать тип события'}
        size="md"
        fullScreen={isMobile}
      >
        <Stack gap="md">
          <TextInput
            label="Название"
            placeholder="Например: Консультация"
            value={formData.title}
            onChange={e =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
          />

          <Textarea
            label="Описание"
            placeholder="Опишите, что включает этот тип встречи"
            value={formData.description}
            onChange={e =>
              setFormData({ ...formData, description: e.target.value })
            }
            minRows={3}
          />

          <NumberInput
            label="Длительность (минуты)"
            description="Минимум 15 минут"
            value={formData.duration}
            onChange={value =>
              setFormData({ ...formData, duration: Number(value) || 30 })
            }
            min={15}
            step={15}
            required
          />

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={() => setIsModalOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSubmit}>
              {editingEventType ? 'Сохранить' : 'Создать'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  )
}
