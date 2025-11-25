import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ScenariosPage from './+page.svelte';
import { userManager } from '$lib/stores/user.store.svelte';
import { GUEST_USER } from '$lib/data/user';
import { scenariosData } from '$lib/data/scenarios';

describe('Scenarios browse page', () => {
	beforeEach(() => {
		userManager.reset();
	});

	afterEach(() => {
		userManager.reset();
	});

	it('shows favorites section for logged-in users with saved scenarios', async () => {
		userManager.setUser({ ...GUEST_USER, id: 'test-user-123' });

		const favoriteId = scenariosData[0]?.id;

		const screen = render(ScenariosPage, {
			props: {
				data: {
					savedScenarioIds: favoriteId ? [favoriteId] : [],
					userCreatedScenarios: []
				}
			}
		});

		const heading = screen.getByText('My Favorites');
		await expect.element(heading).toBeVisible();

		const badge = screen.getByText('1');
		await expect.element(badge).toBeVisible();
	});

	it('filters scenarios by search query and shows empty state when no matches', async () => {
		const screen = render(ScenariosPage, {
			props: {
				data: {
					savedScenarioIds: [],
					userCreatedScenarios: []
				}
			}
		});

		const searchInput = screen.getByRole('textbox');
		await searchInput.fill('no-scenarios-should-match-this-query');

		const message = screen.getByText(
			'No scenarios found matching "no-scenarios-should-match-this-query"'
		);
		await expect.element(message).toBeVisible();
	});
});

