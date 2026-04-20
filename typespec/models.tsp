import "@typespec/http";

using TypeSpec.Http;

@doc("Owner - Владелец календаря")
model Owner {
  @doc("Уникальный идентификатор")
  id: string;

  @doc("Имя владельца")
  name: string;

  @doc("Email владельца")
  email: string;

  @doc("Часовой пояс")
  timezone: string;

  @doc("Дата создания")
  createdAt: utcDateTime;
}

@doc("Booker - Пользователь, записывающийся на встречу")
model Booker {
  @doc("Уникальный идентификатор")
  id: string;

  @doc("Имя")
  name: string;

  @doc("Email для связи")
  email: string;

  @doc("Телефон (опционально)")
  phone?: string;

  @doc("Дата создания")
  createdAt: utcDateTime;
}

@doc("EventType - Тип события/бронирования. Владелец создаёт типы с названием, описанием и длительностью.")
model EventType {
  @doc("Уникальный идентификатор")
  id: string;

  @doc("Название типа события")
  title: string;

  @doc("Описание")
  description?: string;

  @doc("Длительность в минутах")
  duration: int32;

  @doc("ID владельца")
  ownerId: string;

  @doc("Дата создания")
  createdAt: utcDateTime;
}

@doc("Данные для создания типа события")
model EventTypeCreate {
  @doc("Название типа события")
  title: string;

  @doc("Описание")
  description?: string;

  @doc("Длительность в минутах")
  duration: int32;

  @doc("ID владельца")
  ownerId: string;
}

@doc("Данные для обновления типа события")
model EventTypeUpdate {
  @doc("Название типа события")
  title?: string;

  @doc("Описание")
  description?: string;

  @doc("Длительность в минутах")
  duration?: int32;
}

@doc("TimeSlot - Свободный временной слот для бронирования. Слоты генерируются автоматически на 14 дней вперёд.")
model TimeSlot {
  @doc("Уникальный идентификатор (генерируется на лету)")
  id: string;

  @doc("ID владельца")
  ownerId: string;

  @doc("Время начала слота")
  startTime: utcDateTime;

  @doc("Время окончания (startTime + duration типа события)")
  endTime: utcDateTime;

  @doc("ID типа события, если слот занят")
  eventTypeId?: string;

  @doc("Забронирован ли слот")
  isBooked: boolean;
}

@doc("Статус бронирования")
enum BookingStatus {
  confirmed,
  cancelled,
}

@doc("Booking - Бронирование временного слота")
model Booking {
  @doc("Уникальный идентификатор")
  id: string;

  @doc("ID типа события")
  eventTypeId: string;

  @doc("ID владельца")
  ownerId: string;

  @doc("ID записывающегося")
  bookerId: string;

  @doc("Время начала")
  startTime: utcDateTime;

  @doc("Время окончания")
  endTime: utcDateTime;

  @doc("Заметки к встрече")
  notes?: string;

  @doc("Статус бронирования")
  status: BookingStatus;

  @doc("Дата создания")
  createdAt: utcDateTime;
}

@doc("Данные для создания бронирования")
model BookingCreate {
  @doc("ID типа события")
  eventTypeId: string;

  @doc("ID владельца календаря")
  ownerId: string;

  @doc("Время начала бронирования (должно быть в окне 14 дней)")
  startTime: utcDateTime;

  @doc("Имя записывающегося")
  bookerName: string;

  @doc("Email записывающегося")
  bookerEmail: string;

  @doc("Телефон (опционально)")
  bookerPhone?: string;

  @doc("Заметки")
  notes?: string;
}

@doc("Бронирование с полными деталями")
model BookingWithDetails {
  @doc("Уникальный идентификатор")
  id: string;

  @doc("ID типа события")
  eventTypeId: string;

  @doc("ID владельца")
  ownerId: string;

  @doc("ID записывающегося")
  bookerId: string;

  @doc("Время начала")
  startTime: utcDateTime;

  @doc("Время окончания")
  endTime: utcDateTime;

  @doc("Заметки")
  notes?: string;

  @doc("Статус")
  status: BookingStatus;

  @doc("Дата создания")
  createdAt: utcDateTime;

  @doc("Данные типа события")
  eventType: EventType;

  @doc("Данные записывающегося")
  booker: Booker;
}

@doc("Стандартная модель ошибки")
model ErrorResponse {
  @doc("Код ошибки")
  code: string;

  @doc("Сообщение об ошибке")
  message: string;
}
