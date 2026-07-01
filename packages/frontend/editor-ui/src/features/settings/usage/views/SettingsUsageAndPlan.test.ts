import { createTestingPinia } from '@pinia/testing';
import userEvent from '@testing-library/user-event';
import { createComponentRenderer } from '@/__tests__/render';
import { mockedStore, waitAllPromises } from '@/__tests__/utils';
import { useUsageStore } from '../usage.store';
import SettingsUsageAndPlan from './SettingsUsageAndPlan.vue';
import { useUIStore } from '@/app/stores/ui.store';
import { COMMUNITY_PLUS_ENROLLMENT_MODAL } from '../usage.constants';
import { useUsersStore } from '@/features/settings/users/users.store';
import type { IUser } from '@n8n/rest-api-client/api/users';
import { useToast } from '@/app/composables/useToast';
import { waitFor } from '@testing-library/vue';
import { useRBACStore } from '@/app/stores/rbac.store';

vi.mock('@/app/composables/useToast', () => ({
	useToast: vi.fn(),
}));

vi.mock('@/app/composables/useDocumentTitle', () => ({
	useDocumentTitle: () => ({
		set: vi.fn(),
	}),
}));

const mockRouteQuery: Record<string, string> = vi.hoisted(() => ({}));
const mockReplace = vi.fn();

vi.mock('vue-router', () => {
	return {
		useRoute: () => ({
			query: mockRouteQuery,
		}),
		useRouter: () => ({
			replace: mockReplace,
		}),
		RouterLink: {
			template: '<a><slot /></a>',
		},
	};
});

let usageStore: ReturnType<typeof mockedStore<typeof useUsageStore>>;
let uiStore: ReturnType<typeof mockedStore<typeof useUIStore>>;
let usersStore: ReturnType<typeof mockedStore<typeof useUsersStore>>;
let rbacStore: ReturnType<typeof mockedStore<typeof useRBACStore>>;
let mockToast: ReturnType<typeof useToast>;

const pinia = createTestingPinia({ stubActions: false });
const renderComponent = createComponentRenderer(SettingsUsageAndPlan, { pinia });

describe('SettingsUsageAndPlan', () => {
	beforeEach(() => {
		usageStore = mockedStore(useUsageStore);
		uiStore = mockedStore(useUIStore);
		usersStore = mockedStore(useUsersStore);
		rbacStore = mockedStore(useRBACStore);

		rbacStore.setGlobalScopes([]);

		mockToast = {
			showMessage: vi.fn(),
			showError: vi.fn(),
		} as unknown as ReturnType<typeof useToast>;
		vi.mocked(useToast).mockReturnValue(mockToast);

		usageStore.managePlanUrl = 'https://subscription.n8n.io';
		usageStore.isLoading = false;
		usageStore.setLoading = vi.fn((value: boolean) => {
			usageStore.isLoading = value;
		});
		usageStore.getLicenseInfo = vi.fn().mockResolvedValue(undefined);
		usageStore.activateLicense = vi.fn().mockResolvedValue(undefined);
		usageStore.refreshLicenseManagementToken = vi.fn().mockResolvedValue(undefined);

		mockReplace.mockReset();
		Object.keys(mockRouteQuery).forEach((key) => {
			delete mockRouteQuery[key];
		});
	});

	it('should not throw errors when rendering', async () => {
		expect(() => renderComponent()).not.toThrow();
	});

	it('should render the title only while loading', async () => {
		usageStore.isLoading = true;
		const { getByRole } = renderComponent();
		expect(getByRole('heading', { level: 2 })).toBeInTheDocument();
		expect(getByRole('heading').nextElementSibling).toBeNull();
	});

	it('should not show badge but unlock notice', async () => {
		usageStore.isLoading = false;
		usageStore.planName = 'Community';
		usersStore.currentUser = {
			globalScopes: ['community:register'],
		} as IUser;
		const { getByRole, container } = renderComponent();
		expect(getByRole('heading', { level: 3 })).toHaveTextContent('Community');
		expect(container.querySelector('.n8n-badge')).toBeNull();

		expect(getByRole('button', { name: 'Unlock' })).toBeVisible();

		await userEvent.click(getByRole('button', { name: 'Unlock' }));
		expect(uiStore.openModalWithData).toHaveBeenCalledWith(
			expect.objectContaining({ name: COMMUNITY_PLUS_ENROLLMENT_MODAL }),
		);
	});

	it('should show community registered badge', async () => {
		usageStore.isLoading = false;
		usageStore.planName = 'Registered Community';
		const { getByRole, container } = renderComponent();
		expect(getByRole('heading', { level: 3 })).toHaveTextContent('Community Edition');
		expect(getByRole('heading', { level: 3 })).toContain(container.querySelector('.n8n-badge'));
		expect(container.querySelector('.n8n-badge')).toHaveTextContent('Registered');
	});

	it('should not show activation or view plans buttons', async () => {
		usageStore.isLoading = false;
		usageStore.planName = 'Community';
		usersStore.currentUser = {
			globalScopes: ['license:manage'],
		} as IUser;
		rbacStore.setGlobalScopes(['license:manage']);

		const { queryByRole } = renderComponent();

		expect(queryByRole('button', { name: /activation/i })).not.toBeInTheDocument();
		expect(queryByRole('link', { name: /plans/i })).not.toBeInTheDocument();
		expect(queryByRole('button', { name: /plans/i })).not.toBeInTheDocument();
	});

	describe('License activation with query parameter', () => {
		it('should activate license from query param on mount', async () => {
			Object.assign(mockRouteQuery, { key: 'query-param-key' });
			usageStore.activateLicense.mockResolvedValueOnce(undefined);

			renderComponent();

			await waitFor(
				() => {
					expect(usageStore.activateLicense).toHaveBeenCalledWith('query-param-key');
					expect(mockReplace).toHaveBeenCalledWith({ query: {} });
					expect(mockToast.showMessage).toHaveBeenCalledWith(
						expect.objectContaining({ type: 'success' }),
					);
				},
				{ timeout: 2000 },
			);
		});

		it('should handle error when activating license from query param', async () => {
			Object.assign(mockRouteQuery, { key: 'invalid-key' });
			const error = new Error('Invalid key');
			usageStore.activateLicense.mockRejectedValueOnce(error);

			renderComponent();

			await waitFor(
				() => {
					expect(mockToast.showError).toHaveBeenCalledWith(error, 'Activation failed');
				},
				{ timeout: 2000 },
			);
		});
	});

	describe('License management token refresh', () => {
		it('should refresh license management token when user can activate license', async () => {
			usersStore.currentUser = {
				globalScopes: ['license:manage'],
			} as IUser;
			rbacStore.setGlobalScopes(['license:manage']);

			renderComponent();

			await waitAllPromises();

			await waitFor(
				() => {
					expect(usageStore.refreshLicenseManagementToken).toHaveBeenCalled();
				},
				{ timeout: 2000 },
			);
		});

		it('should get license info when user cannot activate license', async () => {
			usersStore.currentUser = {
				id: '1',
				email: 'test@example.com',
				firstName: 'Test',
				lastName: 'User',
				isDefaultUser: false,
				isPendingUser: false,
				mfaEnabled: false,
				globalScopes: [],
			} as IUser;

			renderComponent();

			await waitAllPromises();

			await waitFor(
				() => {
					expect(usageStore.getLicenseInfo).toHaveBeenCalled();
					expect(usageStore.refreshLicenseManagementToken).not.toHaveBeenCalled();
				},
				{ timeout: 2000 },
			);
		});
	});
});
