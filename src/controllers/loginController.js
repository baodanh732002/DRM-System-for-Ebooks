require('dotenv').config()
const User = require('../models/Users')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')


class LoginController {
    getLoginForm(req, res){
        const success = req.query.success;
        res.render('login.ejs', {success: success});
    }

    async checkAccount(req, res){
        try{
            let {username, password} = req.body
            const createToken =  async(id) =>{
                console.log({username, password})
                try{
                    const token = await jwt.sign({ _id: id }, process.env.JWT_SECRET);
                    return token;
                }catch(error){
                    res.status(400).send(error.message);
                }
            }

            if(!username || !password){
                return res.render("login", {
                    message: "Please fill in all required fields.",
                });
            }else{
                const existUSer = await User.findOne({username: username})
                if(existUSer){
                    const checkPassword = await bcrypt.compare(password, existUSer.password)
                    if(checkPassword){
                        const tokenUser = await createToken(existUSer._id)
                        const userData = {
                            _id: existUSer._id,
                            username: existUSer.user_name,
                            email: existUSer.email,
                            password: existUSer.password,
                            token: tokenUser,
                        }

                        req.session.user = userData

                        res.status(200).redirect("/");

                    }else{
                        res.render("login", { message: "Login details are incorrect" });
                    }
                }else{
                    res.render("login", { message: "Login details are incorrect" });
                }
            }
        }catch(error){
            console.log(error)
            res.status(500).render("login", { message: "Failed to login." });
        }
    }
}


module.exports = new LoginController();