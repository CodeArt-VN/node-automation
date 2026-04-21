import type {
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class ArtErpApi implements ICredentialType {
	name = 'artErpApi';

	displayName = 'Art ERP API';

	documentationUrl = 'https://docs.n8n.io/integrations/builtin/credentials/httprequest/';

	icon: Icon = 'node:n8n-nodes-base.httpRequest';

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
			url: '/token',
			method: 'POST',
			body: {
				username: '={{$credentials.username}}',
				password: '={{$credentials.password}}',
			},
		},
	};
}
