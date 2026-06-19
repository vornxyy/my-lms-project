import express from 'express';
import cors from 'cors';
import { router as analysisRoutes } from './routes/analysisRoutes.js';

const app = express();
const PORT = 5000;

app.use(cors({ 
  origin: "http://localhost:5173", 
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true 
}));

app.use(express.json());
app.use('/', analysisRoutes);

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});