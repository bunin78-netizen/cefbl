import dotenv from "dotenv";
import cors from "cors";
import express from "express";

dotenv.config({ path: ".env.local" });

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/status", (_req, res) => {
  res.json({
    ok: true,
    service: "fundingarb-backend",
    timestamp: new Date().toISOString(),
  });
});

app.listen(port, () => {
  console.log(`FundingArb backend started on http://localhost:${port}`);
});
