import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IRequestOptions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

type ArtErpTokenResponse = {
	access_token?: string;
	token?: string;
};

async function getAccessToken(this: IExecuteFunctions): Promise<string> {
	const credentials = await this.getCredentials('artErpApi');

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

	const tokenRequestOptions: IRequestOptions = {
		method: 'POST',
		uri: `${domain}/token`,
		body: {
			username: credentials.username,
			password: credentials.password,
		},
		json: true,
	};

	try {
		const tokenResponse = (await this.helpers.request(tokenRequestOptions)) as ArtErpTokenResponse;
		const token = tokenResponse.access_token ?? tokenResponse.token;

		if (!token) {
			throw new NodeOperationError(this.getNode(), 'Token was not found in ART ERP auth response');
		}

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
	const token = await getAccessToken.call(this);

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
		},
		json: true,
	};

	try {
		return await this.helpers.request(options);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}
