import { ref, type Ref } from 'vue';

const DEFAULT_TAGLINE = 'Workflow Automation';

export type WorkflowTitleStatus =
	| 'EXECUTING'
	| 'IDLE'
	| 'ERROR'
	| 'DEBUG'
	| 'AI_BUILDING'
	| 'AI_DONE';

export interface UseDocumentTitleOptions {
	/**
	 * The release channel (e.g., 'stable', 'beta', 'dev').
	 * If not provided or 'stable', no channel suffix is appended.
	 * Otherwise, the suffix is `[CHANNEL]` (uppercased).
	 */
	releaseChannel?: string;
	/**
	 * Optional window reference for setting the document title.
	 * Useful for pop-out windows.
	 */
	windowRef?: Ref<Window | undefined>;
}

export function useDocumentTitle(options: UseDocumentTitleOptions = {}) {
	const { releaseChannel, windowRef } = options;
	const channelSuffix =
		!releaseChannel || releaseChannel === 'stable' ? '' : `[${releaseChannel.toUpperCase()}]`;

	const currentState = ref<WorkflowTitleStatus | undefined>(undefined);

	const set = (title: string) => {
		const mainPart = title || DEFAULT_TAGLINE;
		const docTitle = channelSuffix ? `${mainPart} - ${channelSuffix}` : mainPart;
		(windowRef?.value?.document ?? document).title = docTitle;
	};

	const reset = () => {
		currentState.value = undefined;
		set('');
	};

	const setDocumentTitle = (workflowName: string, status: WorkflowTitleStatus) => {
		currentState.value = status;
		let prefix = '⚠️';
		if (status === 'EXECUTING') {
			prefix = '🔄';
		} else if (status === 'IDLE') {
			prefix = '▶️';
		} else if (status === 'AI_BUILDING') {
			prefix = '[Building]';
		} else if (status === 'AI_DONE') {
			prefix = '[Done]';
		}
		set(`${prefix} ${workflowName}`);
	};

	const getDocumentState = () => currentState.value;

	return { set, reset, setDocumentTitle, getDocumentState };
}
