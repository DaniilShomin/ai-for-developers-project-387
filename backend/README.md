# Booking API

API для записи на звонок. Упрощенный сервис бронирования времени.

## Установка

```bash
cd backend
pip install -r requirements.txt
```

## Запуск

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

API доступно по адресу: http://localhost:8000/api/v1
Документация Swagger: http://localhost:8000/docs

## Эндпоинты

### Time Slots
- `GET /api/v1/timeslots?ownerId={id}` - Список временных слотов
- `POST /api/v1/timeslots` - Создать слот (30 минут)
- `DELETE /api/v1/timeslots/{id}` - Удалить слот

### Bookings
- `GET /api/v1/bookings` - Список бронирований
- `POST /api/v1/bookings` - Создать бронирование
- `GET /api/v1/bookings/{id}` - Детали бронирования
- `DELETE /api/v1/bookings/{id}` - Отменить бронирование

## Модели

### TimeSlot
- `id`, `owner_id`, `start_time`, `end_time` (start + 30 мин), `is_booked`, `created_at`

### Booker
- `id`, `name`, `email`, `phone`, `created_at`

### Booking
- `id`, `time_slot_id`, `booker_id`, `notes`, `status` (confirmed/cancelled), `created_at`
