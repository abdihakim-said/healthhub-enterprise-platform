# HealthHub Frontend Setup and Run Guide

This guide provides instructions for setting up and running the HealthHub frontend React application created with Vite.

## Table of Contents

- [HealthHub Frontend Setup and Run Guide](#healthhub-frontend-setup-and-run-guide)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running the Application](#running-the-application)
  - [Building for Production](#building-for-production)
  - [Troubleshooting](#troubleshooting)

## Prerequisites

Ensure you have the following installed on your system:

- Node.js (v14 or later)
- npm (v6 or later) or Yarn (v1.22 or later)

## Installation

1. Clone the repository (if you haven't already):

   ```bash
   git clone https://github.com/your-org/health-hub-frontend.git
   cd health-hub-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or if you're using Yarn
   yarn install
   ```

## Configuration

1. In the root directory of the project, you will find a `.env.example` file. This file serves as a template for your environment variables. It contains:

   ```
   VITE_API_BASE_URL=YOUR_API_URL
   ```

2. Create a new file named `.env` in the root directory of the project:

   ```bash
   cp .env.example .env
   ```

3. Open the `.env` file in a text editor and replace `YOUR_API_URL` with the actual base URL of your backend API:

   ```
   VITE_API_BASE_URL=https://your-actual-api-url.com
   ```

4. If you need to change the API base URL later, simply edit this line in the `.env` file.

## Running the Application

To start the development server:

```bash
npm run dev
# or if you're using Yarn
yarn dev
```

This will start the Vite development server. By default, your application will be available at `http://localhost:5173`.

## Building for Production

To create a production build:

```bash
npm run build
# or if you're using Yarn
yarn build
```

This will generate optimized production files in the `dist` directory.

To preview the production build locally:

```bash
npm run preview
# or if you're using Yarn
yarn preview
```

## Troubleshooting

1. If you encounter issues related to missing environment variables, make sure your `.env` file is in the root directory and contains the correct variables with the `VITE_` prefix.

2. If changes to your `.env` file are not reflected in the application, try stopping the development server and starting it again.

3. For any other issues, consult the Vite documentation or the project's README file for specific troubleshooting steps.

4. Remember that when using `import.meta.env.VITE_API_BASE_URL` in your code, this value is embedded at build time. If you change the `.env` file, you'll need to rebuild your application for production use.

5. If the `.env` file is not being read correctly, ensure you are running the application from the project's root directory where the `.env` file is located.

Remember to never commit your `.env` file to version control if it contains sensitive information. Make sure it's listed in your `.gitignore` file. The `.env.example` file should be committed as it serves as a template for other developers.
