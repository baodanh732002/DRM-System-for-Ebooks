require('dotenv').config()
const express = require('express')
const path = require('path')
const configViewEngine = require('./config/viewEngine')
const webRoute = require('./routes/web')
const mongoose = require('mongoose')
const session = require('express-session');
const cookieParser = require("cookie-parser");


const app = express()
const port = process.env.PORT || 8888
const hostname = process.env.HOST_NAME
const urlConnect = 'mongodb+srv://baodanh7302:Baodanh732002@drmsytemforebooks.kvzpykg.mongodb.net/?retryWrites=true&w=majority&appName=DRMSytemForEbooks'

configViewEngine(app)

app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use(session({
  secret: "mysecret",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
}));

app.use('/', webRoute)


mongoose.connect(urlConnect).
then(() => {
    app.listen(port, hostname, () =>
      console.log(`Example app listening at http://localhost:${port}`)
    );
}).catch(e => {throw e}); 
