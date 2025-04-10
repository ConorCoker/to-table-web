const express = require('express');
const bodyParser = require('body-parser');
const ordersRoutes = require('./routes/orders');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.json());

app.use('/', ordersRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
