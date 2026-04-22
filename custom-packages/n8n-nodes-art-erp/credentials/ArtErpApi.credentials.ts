import type {
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class ArtErpApi implements ICredentialType {
	name = 'artErpApi';

	displayName = 'ART ERP API';

	documentationUrl = 'https://docs.n8n.io/integrations/builtin/credentials/httprequest/';

	// Resolved from dist/credentials/ (same folder as this credential's .js); copied at build time.
	icon: Icon = 'file:arterp.svg';

	properties: INodeProperties[] = [
		{
			displayName: 'Domain',
			name: 'domain',
			type: 'string',
			default: '={{$vars.ART_ERP_DOMAIN}}',
			required: true,
			description: 'Domain is loaded from workflow variable $vars.ART_ERP_DOMAIN',
		},
		{
			displayName: 'Username',
			name: 'username',
			type: 'string',
			default: '',
			required: true,
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.domain}}',
			url: '/Token',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Authorization:
					'={{"Basic " + Buffer.from($credentials.username + ":" + $credentials.password).toString("base64")}}',
			},
			body: {
				grant_type: 'password',
			},
		},
	};
}

