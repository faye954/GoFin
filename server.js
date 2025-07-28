const express = require('express');
const app = express();
const portfolioRoutes = require('./routes/portfolio');
const cors = require('cors');

app.use(cors());
app.use(express.json());

app.use('/api/portfolio', portfolioRoutes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
