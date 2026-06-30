/*
 * conductor.svelte.ts — the active-conductor SELECTION (shared UI state).
 *
 * Mirrors `folding.svelte.ts`: a tiny reactive switch the sidebar sets and the header
 * reads. WHICH conductor is active is the user's choice, persisted across reloads. The
 * AVAILABLE list lives in `conductorDiscovery.svelte.ts`; the actual attach/detach is
 * `conductorClient.attachConductor`. This module just remembers the pick.
 */
import { BUILTIN_ID } from "./conductorClient.svelte";
import { thermoclineConfiguredId } from "./conductorDiscovery.svelte";

const KEY = "accordion.conductor.active";

/**
 * The default conductor id when no persisted choice exists.
 * Set externally once thermocline host is resolved (by ensureThermoclineConfigured).
 */
export let defaultConductorId: string = BUILTIN_ID;

/** Bootstrap the default conductor id from a thermocline host.
 *  If host exists, force thermocline active — this fork wants auto-connect.
 *  If absent, only use Built-in when the user has no saved choice. */
export function setDefaultConductorId(host: string | null): void {
	defaultConductorId = host ? thermoclineConfiguredId(host) : BUILTIN_ID;
	if (host) {
		setActiveConductor(defaultConductorId);
		return;
	}
	// No saved preference → adopt fallback default.
	const hasSaved = typeof localStorage !== "undefined" && localStorage.getItem(KEY) !== null;
	if (!hasSaved) {
		conductorState.activeId = defaultConductorId;
	}
}

export const conductorState = $state<{ activeId: string }>({
	activeId: load(),
});

export function setActiveConductor(id: string): void {
	conductorState.activeId = id;
	if (typeof localStorage !== "undefined") {
		try {
			localStorage.setItem(KEY, id);
		} catch {
			/* storage blocked — selection just won't persist */
		}
	}
}

function load(): string {
	if (typeof localStorage === "undefined") return BUILTIN_ID;
	return localStorage.getItem(KEY) || defaultConductorId;
}
