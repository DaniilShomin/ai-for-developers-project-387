import "@typespec/http";
import "@typespec/rest";
import "./models.tsp";

using TypeSpec.Http;
using TypeSpec.Rest;

@service
@server("http://localhost:8000/api/v1", "Local development")
@server("https://api.booking.example.com/v1", "Production")
namespace BookingAPI;

@doc("Query параметры для получения временных слотов")
model ListTimeSlotsRequest {
  @doc("ID владельца (обязательно)")
  @query
  ownerId: string;

  @doc("ID типа события (для фильтрации по длительности)")
  @query
  eventTypeId?: string;

  @doc("Начальная дата (по умолчанию текущая дата)")
  @query
  dateFrom?: utcDateTime;

  @doc("Конечная дата (по умолчанию текущая дата + 14 дней)")
  @query
  dateTo?: utcDateTime;
}

@doc("Query параметры для получения бронирований")
model ListBookingsRequest {
  @doc("ID владельца (обязательно для получения списка)")
  @query
  ownerId: string;

  @doc("Статус бронирования")
  @query
  status?: BookingStatus;
}

@tag("Owner")
@route("/owner")
interface OwnerController {
  @doc("Получить профиль дефолтного владельца календаря")
  @get
  @summary("Данные владельца")
  get(): {
    @body owner: Owner;
  } | {
    @statusCode _: 404;
    @body error: ErrorResponse;
  } | {
    @statusCode _: 500;
    @body error: ErrorResponse;
  };
}

@tag("Event Types")
@route("/event-types")
interface EventTypes {
  @doc("Получить список типов событий владельца (публичный endpoint для гостей)")
  @get
  @summary("Список типов событий")
  list(@query ownerId: string): {
    @body eventTypes: EventType[];
  } | {
    @statusCode _: 400;
    @body error: ErrorResponse;
  } | {
    @statusCode _: 500;
    @body error: ErrorResponse;
  };

  @doc("Получить детали типа события")
  @get
  @route("/{id}")
  @summary("Детали типа события")
  get(@path id: string): {
    @body eventType: EventType;
  } | {
    @statusCode _: 404;
    @body error: ErrorResponse;
  } | {
    @statusCode _: 500;
    @body error: ErrorResponse;
  };

  @doc("Создать новый тип события (только для владельца)")
  @post
  @summary("Создать тип события")
  create(@body eventType: EventTypeCreate): {
    @statusCode _: 201;
    @body createdEventType: EventType;
  } | {
    @statusCode _: 400;
    @body error: ErrorResponse;
  } | {
    @statusCode _: 500;
    @body error: ErrorResponse;
  };

  @doc("Обновить тип события (только для владельца)")
  @put
  @route("/{id}")
  @summary("Обновить тип события")
  update(@path id: string, @body eventType: EventTypeUpdate): {
    @body updatedEventType: EventType;
  } | {
    @statusCode _: 404;
    @body error: ErrorResponse;
  } | {
    @statusCode _: 400;
    @body error: ErrorResponse;
  } | {
    @statusCode _: 500;
    @body error: ErrorResponse;
  };

  @doc("Удалить тип события (только для владельца)")
  @delete
  @route("/{id}")
  @summary("Удалить тип события")
  delete(@path id: string): {
    @statusCode _: 204;
  } | {
    @statusCode _: 404;
    @body error: ErrorResponse;
  } | {
    @statusCode _: 409;
    @body error: ErrorResponse;
  } | {
    @statusCode _: 500;
    @body error: ErrorResponse;
  };
}

@tag("Time Slots")
@route("/timeslots")
interface TimeSlots {
  @doc("Получить список доступных временных слотов. Слоты генерируются автоматически на 14 дней вперёд с шагом, равным длительности выбранного типа события.")
  @get
  @summary("Список доступных слотов")
  list(...ListTimeSlotsRequest): {
    @body slots: TimeSlot[];
  } | {
    @statusCode _: 400;
    @body error: ErrorResponse;
  } | {
    @statusCode _: 500;
    @body error: ErrorResponse;
  };
}

@tag("Bookings")
@route("/bookings")
interface Bookings {
  @doc("Получить список бронирований владельца. Используется для страницы предстоящих встреч.")
  @get
  @summary("Список бронирований")
  list(...ListBookingsRequest): {
    @body bookings: BookingWithDetails[];
  } | {
    @statusCode _: 400;
    @body error: ErrorResponse;
  } | {
    @statusCode _: 500;
    @body error: ErrorResponse;
  };

  @doc("Создать новое бронирование. Гость выбирает тип события, владельца и время из доступных слотов. Нельзя создать две брони на одно и то же время.")
  @post
  @summary("Создать бронирование")
  create(@body booking: BookingCreate): {
    @statusCode _: 201;
    @body createdBooking: Booking;
  } | {
    @statusCode _: 400;
    @body error: ErrorResponse;
  } | {
    @statusCode _: 404;
    @body error: ErrorResponse;
  } | {
    @statusCode _: 409;
    @body error: ErrorResponse;
  } | {
    @statusCode _: 500;
    @body error: ErrorResponse;
  };

  @doc("Отменить бронирование (soft delete)")
  @delete
  @route("/{id}")
  @summary("Отменить бронирование")
  cancel(@path id: string): {
    @body cancelledBooking: Booking;
  } | {
    @statusCode _: 404;
    @body error: ErrorResponse;
  } | {
    @statusCode _: 409;
    @body error: ErrorResponse;
  } | {
    @statusCode _: 500;
    @body error: ErrorResponse;
  };
}
