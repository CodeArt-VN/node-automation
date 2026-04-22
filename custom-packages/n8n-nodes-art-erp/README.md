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
- Account
  - Update (`POST /api/v1/BANK/Account/Update`, JSON body = dtoAccountData)

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
- Node will request token from `/Token` using `Content-Type: application/x-www-form-urlencoded`
- Node will automatically build `Authorization: Basic <base64(username:password)>` for token request
- After receiving token, node will call all actions using `Authorization: Bearer <token>`
