// server.js
const express = require('express');
const app = express();
const cors = require('cors');

// const portfolioRoutes = require('./routes/portfolio');
const financeRoutes = require('./routes/finance');

app.use(cors());
app.use(express.json());

// app.use('/api/portfolio', portfolioRoutes);
app.use('/api/quote', financeRoutes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});



