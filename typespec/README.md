# Booking API - TypeSpec Specification

TypeSpec спецификация для API "Запись на звонок" (Cal.com inspired).

## 📁 Структура

```
typespec/
├── package.json          # Зависимости
├── tspconfig.yaml        # Конфигурация
├── main.tsp             # API endpoints
├── models.tsp           # Модели данных
├── README.md            # Этот файл
└── ../openapi/          # Сгенерированная спецификация
    └── openapi.yaml
```

## 🚀 Быстрый старт

```bash
cd typespec
npm install
npx tsp compile .
```

## 📊 Модели

### Owner
- `id`, `name`, `email`, `timezone`, `createdAt`

### Booker  
- `id`, `name`, `email`, `phone?`, `createdAt`

### TimeSlot
- `id`, `ownerId`, `startTime`, `endTime`, `isBooked`, `createdAt`

### Booking
- `id`, `timeSlotId`, `bookerId`, `notes?`, `status`, `createdAt`

## 🔌 Endpoints

### TimeSlots
- `GET /timeslots?ownerId={id}` - список слотов
- `POST /timeslots` - создать слот
- `DELETE /timeslots/{id}` - удалить слот

### Bookings
- `GET /bookings` - список бронирований
- `GET /bookings/{id}` - детали бронирования
- `POST /bookings` - создать бронирование
- `DELETE /bookings/{id}` - отменить бронирование

## 📝 Генерация TypeScript типов

```bash
npx openapi-typescript ./openapi/openapi.yaml -o ../frontend/src/types/api.ts
```
