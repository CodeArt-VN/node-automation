<script setup lang="ts">
import { N8nMenuItem, N8nPopover, isCustomMenuItem, type IMenuItem } from '@n8n/design-system';

import { useI18n } from '@n8n/i18n';

defineProps<{
	items: IMenuItem[];
	isCollapsed: boolean;
}>();

const emit = defineEmits<{
	select: [key: string];
	logout: [];
}>();

const i18n = useI18n();

function handleSelect(key: string) {
	emit('select', key);
}

function onLogout() {
	emit('logout');
}
</script>

<template>
	<div
		:class="{
			[$style.bottomMenu]: true,
			[$style.collapsed]: isCollapsed,
		}"
	>
		<div :class="$style.bottomMenuItems">
			<template v-for="item in items" :key="item.id">
				<!-- Settings popover -->
				<N8nPopover
					v-if="item.children && item.id === 'settings'"
					key="settings"
					side="right"
					align="end"
					:side-offset="12"
				>
					<template #content>
						<div :class="$style.popover">
							<template v-for="child in item.children" :key="child.id">
								<component
									:is="child.component"
									v-if="isCustomMenuItem(child)"
									v-bind="child.props"
								/>
								<N8nMenuItem v-else :item="child" @click="() => handleSelect(child.id)" />
							</template>
							<span :class="$style.divider" />
							<N8nMenuItem
								:data-test-id="'main-sidebar-log-out'"
								:item="{
									id: 'sign-out',
									label: i18n.baseText('auth.signout'),
									icon: 'door-open',
								}"
								@click="onLogout"
							/>
						</div>
					</template>
					<template #trigger>
						<N8nMenuItem
							:data-test-id="`main-sidebar-${item.id}`"
							:item="item"
							:compact="isCollapsed"
							@click="() => handleSelect(item.id)"
						/>
					</template>
				</N8nPopover>
				<!-- Items without children -->
				<N8nMenuItem
					v-else
					:data-test-id="`main-sidebar-${item.id}`"
					:item="item"
					:compact="isCollapsed"
					:class="item.id === 'resource-center' ? $style.resourceCenterMenuItem : undefined"
					@click="() => handleSelect(item.id)"
				/>
			</template>
		</div>
	</div>
</template>

<style lang="scss" module>
.bottomMenu {
	display: flex;
	flex-direction: column;
	margin-top: auto;

	&.collapsed {
		border-top: var(--border);
	}
}

.bottomMenuItems {
	padding: var(--spacing--3xs);
}

.resourceCenterMenuItem {
	:global(.n8n-text) {
		color: var(--color--primary);
	}
}

.popover {
	padding: var(--spacing--4xs);
	min-width: 260px;
}

.divider {
	display: block;
	width: 100%;
	padding-top: var(--spacing--3xs);
	border-bottom: var(--border);
	margin-bottom: var(--spacing--3xs);
	background-color: var(--color--border);
}
</style>
