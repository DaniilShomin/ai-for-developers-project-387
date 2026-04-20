import { Page } from '@playwright/test';
import dayjs from 'dayjs';

/**
 * Navigate to page and wait for it to be ready
 * Uses networkidle to wait for all JS to load and execute
 */
export async function gotoAndWait(page: Page, url: string): Promise<void> {
  // Navigate and wait for network to be idle (all JS loaded)
  await page.goto(url, { waitUntil: 'networkidle' });
  
  // Wait for visible content in root (not just style tags)
  await page.waitForFunction(() => {
    const root = document.getElementById('root');
    if (!root) return false;
    // Check for visible elements (div, button, h1, etc. - not style tags)
    const visibleElements = root.querySelectorAll('div, button, h1, h2, h3, h4, p, span, a, main, section, article');
    return visibleElements.length > 0;
  }, { timeout: 10000 });
  
  // Additional delay for MSW to initialize
  await page.waitForTimeout(1000);
}

/**
 * Navigate to a specific month in Mantine Calendar
 * Uses next/previous month buttons until target month is visible
 */
export async function navigateToMonth(page: Page, targetDate: dayjs.Dayjs): Promise<void> {
  const monthYear = targetDate.format('MMMM YYYY');
  
  // Keep clicking next month until we see the target month
  let attempts = 0;
  while (!(await page.getByText(monthYear).isVisible()) && attempts < 24) {
    // Mantine Calendar navigation: find buttons in the calendar header
    // The header typically has 2-3 buttons: previous, month-year (text), next
    const calendar = page.locator('.mantine-Calendar-root, .custom-calendar').first();
    const headerButtons = calendar.locator('button');
    const count = await headerButtons.count();
    
    if (count >= 2) {
      // Click the last button which is "next month"
      await headerButtons.nth(count - 1).click();
    } else {
      throw new Error('Could not find calendar navigation buttons');
    }
    
    // Small delay to allow animation
    await page.waitForTimeout(100);
    attempts++;
  }
}

/**
 * Select a date in Mantine Calendar
 * Assumes calendar is already navigated to correct month
 */
export async function selectDate(page: Page, day: string | number): Promise<void> {
  // Find the calendar table and click the exact day
  await page.locator('table.mantine-Calendar-month')
    .getByText(String(day), { exact: true })
    .first()
    .click();
}
