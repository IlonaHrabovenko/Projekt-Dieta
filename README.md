## Installation

1. Clone the repository.
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Create a `.env` file in the `backend` directory and configure the database connection and required environment variables.
4. Create a PostgreSQL database.
5. Import the database structure from `backend/database/schema.sql`.
6. Start the backend:
   ```bash
   npm run dev
   ```
7. Open a new terminal and install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
8. Start the mobile application:
   ```bash
   npx expo start -c
   ```