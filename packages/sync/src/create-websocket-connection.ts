/**
 * External dependencies
 */
import { WebsocketProvider } from 'y-websocket';

/**
 * Internal dependencies
 */
import type { ConnectDoc, Y } from './types';

type WebsocketProviderConstructorArgs = ConstructorParameters<
	typeof WebsocketProvider
>;

export interface WebsocketConnectionConfig {
	options?: WebsocketProviderConstructorArgs[ 3 ];
	password?: string; // TODO: Use this to authorize the connection
	serverUrl: string;
}

export type CreateWebSocketConnection = (
	config: WebsocketConnectionConfig
) => ConnectDoc;

/**
 * Function that creates a new WebSocket Connection.
 *
 * @param {WebsocketConnectionConfig} config The configuration for the WebSocket connection.
 * @return {ConnectDoc} A function that connects a Y.Doc to a WebSocket server.
 */
export const createWebSocketConnection: CreateWebSocketConnection = (
	config
) => {
	return async function ( objectId: string, objectType: string, doc: Y.Doc ) {
		const roomName = `${ objectType }-${ objectId }`;

		try {
			new WebsocketProvider(
				config.serverUrl,
				roomName,
				doc,
				config.options
			);
		} catch {}

		return () => {
			// The WebsocketProvider handles its own cleanup. If needed, we could
			// implement a way to disconnect or clean up resources here.
		};
	};
};
