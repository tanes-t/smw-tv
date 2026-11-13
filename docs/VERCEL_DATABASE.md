# Vercel channel configuration database

The web settings screen stores each channel's name, API URL, stream URL, and display mode as JSON in the `smw-tv:channel-configs` Redis key.

## Vercel setup

1. In the Vercel project, open **Storage** and connect the Redis store.
2. Make sure `REDIS_URL` is available in Production and Preview.
3. Redeploy the project.
4. Open `/api/channels` once. A successful response contains `{ "channels": [] }` and initializes the Redis key.

If Redis is unavailable, the app continues to use browser `localStorage` and shows a warning when a save cannot reach Vercel. No database credentials are stored in the browser.
