# Dulce Mar Dashboard

Admin UI for managing Dulce Mar content.

## Tech Stack

- **Framework**: React with Vite
- **Language**: TypeScript
- **State Management**: Zustand
- **Networking**: Axios

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Login with the seeded admin user:
   - **Username**: `admin`
   - **Password**: `password123`

## Deployment

The project uses **GitHub Actions** for CI/CD.

### Workflow: `Deploy Dashboard`

- **Trigger**: Push to `main`.
- **Action**: Lints, Builds, and Deploys via SCP.

### Required GitHub Secrets

Configure these in your repository settings:

- `HOST`: Server IP Address
- `USERNAME`: SSH Username
- `KEY`: SSH Private Key
- `PORT`: SSH Port (e.g., 22)
- `TARGET_DIR`: Target directory on server (e.g., `/var/www/dashboard`)
