// server.js
const express = require('express');
const cors = require('cors');
const app = express();
const quoteRoutes = require('./routes/quote1');

app.use(cors());
app.use(express.json());

app.use('/api/quote1', quoteRoutes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));