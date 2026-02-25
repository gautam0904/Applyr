import express from "express";
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from "./DB/index.js";

import jobRoutes from "./routes/job.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/jobs", jobRoutes);

app.listen(PORT, async () => {
    await connectDB();
    console.log(`Server is running on port ${PORT}`);
});