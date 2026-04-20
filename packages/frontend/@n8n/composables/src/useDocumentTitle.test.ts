import { describe, it, expect, beforeEach } from 'vitest';

import { useDocumentTitle } from './useDocumentTitle';

describe('useDocumentTitle', () => {
	beforeEach(() => {
		document.title = '';
	});

	it('should set the document title', () => {
		const { set } = useDocumentTitle();
		set('Test Title');
		expect(document.title).toBe('Test Title');
	});

	it('should reset the document title', () => {
		const { set, reset } = useDocumentTitle();
		set('Test Title');
		reset();
		expect(document.title).toBe('Workflow Automation');
	});

	it('should use the correct suffix for the release channel', () => {
		const { set } = useDocumentTitle({ releaseChannel: 'beta' });
		set('Test Title');
		expect(document.title).toBe('Test Title - [BETA]');
	});

	it('should use default suffix for stable release channel', () => {
		const { set } = useDocumentTitle({ releaseChannel: 'stable' });
		set('Test Title');
		expect(document.title).toBe('Test Title');
	});

	it('should use default suffix when release channel is undefined', () => {
		const { set } = useDocumentTitle({ releaseChannel: undefined });
		set('Test Title');
		expect(document.title).toBe('Test Title');
	});

	describe('setDocumentTitle', () => {
		it('should set document title with IDLE status', () => {
			const { setDocumentTitle } = useDocumentTitle();
			setDocumentTitle('My Workflow', 'IDLE');
			expect(document.title).toBe('▶️ My Workflow');
		});

		it('should set document title with EXECUTING status', () => {
			const { setDocumentTitle } = useDocumentTitle();
			setDocumentTitle('My Workflow', 'EXECUTING');
			expect(document.title).toBe('🔄 My Workflow');
		});

		it('should set document title with ERROR status', () => {
			const { setDocumentTitle } = useDocumentTitle();
			setDocumentTitle('My Workflow', 'ERROR');
			expect(document.title).toBe('⚠️ My Workflow');
		});

		it('should set document title with DEBUG status', () => {
			const { setDocumentTitle } = useDocumentTitle();
			setDocumentTitle('My Workflow', 'DEBUG');
			expect(document.title).toBe('⚠️ My Workflow');
		});

		it('should set document title with AI_BUILDING status', () => {
			const { setDocumentTitle } = useDocumentTitle();
			setDocumentTitle('My Workflow', 'AI_BUILDING');
			expect(document.title).toBe('[Building] My Workflow');
		});

		it('should set document title with AI_DONE status', () => {
			const { setDocumentTitle } = useDocumentTitle();
			setDocumentTitle('My Workflow', 'AI_DONE');
			expect(document.title).toBe('[Done] My Workflow');
		});
	});

	describe('getDocumentState', () => {
		it('should return undefined initially', () => {
			const { getDocumentState } = useDocumentTitle();
			expect(getDocumentState()).toBeUndefined();
		});

		it('should return the current state after setDocumentTitle is called', () => {
			const { setDocumentTitle, getDocumentState } = useDocumentTitle();
			setDocumentTitle('My Workflow', 'AI_BUILDING');
			expect(getDocumentState()).toBe('AI_BUILDING');
		});

		it('should track state changes', () => {
			const { setDocumentTitle, getDocumentState } = useDocumentTitle();

			setDocumentTitle('My Workflow', 'IDLE');
			expect(getDocumentState()).toBe('IDLE');

			setDocumentTitle('My Workflow', 'AI_BUILDING');
			expect(getDocumentState()).toBe('AI_BUILDING');

			setDocumentTitle('My Workflow', 'AI_DONE');
			expect(getDocumentState()).toBe('AI_DONE');
		});

		it('should return undefined after reset is called', () => {
			const { setDocumentTitle, getDocumentState, reset } = useDocumentTitle();

			setDocumentTitle('My Workflow', 'AI_DONE');
			expect(getDocumentState()).toBe('AI_DONE');

			reset();
			expect(getDocumentState()).toBeUndefined();
		});
	});
});
