const express = require('express');
const path = require('path');
const ordersRouter = require('./routes/orders');
const menuRouter = require('./routes/menu');
const categoriesRouter = require('./routes/categories');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));

app.use('/api', ordersRouter);
app.use('/api', menuRouter);
app.use('/api', categoriesRouter);

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));