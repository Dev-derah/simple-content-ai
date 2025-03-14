const app = require('./api/server');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
}); 