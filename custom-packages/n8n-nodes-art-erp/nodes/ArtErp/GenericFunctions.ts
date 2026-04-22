import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IRequestOptions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

const packageMetadata = require('../../../package.json') as { version?: string };
const APP_VERSION_HEADER_VALUE = `Automation${packageMetadata.version ?? '0.0.0'}`;

type ArtErpTokenResponse = {
	access_token?: string;
	token?: string;
	expires_in?: number;
};

type TokenCacheEntry = {
	token: string;
};

const tokenCache = new Map<string, TokenCacheEntry>();

function buildAuthorizationHeaderValue(username: string, password: string): string {
	const encoded = Buffer.from(`${username}:${password}`).toString('base64');
	return `Basic ${encoded}`;
}

function buildTokenCacheKey(domain: string, username: string): string {
	return `${domain}::${username}`;
}

async function getAccessToken(this: IExecuteFunctions, forceRefresh = false): Promise<string> {
	const credentials = await this.getCredentials('artErpApi');

	if (!credentials) {
		throw new NodeOperationError(this.getNode(), 'No credentials got returned');
	}

	const domain = credentials.domain as string | undefined;
	const username = credentials.username as string | undefined;
	const password = credentials.password as string | undefined;

	if (!domain) {
		throw new NodeOperationError(
			this.getNode(),
			'Missing $vars.ART_ERP_DOMAIN. Please set this variable before running the node.',
		);
	}

	if (!username || !password) {
		throw new NodeOperationError(this.getNode(), 'Username and password are required for ART ERP auth');
	}

	const cacheKey = buildTokenCacheKey(domain, username);
	const cachedToken = tokenCache.get(cacheKey);

	if (!forceRefresh && cachedToken) {
		return cachedToken.token;
	}

	const tokenRequestOptions: IRequestOptions = {
		method: 'POST',
		uri: `${domain}/Token`,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Authorization: buildAuthorizationHeaderValue(username, password),
		},
		form: {
			grant_type: 'password',
		},
		json: true,
	};

	try {
		const tokenResponse = (await this.helpers.request(tokenRequestOptions)) as ArtErpTokenResponse;
		const token = tokenResponse.access_token ?? tokenResponse.token;

		if (!token) {
			throw new NodeOperationError(this.getNode(), 'Token was not found in ART ERP auth response');
		}

		tokenCache.set(cacheKey, { token });

		return token;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

export async function artErpApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	query: IDataObject = {},
) {
	const credentials = await this.getCredentials('artErpApi');
	let token = await getAccessToken.call(this);

	if (!credentials) {
		throw new NodeOperationError(this.getNode(), 'No credentials got returned');
	}

	const domain = credentials.domain as string | undefined;

	if (!domain) {
		throw new NodeOperationError(
			this.getNode(),
			'Missing $vars.ART_ERP_DOMAIN. Please set this variable before running the node.',
		);
	}

	const options: IRequestOptions = {
		method,
		uri: `${domain}${endpoint}`,
		qs: query,
		body,
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: 'application/json',
			'app-version': APP_VERSION_HEADER_VALUE,
		},
		json: true,
	};

	try {
		return await this.helpers.request(options);
	} catch (error) {
		const statusCode = (error as { statusCode?: number })?.statusCode;
		if (statusCode === 401) {
			token = await getAccessToken.call(this, true);
			options.headers = {
				...options.headers,
				Authorization: `Bearer ${token}`,
			};
			try {
				return await this.helpers.request(options);
			} catch (retryError) {
				throw new NodeApiError(this.getNode(), retryError as JsonObject);
			}
		}
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}
