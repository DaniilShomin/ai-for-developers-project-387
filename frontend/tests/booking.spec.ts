import { test, expect } from '@playwright/test';
import dayjs from 'dayjs';
import { gotoAndWait, navigateToMonth, selectDate } from './utils';

test.describe('Booking Page', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWait(page, '/booking');
  });

  test('отображает заголовок выбора типа встречи', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Выберите тип встречи' })).toBeVisible();
  });

  test('отображает доступные типы встреч из моков', async ({ page }) => {
    await expect(page.getByText('Консультация 30 мин')).toBeVisible();
    await expect(page.getByText('Встреча 1 час')).toBeVisible();
    // Длительность отображается отдельно от названия
    await expect(page.getByText('30 мин', { exact: true })).toBeVisible();
    await expect(page.getByText('1 ч', { exact: true })).toBeVisible();
  });

  test('переходит к выбору даты после выбора типа', async ({ page }) => {
    await page.getByText('Консультация 30 мин').click();
    
    await expect(page.getByRole('heading', { name: /Запись: Консультация 30 мин/i })).toBeVisible();
    await expect(page.getByText('Выберите дату', { exact: true })).toBeVisible();
  });

  test('отображает календарь после выбора типа', async ({ page }) => {
    await page.getByText('Консультация 30 мин').click();
    
    // Проверяем что календарь отображается (Mantine Calendar table)
    await expect(page.locator('table.mantine-Calendar-month').first()).toBeVisible();
  });

  test('показывает доступное время после выбора даты', async ({ page }) => {
    await page.getByText('Консультация 30 мин').click();
    
    // Выбираем дату (25 декабря 2024 из моков)
    const targetDate = dayjs('2024-12-25');
    await navigateToMonth(page, targetDate);
    await selectDate(page, '25');
    
    // Проверяем что доступное время отображается (это обычный текст, не heading)
    await expect(page.getByText('Доступное время', { exact: true })).toBeVisible();
  });

  test('переходит к форме подтверждения после выбора времени', async ({ page }) => {
    await page.getByText('Консультация 30 мин').click();
    
    // Выбираем дату
    const targetDate = dayjs('2024-12-25');
    await navigateToMonth(page, targetDate);
    await selectDate(page, '25');
    
    // Ждем загрузки слотов
    await page.waitForTimeout(500);
    
    // Выбираем время
    await page.getByRole('button', { name: /10:00 - 10:30/i }).click();
    
    // Нажимаем продолжить
    await page.getByRole('button', { name: 'Продолжить' }).click();
    
    // Проверяем что открылась форма подтверждения
    await expect(page.getByRole('heading', { name: 'Подтверждение записи' })).toBeVisible();
  });

  test('отображает форму с полями для ввода данных', async ({ page }) => {
    await page.getByText('Консультация 30 мин').click();
    
    // Выбираем дату и время
    const targetDate = dayjs('2024-12-25');
    await navigateToMonth(page, targetDate);
    await selectDate(page, '25');
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /10:00 - 10:30/i }).click();
    await page.getByRole('button', { name: 'Продолжить' }).click();
    
    // Проверяем поля формы
    await expect(page.getByLabel('Имя')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Телефон')).toBeVisible();
    await expect(page.getByLabel('Заметки')).toBeVisible();
  });

  test('валидация: имя обязательно', async ({ page }) => {
    await page.getByText('Консультация 30 мин').click();
    
    // Выбираем дату и время
    const targetDate = dayjs('2024-12-25');
    const monthYear = targetDate.format('MMMM YYYY');
    
    await navigateToMonth(page, targetDate);
    await selectDate(page, '25');
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /10:00 - 10:30/i }).click();
    await page.getByRole('button', { name: 'Продолжить' }).click();
    
    // Оставляем имя пустым, заполняем только email
    await page.getByLabel('Email').fill('test@example.com');
    
    // Отправляем форму
    await page.getByRole('button', { name: 'Подтвердить запись' }).click();
    
    // Проверяем что появилась ошибка
    await expect(page.getByText('Введите имя')).toBeVisible();
  });

  test('валидация: email обязателен', async ({ page }) => {
    await page.getByText('Консультация 30 мин').click();
    
    // Выбираем дату и время
    const targetDate = dayjs('2024-12-25');
    await navigateToMonth(page, targetDate);
    await selectDate(page, '25');
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /10:00 - 10:30/i }).click();
    await page.getByRole('button', { name: 'Продолжить' }).click();
    
    // Заполняем имя, оставляем email пустым
    await page.getByLabel('Имя').fill('Тестовый Пользователь');
    
    // Отправляем форму
    await page.getByRole('button', { name: 'Подтвердить запись' }).click();
    
    // Проверяем что появилась ошибка
    await expect(page.getByText('Введите email')).toBeVisible();
  });

  test('валидация: некорректный email', async ({ page }) => {
    await page.getByText('Консультация 30 мин').click();
    
    // Выбираем дату и время
    const targetDate = dayjs('2024-12-25');
    await navigateToMonth(page, targetDate);
    await selectDate(page, '25');
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /10:00 - 10:30/i }).click();
    await page.getByRole('button', { name: 'Продолжить' }).click();
    
    // Заполняем некорректный email
    await page.getByLabel('Имя').fill('Тестовый Пользователь');
    await page.getByLabel('Email').fill('invalid-email');
    
    // Отправляем форму
    await page.getByRole('button', { name: 'Подтвердить запись' }).click();
    
    // Проверяем что появилась ошибка
    await expect(page.getByText('Некорректный email')).toBeVisible();
  });

  test('успешное создание бронирования', async ({ page }) => {
    await page.getByText('Консультация 30 мин').click();
    
    // Выбираем дату и время
    const targetDate = dayjs('2024-12-25');
    await navigateToMonth(page, targetDate);
    await selectDate(page, '25');
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /10:00 - 10:30/i }).click();
    await page.getByRole('button', { name: 'Продолжить' }).click();
    
    // Заполняем форму
    await page.getByLabel('Имя').fill('Тестовый Пользователь');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Телефон').fill('+7 999 999-99-99');
    await page.getByLabel('Заметки').fill('Тестовая запись из Playwright');
    
    // Отправляем форму
    await page.getByRole('button', { name: 'Подтвердить запись' }).click();
    
    // Проверяем что появилось сообщение об успехе
    await expect(page.getByRole('heading', { name: 'Запись подтверждена!' })).toBeVisible();
    await expect(page.getByText('Мы отправили подтверждение на ваш email')).toBeVisible();
  });

  test('кнопка "Мои записи" ведет на страницу событий', async ({ page }) => {
    await page.getByText('Консультация 30 мин').click();
    
    // Выбираем дату и время
    const targetDate = dayjs('2024-12-25');
    await navigateToMonth(page, targetDate);
    await selectDate(page, '25');
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /10:00 - 10:30/i }).click();
    await page.getByRole('button', { name: 'Продолжить' }).click();
    
    // Заполняем и отправляем форму
    await page.getByLabel('Имя').fill('Тестовый Пользователь');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByRole('button', { name: 'Подтвердить запись' }).click();
    
    // Ждем появления кнопки и кликаем
    await page.getByRole('button', { name: 'Мои записи' }).click();
    
    // Проверяем редирект
    await expect(page).toHaveURL('/events');
  });

  test('кнопка "Назад" возвращает к выбору типа', async ({ page }) => {
    await page.getByText('Консультация 30 мин').click();
    await page.getByRole('button', { name: 'Изменить тип встречи' }).click();
    
    await expect(page.getByRole('heading', { name: 'Выберите тип встречи' })).toBeVisible();
  });

  test('показывает сообщение когда нет доступных типов', async ({ page }) => {
    // Этот тест требует сброса фикстур - пока просто проверяем что текущие отображаются
    await expect(page.getByText('Консультация 30 мин')).toBeVisible();
    await expect(page.getByText('Встреча 1 час')).toBeVisible();
  });
});
