import app from "./app";

const bootstrap = () => {
  try {
    app.listen(5000, () => {
      console.log(`Server is running on http://localhost:5000`);
    });
  } catch (err) {
    console.error(`Failed to start server: `, err);
  }
};

bootstrap();
