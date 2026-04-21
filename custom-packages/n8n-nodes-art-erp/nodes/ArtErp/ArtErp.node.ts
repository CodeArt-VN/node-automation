import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { artErpApiRequest } from './GenericFunctions';

export class ArtErp implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Art ERP',
		name: 'artErp',
		icon: 'file:arterp.svg',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Consume ART ERP API',
		defaults: {
			name: 'Art ERP',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'artErpApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Incoming Payment',
						value: 'incomingPayment',
					},
					{
						name: 'Transaction',
						value: 'transaction',
					},
				],
				default: 'incomingPayment',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['incomingPayment'],
					},
				},
				options: [
					{ name: 'Check Transaction', value: 'checkTransaction', action: 'Check incoming payment transactions' },
					{
						name: 'Create From Transaction',
						value: 'createFromTransaction',
						action: 'Create incoming payments from transactions',
					},
					{ name: 'Get', value: 'get', action: 'Get an incoming payment' },
					{ name: 'Get Many', value: 'getAll', action: 'Get many incoming payments' },
				],
				default: 'getAll',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['transaction'],
					},
				},
				options: [{ name: 'Update', value: 'update', action: 'Update transactions' }],
				default: 'update',
			},
			{
				displayName: 'Incoming Payment ID',
				name: 'id',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['incomingPayment'],
						operation: ['get'],
					},
				},
			},
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: true,
				displayOptions: {
					show: {
						resource: ['incomingPayment'],
						operation: ['getAll'],
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 1000,
				},
				default: 50,
				displayOptions: {
					show: {
						resource: ['incomingPayment'],
						operation: ['getAll'],
						returnAll: [false],
					},
				},
			},
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				displayOptions: {
					show: {
						resource: ['incomingPayment'],
						operation: ['getAll'],
					},
				},
				options: [
					{
						displayName: 'Filter',
						name: 'filter',
						values: [
							{
								displayName: 'Name',
								name: 'key',
								type: 'string',
								default: '',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
							},
						],
					},
				],
			},
			{
				displayName: 'Body',
				name: 'body',
				type: 'json',
				default: '{}',
				required: true,
				displayOptions: {
					show: {
						resource: ['incomingPayment'],
						operation: ['checkTransaction', 'createFromTransaction'],
					},
				},
			},
			{
				displayName: 'Body',
				name: 'body',
				type: 'json',
				default: '{}',
				required: true,
				displayOptions: {
					show: {
						resource: ['transaction'],
						operation: ['update'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const resource = this.getNodeParameter('resource', i) as string;
			const operation = this.getNodeParameter('operation', i) as string;
			let responseData: IDataObject | IDataObject[] = {};

			if (resource === 'incomingPayment') {
				if (operation === 'checkTransaction') {
					const body = this.getNodeParameter('body', i) as IDataObject;
					responseData = await artErpApiRequest.call(
						this,
						'POST',
						'/api/v1/BANK/IncomingPayment/CheckTransaction',
						body,
					);
				} else if (operation === 'createFromTransaction') {
					const body = this.getNodeParameter('body', i) as IDataObject;
					responseData = await artErpApiRequest.call(
						this,
						'POST',
						'/api/v1/BANK/IncomingPayment/CreateFromTransaction',
						body,
					);
				} else if (operation === 'getAll') {
					const query: IDataObject = {};
					const returnAll = this.getNodeParameter('returnAll', i) as boolean;
					if (!returnAll) {
						query.Take = this.getNodeParameter('limit', i) as number;
					}
					const filters = this.getNodeParameter('filters.filter', i, []) as Array<{ key: string; value: string }>;
					for (const filter of filters) {
						if (filter.key) query[filter.key] = filter.value;
					}
					responseData = await artErpApiRequest.call(this, 'GET', '/api/v1/BANK/IncomingPayment', {}, query);
				} else if (operation === 'get') {
					const id = this.getNodeParameter('id', i) as string;
					responseData = await artErpApiRequest.call(this, 'GET', `/api/v1/BANK/IncomingPayment/${id}`);
				}
			}

			if (resource === 'transaction' && operation === 'update') {
				const body = this.getNodeParameter('body', i) as IDataObject;
				responseData = await artErpApiRequest.call(this, 'POST', '/api/v1/BANK/Transaction/Update', body);
			}

			const executionData = this.helpers.constructExecutionMetaData(
				this.helpers.returnJsonArray(responseData as IDataObject[]),
				{ itemData: { item: i } },
			);
			returnData.push(...executionData);
		}

		return [returnData];
	}
}
