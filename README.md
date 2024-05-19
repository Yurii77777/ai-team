# AI TEAM

## How to start

Create .env :

## Telegram

- `TELEGRAM_BOT_TOKEN`;
- `TELEGRAM_PUBLIC_CHANNEL`; // @telegram_channel_name
- `TELEGRAM_ADMIN_CHAT_ID`; // Admin's chatId. Look in the Start command

## OpeanAI

- `OPENAI_API_KEY`;

## DB (PostgreSQL)

- `DATABASE_USERNAME=postgres`;
- `DATABASE_PASSWORD=postgres`;
- `DATABASE_NAME=ai_team`;
- `DATABASE_HOST=postgres`;
- `DATABASE_PORT=5432`;

## Docker

```bash
$ docker-compose build
$ docker-compose up
```

## Migrations

```bash

$ docker-compose exec backend bash
 # To generate migration
$ npm run typeorm:migration-generate
 # To create migration
$ npm run typeorm:migration-create
# To run migration
$ npm run typeorm:migration-run
# To revert migration
$ npm run typeorm:migration-revert
```
