# ShareXWorker

ShareXWorker is a serverless file uploader designed for seamless integration with ShareX, powered by Cloudflare Workers and Hono.js. This project allows users to upload images with minimal setup. Inspired by [ShareX-R2-Cloudflare-Workers](https://github.com/Cherry/ShareX-R2-Cloudflare-Workers).

## Features

📤 File Upload: Handles binary file uploads effortlessly.

🌐 Serverless: Built on Cloudflare Workers for scalability and low-latency performance.

⚡ Fast and Lightweight: Uses Hono.js for a compact and efficient backend.

🛠️ Custom ShareX Integration: Easily configurable for ShareX uploads.

## Prerequisites

- A domain with Cloudflare DNS
- Cloudflare ClI (Wrangler)

## Installation

Clone the repository:

```cli
git clone git@github.com:alexraskin/ShareXWorker.git
cd ShareXWorker
```

Install the dependencies:

```cli
npm install
```

Edit the `wrangler.toml` file with the R2 bucket, Auth token variable, and the routes.

- [Token Generator](https://it-tools.tech/token-generator)

Edit the `sharex.config.sxcu` file with your domain, Auth token and name.

- Note: Do not remove the `Bearer` prefix from the Auth token.

Deploy the worker:

```cli
npm run deploy
```

## Usage

1. Open ShareX and open the `sharex.config.sxcu` file.

2. Profit!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
