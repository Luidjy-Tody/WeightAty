import express from 'express';
import cors from 'cors';

const app = express();

// CONFIGURATION
app.use(cors());
app.use(express.json());

// ROUTE DE TEST
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    application: 'WeightAty',
    message: 'API opérationnelle'
  });
});

export default app;