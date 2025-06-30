/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { select } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import type { ConnectDoc, Y } from './types';
import type {
	CreateWebSocketConnection,
	WebsocketConnectionConfig,
} from './create-websocket-connection';

/**
 * External dependencies
 */
import * as awarenessProtocol from 'y-protocols/awareness.js';
import { WebsocketProvider } from 'y-websocket';

type SyncProviderOptions = {
	createWebSocketConnection: CreateWebSocketConnection;
};

export function addAwareness() {
	addFilter(
		'core.getSyncProviderRemoteConnection',
		'rtc-presence',
		(
			remoteConnection: ConnectDoc | null,
			options: SyncProviderOptions,
			y: typeof Y
		): ConnectDoc | null => {
			// const awareness = new awarenessProtocol.Awareness( ydoc );
			const rtcOptions: WebsocketConnectionConfig[ 'options' ] = {};
			// const rtcConnection = options.createWebSocketConnection( {
			// 	serverUrl: 'ws://localhost:1234',
			// 	options: rtcOptions,
			// } );
			// console.log( 'rtcConnection:', rtcConnection );
			// return rtcConnection;
			return async function (
				objectId: string,
				objectType: string,
				doc: Y.Doc
			) {
				const roomName = `${ objectType }-${ objectId }`;
				try {
					const provider = new WebsocketProvider(
						'ws://localhost:1234',
						roomName,
						doc,
						rtcOptions
					);
					setupAwareness( provider );
				} catch ( error ) {
					console.error(
						'Error creating custom WebsocketProvider:',
						error
					);
				}
				return () => {
					// The WebsocketProvider handles its own cleanup. If needed, we could
					// implement a way to disconnect or clean up resources here.
				};
			};
		}
	);
}

function setupAwareness( provider: WebsocketProvider ) {
	console.log( 'setupAwareness() on provider:', provider );
	provider.awareness.on( 'change', ( changes: any ) => {
		console.log( `awareness changes:`, changes );
	} );
	const userInfo = getCurrentUserInfo();
	console.log( 'userInfo:', userInfo );
	provider.awareness.setLocalStateField( 'user', userInfo );
}

function getCurrentUserInfo() {
	const currentUser = select( coreStore ).getCurrentUser();

	if ( ! currentUser ) {
		return null;
	}

	return {
		name: currentUser.name || '',
		username: currentUser.username || '',
		id: currentUser.id,
	};
}
