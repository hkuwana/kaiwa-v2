import { expect, type Locator, type Page } from '@playwright/test';

export class AuthPage {
	readonly page: Page;
	readonly emailInput: Locator;
	readonly passwordInput: Locator;
	readonly submitButton: Locator;
	readonly errorMessage: Locator;
	readonly signUpLink: Locator;
	readonly loginLink: Locator;

	constructor(page: Page) {
		this.page = page;
		this.emailInput = page.getByLabel(/email/i);
		this.passwordInput = page.getByLabel(/password/i);
		this.submitButton = page.getByRole('button', { name: /(sign up|log in|submit)/i });
		this.errorMessage = page.locator('[role="alert"], .error, .alert-error');
		this.signUpLink = page.getByRole('link', { name: /sign up/i });
		this.loginLink = page.getByRole('link', { name: /log in/i });
	}

	async gotoLogin(): Promise<void> {
		await this.page.goto('/auth/login');
	}

	async gotoSignup(): Promise<void> {
		await this.page.goto('/auth/signup');
	}

	async fillEmail(email: string): Promise<void> {
		await this.emailInput.fill(email);
	}

	async fillPassword(password: string): Promise<void> {
		await this.passwordInput.fill(password);
	}

	async submit(): Promise<void> {
		await this.submitButton.click();
	}

	async login(email: string, password: string): Promise<void> {
		await this.gotoLogin();
		await this.fillEmail(email);
		await this.fillPassword(password);
		await this.submit();
	}

	async signup(email: string, password: string): Promise<void> {
		await this.gotoSignup();
		await this.fillEmail(email);
		await this.fillPassword(password);
		await this.submit();
	}

	async expectLoginSuccess(): Promise<void> {
		// Should redirect away from auth pages
		await this.page.waitForURL(/^\/(dashboard|conversation|scenarios|$)/);
	}

	async expectError(message?: string | RegExp): Promise<void> {
		await expect(this.errorMessage).toBeVisible();
		if (message) {
			await expect(this.errorMessage).toContainText(message);
		}
	}

	async expectOnLoginPage(): Promise<void> {
		await expect(this.page).toHaveURL(/\/auth\/login/);
	}

	async expectOnSignupPage(): Promise<void> {
		await expect(this.page).toHaveURL(/\/auth\/signup/);
	}
}
