import { test, expect } from '@playwright/test';
import { gotoAndWait } from './utils';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWait(page, '/');
  });

  test('отображает заголовок Calendar', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Calendar' }).first()).toBeVisible();
  });

  test('отображает подзаголовок', async ({ page }) => {
    await expect(page.getByText('Удобная система бронирования встреч')).toBeVisible();
  });

  test('кнопка "Записаться" ведет на страницу бронирования', async ({ page }) => {
    const bookButton = page.getByRole('button', { name: /Записаться/i }).first();
    await bookButton.click();
    await expect(page).toHaveURL('/booking');
  });

  test('кнопка "Управление типами" ведет на страницу типов событий', async ({ page }) => {
    const manageButton = page.getByRole('button', { name: /Управление типами/i }).first();
    await manageButton.click();
    await expect(page).toHaveURL('/event-types');
  });

  test('отображает список возможностей', async ({ page }) => {
    await expect(page.getByText('Типы событий:')).toBeVisible();
    await expect(page.getByText('Гибкие слоты:')).toBeVisible();
    await expect(page.getByText('Проверка конфликтов:')).toBeVisible();
    await expect(page.getByText('Предстоящие события:')).toBeVisible();
  });
});
