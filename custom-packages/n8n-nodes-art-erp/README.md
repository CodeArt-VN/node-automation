# n8n-nodes-art-erp

Custom n8n community node for ART ERP APIs.

## Included resources/actions

- Incoming Payment
  - Check Transaction
  - Create From Transaction
  - Get
  - Get Many
- Transaction
  - Update

## Local build

```bash
pnpm install
pnpm build
```

## Install into n8n

Publish this package to npm (or private registry), then install from n8n Community Nodes UI using package name:

`n8n-nodes-art-erp`

## Credentials setup

- Set workflow/environment variable `ART_ERP_DOMAIN` (example: `https://erp.example.com`)
- In credential, provide `Username` and `Password`
- Node will request token from `/token`, then call all actions using `Authorization: Bearer <token>`
