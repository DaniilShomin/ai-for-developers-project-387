import random
from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models import Owner, EventType, Booker, Booking


def generate_random_name():
    """Генерирует случайное имя."""
    first_names = [
        "Александр",
        "Мария",
        "Дмитрий",
        "Анна",
        "Сергей",
        "Елена",
        "Андрей",
        "Ольга",
        "Максим",
        "Татьяна",
        "Иван",
        "Наталья",
    ]
    last_names = [
        "Иванов",
        "Петров",
        "Сидоров",
        "Козлова",
        "Смирнов",
        "Васильева",
        "Попов",
        "Соколова",
        "Михайлов",
        "Новикова",
        "Федоров",
        "Морозова",
    ]
    return f"{random.choice(first_names)} {random.choice(last_names)}"


def generate_random_email(name: str) -> str:
    """Генерирует email на основе имени."""
    domains = ["example.com", "test.com", "demo.ru", "mail.ru", "gmail.com"]
    # Транслитерация и форматирование
    name_parts = name.lower().split()
    if len(name_parts) >= 2:
        login = f"{name_parts[0]}.{name_parts[1]}"
    else:
        login = name_parts[0]
    # Замена кириллицы на латиницу (упрощённо)
    translit_map = {
        "а": "a",
        "б": "b",
        "в": "v",
        "г": "g",
        "д": "d",
        "е": "e",
        "ё": "e",
        "ж": "zh",
        "з": "z",
        "и": "i",
        "й": "y",
        "к": "k",
        "л": "l",
        "м": "m",
        "н": "n",
        "о": "o",
        "п": "p",
        "р": "r",
        "с": "s",
        "т": "t",
        "у": "u",
        "ф": "f",
        "х": "h",
        "ц": "ts",
        "ч": "ch",
        "ш": "sh",
        "щ": "sch",
        "ъ": "",
        "ы": "y",
        "ь": "",
        "э": "e",
        "ю": "yu",
        "я": "ya",
    }
    login_lat = "".join(translit_map.get(c, c) for c in login)
    return f"{login_lat}@{random.choice(domains)}"


def seed_data():
    """Заполняет базу тестовыми данными MVP (1 owner, 2 event types, 1 booker, 2 bookings)."""
    db = SessionLocal()
    try:
        print("Проверка и заполнение тестовых данных MVP...")

        # Получаем или создаем владельца
        owner = db.query(Owner).first()
        if not owner:
            owner_name = generate_random_name()
            owner = Owner(
                name=owner_name,
                email=generate_random_email(owner_name),
                timezone="Europe/Moscow",
                work_start="09:00",
                work_end="18:00",
            )
            db.add(owner)
            db.flush()
            print(f"Создан владелец: {owner.name}")
        else:
            print(f"Используем существующего владельца: {owner.name}")

        # Проверяем и создаем типы событий (нужно минимум 2)
        event_types_count = (
            db.query(EventType).filter(EventType.owner_id == owner.id).count()
        )
        if event_types_count < 2:
            existing_titles = {
                et.title
                for et in db.query(EventType)
                .filter(EventType.owner_id == owner.id)
                .all()
            }

            if "Консультация 30 минут" not in existing_titles:
                event_type_1 = EventType(
                    title="Консультация 30 минут",
                    description="Краткая консультация по любым вопросам",
                    duration=30,
                    owner_id=owner.id,
                )
                db.add(event_type_1)
                print("Создан тип события: Консультация 30 минут")

            if "Встреча 1 час" not in existing_titles:
                event_type_2 = EventType(
                    title="Встреча 1 час",
                    description="Полноценная встреча для детального обсуждения",
                    duration=60,
                    owner_id=owner.id,
                )
                db.add(event_type_2)
                print("Создан тип события: Встреча 1 час")

            db.flush()
        else:
            print(f"Типы событий уже есть: {event_types_count}")

        # Получаем созданные event types
        event_types = db.query(EventType).filter(EventType.owner_id == owner.id).all()

        # Проверяем и создаем booker
        booker = db.query(Booker).first()
        if not booker:
            booker_name = generate_random_name()
            booker = Booker(
                name=booker_name,
                email=generate_random_email(booker_name),
                phone=f"+7{random.randint(9000000000, 9999999999)}",
            )
            db.add(booker)
            db.flush()
            print(f"Создан клиент (booker): {booker.name}")
        else:
            print(f"Используем существующего клиента: {booker.name}")

        # Проверяем и создаем бронирования (нужно минимум 2)
        bookings_count = db.query(Booking).count()
        if bookings_count < 2:
            tomorrow = datetime.now().replace(
                hour=10, minute=0, second=0, microsecond=0
            ) + timedelta(days=1)
            day_after = tomorrow + timedelta(days=1)

            # Берем первые 2 event types
            et_list = event_types[:2]

            if len(et_list) >= 1:
                booking_1 = Booking(
                    event_type_id=et_list[0].id,
                    owner_id=owner.id,
                    booker_id=booker.id,
                    start_time=tomorrow,
                    end_time=tomorrow + timedelta(minutes=et_list[0].duration),
                    notes="Первая тестовая бронь",
                    status="confirmed",
                )
                db.add(booking_1)
                print(f"Создана бронь: {et_list[0].title} на {tomorrow}")

            if len(et_list) >= 2:
                booking_2 = Booking(
                    event_type_id=et_list[1].id,
                    owner_id=owner.id,
                    booker_id=booker.id,
                    start_time=day_after,
                    end_time=day_after + timedelta(minutes=et_list[1].duration),
                    notes="Вторая тестовая бронь",
                    status="confirmed",
                )
                db.add(booking_2)
                print(f"Создана бронь: {et_list[1].title} на {day_after}")

            db.commit()
        else:
            print(f"Бронирования уже есть: {bookings_count}")
            db.commit()

        print("Сидинг завершен!")

    except Exception as e:
        db.rollback()
        print(f"Ошибка при заполнении тестовых данных: {e}")
        raise
    finally:
        db.close()
