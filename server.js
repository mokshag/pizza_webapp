if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const express = require('express');
const app = express();
const ejs = require('ejs');
const path = require('path');
const expressLayout = require('express-ejs-layouts')
const mongoose = require('mongoose');
const PORT = process.env.PORT || 3000;
const url = process.env.MONGO_CONNECTION_URL || 'mongodb://localhost:27017/pizza'
const flash = require('express-flash')
const MongoStore = require('connect-mongo')
const session = require('express-session')
const passport = require('passport')
const Emitter = require('events');


mongoose.connect(url, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: true
});
const connection = mongoose.connection;
connection.once('open', () => {
    console.log('Database connected...');
}).catch(err => {
    console.log('Connection failed...')
});

app.use(flash());
app.use(express.urlencoded({
    extended: false
}));
app.use(expressLayout);
app.use(express.json());
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, '/resources/views'))

const sessionConfig = {
    name: '_uchima',
    secret: 'mysecretkey',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session({
    secret: 'mysecretkey',
    resave: true,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: url
    })
}));
const eventEmitter = new Emitter()
app.set('eventEmitter', eventEmitter);
app.use(session(sessionConfig));
const passportInit = require('./app/config/passport')
passportInit(passport)
app.use(passport.initialize())
app.use(passport.session())


app.use((req, res, next) => {
    res.locals.session = req.session;
    res.locals.user = req.user;
    next();
})

require('./routes/web')(app);
app.use((req, res) => {
    res.status(404).render('errors/404')
})

const server = app.listen(PORT, () => {
    console.log(`listening on ${PORT}`);
})

const io = require('socket.io')(server)
io.on('connection', (socket) => {
    socket.on('join', (orderId) => {
        // console.log(orderId);
        socket.join(orderId);
    })
})


eventEmitter.on('orderUpdated', (data) => {
    io.to(`order_${data.id}`).emit('orderUpdated', data)
})

eventEmitter.on('orderPlaced', (data) => {
    io.to('adminRoom').emit('orderPlaced', data);
})