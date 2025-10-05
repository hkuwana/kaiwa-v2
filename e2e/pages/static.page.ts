import { expect, type Page } from '@playwright/test';

export class StaticPage {
	constructor(private readonly page: Page) {}

	async goto(path: string): Promise<void> {
		await this.page.goto(path);
	}

	async expectHeading(text: RegExp | string): Promise<void> {
		await expect(this.page.getByRole('heading', { name: text })).toBeVisible();
	}

	async expectContentContains(text: string): Promise<void> {
		await expect(this.page.getByText(text, { exact: false })).toBeVisible();
	}
}
