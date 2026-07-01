import { reactive } from 'vue';
import { createComponentRenderer } from '@/__tests__/render';
import { createTestingPinia } from '@pinia/testing';
import { type MockedStore, mockedStore } from '@/__tests__/utils';
import { defaultSettings } from '@/__tests__/defaults';
import MainSidebar from '@/app/components/MainSidebar.vue';
import { useSettingsStore } from '@/app/stores/settings.store';
import { useUIStore } from '@/app/stores/ui.store';
import { useUsersStore } from '@/features/settings/users/users.store';
import { useTemplatesStore } from '@/features/workflows/templates/templates.store';
import { usePersonalizedTemplatesV2Store } from '@/experiments/templateRecoV2/stores/templateRecoV2.store';
import { usePersonalizedTemplatesV3Store } from '@/experiments/personalizedTemplatesV3/stores/personalizedTemplatesV3.store';
import { useRecommendedTemplatesStore } from '@/features/workflows/templates/recommendations/recommendedTemplates.store';
import { ABOUT_MODAL_KEY } from '@/app/constants';

vi.mock('vue-router', () => ({
	useRouter: () => ({
		resolve: vi.fn(() => ({ meta: {} })),
	}),
	useRoute: () => reactive({ params: {} }),
	RouterLink: vi.fn(),
}));

let renderComponent: ReturnType<typeof createComponentRenderer>;
let settingsStore: MockedStore<typeof useSettingsStore>;
let uiStore: MockedStore<typeof useUIStore>;
let usersStore: MockedStore<typeof useUsersStore>;
let templatesStore: MockedStore<typeof useTemplatesStore>;
let personalizedTemplatesV2Store: MockedStore<typeof usePersonalizedTemplatesV2Store>;
let personalizedTemplatesV3Store: MockedStore<typeof usePersonalizedTemplatesV3Store>;
let recommendedTemplatesStore: MockedStore<typeof useRecommendedTemplatesStore>;

describe('MainSidebar', () => {
	beforeEach(() => {
		renderComponent = createComponentRenderer(MainSidebar, {
			pinia: createTestingPinia(),
		});
		settingsStore = mockedStore(useSettingsStore);
		uiStore = mockedStore(useUIStore);
		usersStore = mockedStore(useUsersStore);
		templatesStore = mockedStore(useTemplatesStore);
		personalizedTemplatesV2Store = mockedStore(usePersonalizedTemplatesV2Store);
		personalizedTemplatesV3Store = mockedStore(usePersonalizedTemplatesV3Store);
		recommendedTemplatesStore = mockedStore(useRecommendedTemplatesStore);

		settingsStore.settings = defaultSettings;

		usersStore.canUserUpdateVersion = true;
		uiStore.sidebarMenuCollapsed = false;
		settingsStore.isTemplatesEnabled = true;
		templatesStore.hasCustomTemplatesHost = false;
		templatesStore.websiteTemplateRepositoryURL = 'https://n8n.io/workflows';

		personalizedTemplatesV2Store.isFeatureEnabled = vi.fn(() => false);
		personalizedTemplatesV3Store.isFeatureEnabled = vi.fn(() => false);
		recommendedTemplatesStore.isFeatureEnabled = false;
	});

	it('renders the sidebar without error', () => {
		expect(() => renderComponent()).not.toThrow();
	});

	describe('mainMenuItems', () => {
		it('should not show templates menu when templates are enabled', () => {
			settingsStore.isTemplatesEnabled = true;
			templatesStore.hasCustomTemplatesHost = false;

			const { queryAllByTestId } = renderComponent();

			expect(queryAllByTestId('main-sidebar-templates')).toHaveLength(0);
		});

		it('should not show templates menu when templates are disabled', () => {
			settingsStore.isTemplatesEnabled = false;

			const { queryAllByTestId } = renderComponent();

			expect(queryAllByTestId('main-sidebar-templates')).toHaveLength(0);
		});

		it('should show settings menu item', () => {
			const { getByTestId } = renderComponent();

			expect(getByTestId('main-sidebar-settings')).toBeInTheDocument();
		});
	});

	describe('handleSelect', () => {
		beforeEach(() => {
			uiStore.openModal = vi.fn();
		});

		function dispatchAboutKeyboardShortcut() {
			const isMac = /mac/i.test(navigator.platform);
			document.dispatchEvent(
				new KeyboardEvent('keydown', {
					key: 'o',
					code: 'KeyO',
					altKey: true,
					bubbles: true,
					cancelable: true,
					...(isMac ? { metaKey: true } : { ctrlKey: true }),
				}),
			);
		}

		it('should open about modal when about is selected', () => {
			renderComponent();

			dispatchAboutKeyboardShortcut();

			expect(uiStore.openModal).toHaveBeenCalledWith(ABOUT_MODAL_KEY);
		});
	});
});
