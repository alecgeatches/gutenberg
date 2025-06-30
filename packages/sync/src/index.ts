/**
 * External dependencies
 */
import * as Y from 'yjs';
import * as number from 'lib0/number';
import * as buffer from 'lib0/buffer';
import * as string from 'lib0/string';
import * as sha256 from 'lib0/hash/sha256';

/**
 * WordPress dependencies
 */
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { createIndexedDBConnection } from './create-indexeddb-connection';
import { createSyncProvider } from './provider';
import { createWebRTCConnection } from './create-webrtc-connection';
import { createWebSocketConnection } from './create-websocket-connection';
import type { ConnectDoc, SyncProvider } from './types';
import { addAwareness } from './awareness';

/**
 * Export dependencies
 */
export * as Y from 'yjs';
export { createIndexedDBConnection } from './create-indexeddb-connection';
export { createSyncProvider } from './provider';
export { createWebRTCConnection } from './create-webrtc-connection';
export { createWebSocketConnection } from './create-websocket-connection';

const queryYdocComment =
	/<!-- y:gutenberg version="([a-zA-Z0-9]*)" state="([a-zA-Z0-9+/]*={0,3})" new-content-clientid="([0-9]*)" -->/;

export function extractFromYGutenbergComment( content: string ) {
	const res = queryYdocComment.exec( content );
	if ( res === null ) {
		// Initial pull of the document. There is currently no y:gutenberg comment present.
		// Generate a consistent new clientid.
		const newClientId = new Uint32Array(
			sha256.digest( string.encodeUtf8( content ) ).buffer
		);
		return {
			startRange: 0,
			endRange: 0,
			version: '1',
			state: Y.encodeStateAsUpdateV2( new Y.Doc() ),
			newClientId,
		};
	}
	const [ , version, state, _newclientid ] = res;
	if ( version !== currentEncodingVersion ) {
		throw new Error( 'Unexpected y:gutenberg version.' );
	}
	return {
		startRange: res.index,
		endRange: res.index + res[ 0 ].length,
		version,
		state: buffer.fromBase64( state ),
		newClientId: number.parseInt( _newclientid ),
	};
}

let syncProvider: SyncProvider;

export function getSyncProvider() {
	if ( syncProvider ) {
		return syncProvider;
	}

	const localConnection = applyFilters(
		'core.getSyncProviderLocalConnection',
		null,
		{
			createIndexedDBConnection,
		},
		Y
	) as ConnectDoc | null;

	const remoteConnection = applyFilters(
		'core.getSyncProviderRemoteConnection',
		null,
		{
			createWebRTCConnection,
			createWebSocketConnection,
		},
		Y
	) as ConnectDoc | null;

	// Always create a sync provider, even if no connections are provided.
	syncProvider = createSyncProvider( localConnection, remoteConnection );

	return syncProvider;
}

addAwareness();

export const currentEncodingVersion = '1';
