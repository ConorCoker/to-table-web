const express = require('express');
const path = require('path');
const cors = require('cors');
const ordersRouter = require('./routes/orders');
const menuRouter = require('./routes/menu');
const categoriesRouter = require('./routes/categories');
const restaurantsRouter = require('./routes/restaurants');
const rolesRouter = require('./routes/roles');
const app = express();

const allowedOrigins = ['http://localhost:3001', 'https://d1ti6emat1jvt2.cloudfront.net', 'https://master.dwj4nb9if0xc0.amplifyapp.com'];

app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));

app.use((req, res, next) => {
    console.log(`Received ${req.method} request to ${req.url}`);
    next();
});
app.use('/api', ordersRouter);
app.use('/api', menuRouter);
app.use('/api', categoriesRouter);
app.use('/api', restaurantsRouter);
app.use('/api', rolesRouter);

app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));