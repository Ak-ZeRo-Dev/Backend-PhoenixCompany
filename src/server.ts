import { app } from "./app";
import { cloudinary } from "./config/cloudinary";
import { connectDB } from "./config/db";

const PORT: number = Number(process.env.PORT) || 9000;

cloudinary();

app.listen(PORT, async () => {
  console.log(`Server running successfully at "http://localhost:${PORT}"`);
  connectDB();
});
