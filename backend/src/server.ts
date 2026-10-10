import 'dotenv/config';
import app from './app.js';
import { testDatabaseConnection } from './config/database.js';

// PORT DU SERVEUR
const PORT = Number(process.env.PORT || 3000);

// DEMARRAGE DU SERVEUR
async function startServer(): Promise<void> {
  try {
    await testDatabaseConnection();

    app.listen(PORT, () => {
      console.log(`WeightAty API : http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Impossible de se connecter à PostgreSQL :', error);
    process.exit(1);
  }
}

startServer();