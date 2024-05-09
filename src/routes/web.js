const express = require('express')
const route = express.Router()

route.get('/', (req, res) =>{
    res.send('Hello World')
})

route.get('/login', (req, res) =>{
    res.render('login.ejs')
})

module.exports = route