import { test, expect } from '@playwright/test';
import { gotoAndWait } from './utils';

test.describe('Event Types Page', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWait(page, '/event-types');
  });

  test('отображает заголовок страницы', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Типы событий' })).toBeVisible();
    await expect(page.getByText('Управление типами встреч и их длительностью')).toBeVisible();
  });

  test('отображает список типов событий из моков', async ({ page }) => {
    await expect(page.getByText('Консультация 30 мин')).toBeVisible();
    await expect(page.getByText('Встреча 1 час')).toBeVisible();
  });

  test('отображает длительность событий', async ({ page }) => {
    await expect(page.getByText('30 мин', { exact: true })).toBeVisible();
    await expect(page.getByText('1 ч', { exact: true })).toBeVisible();
  });

  test('открывает модальное окно для создания типа', async ({ page }) => {
    await page.getByRole('button', { name: 'Создать тип' }).click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Создать тип события' })).toBeVisible();
  });

  test('создает новый тип события', async ({ page }) => {
    // Открываем модалку
    await page.getByRole('button', { name: 'Создать тип' }).click();
    
    // Заполняем форму
    await page.getByLabel('Название').fill('Тестовая встреча');
    await page.getByLabel('Описание').fill('Описание для теста');
    
    // Отправляем форму (кнопка в модалке имеет aria-label "Создать")
    await page.getByRole('button', { name: 'Создать', exact: true }).click();
    
    // Проверяем что новый тип появился в списке
    await expect(page.getByText('Тестовая встреча')).toBeVisible();
  });

  test('валидация: название обязательно', async ({ page }) => {
    // Открываем модалку
    await page.getByRole('button', { name: 'Создать тип' }).click();
    
    // Очищаем длительность (оставляем по умолчанию)
    // Пытаемся создать без названия
    await page.getByRole('button', { name: 'Создать', exact: true }).click();
    
    // Проверяем что модалка всё ещё открыта (не закрылась из-за ошибки)
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('открывает модальное окно для редактирования', async ({ page }) => {
    // Нажимаем на иконку редактирования первого элемента
    // Кнопки редактирования - это пустые кнопки с SVG иконкой карандаша (IconEdit)
    const editButtons = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: /^$/ });
    await editButtons.nth(0).click(); // Первая кнопка редактирования
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Редактировать тип' })).toBeVisible();
    
    // Проверяем что поля заполнены текущими значениями
    await expect(page.getByLabel('Название')).toHaveValue('Консультация 30 мин');
  });

  test('удаляет тип события', async ({ page }) => {
    // Обрабатываем диалог подтверждения
    page.once('dialog', dialog => dialog.accept());
    
    // Нажимаем на иконку удаления первого элемента
    // Кнопки удаления - это пустые кнопки с SVG иконкой мусорки (IconTrash)
    const deleteButtons = page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: /^$/ });
    await deleteButtons.nth(1).click(); // Вторая кнопка - это удаление первого элемента
    
    // Проверяем что элемент удален
    await expect(page.getByText('Консультация 30 мин')).not.toBeVisible();
  });
});
