const express = require('express')
const route = express.Router()
const loginController = require('../controllers/loginController') 
const registerController = require('../controllers/registerController')

route.get('/', (req, res) =>{
    res.send('Hello World')
})

route.get('/login', loginController.getLoginForm)
route.post('/login', loginController.checkAccount)

route.get('/register', registerController.getRegisterForm)
route.post('/register', registerController.createAccount)


module.exports = route