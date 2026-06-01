require("dotenv").config();
const app = require("./app");
const { ensureDatabaseConnection } = require("./config/db");

const port = Number(process.env.PORT || 5000);

async function bootstrap() {
  try {
    await ensureDatabaseConnection();
    app.listen(port, () => {
      console.log(`Backend running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

bootstrap();

