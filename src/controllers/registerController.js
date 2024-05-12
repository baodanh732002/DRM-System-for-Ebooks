const User = require('../models/Users')
const bcrypt = require('bcrypt')


class RegisterController {
    getRegisterForm(req, res){
        res.render('register.ejs')
    }

    async createAccount(req, res){
        try{
            let {username, email, phone, password, confirm} = req.body

            let regEmail = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
            let regPhone = /^[0-9]*$/;

            if(
                !username ||
                !email ||
                !phone ||
                !password ||
                !confirm
            ){
                return res.render("register", {
                    message: "Please fill in all required fields.",
                });
            }
            if(regEmail.test(email) == false){
                return res.render("register", {
                    message: "Please fill the correct email.",
                }); 
            }

            if (regPhone.test(phone) == false) {
                return res.render("register", {
                    message: "Invalid Phone.",
                });
            }

            if (password !== confirm) {
                return res.render("register", {
                  message: "Password and Confirm Password do not match.",
                });
            }

            const existUSer = await User.findOne({email: email})
            if(existUSer){
                return res.render("register", { message: "Email already registered." });
            }

            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password, salt)

            const newUser = new User({
                username: username,
                email: email,
                phone: phone,
                password: hashedPassword
            })

            await newUser.save()
            res.redirect("/login?success=true")
        
        }catch(error){
            console.log(error)
            res
            .status(500)
            .render("register", { message: "Failed to create account." });
        }
    }

    
}


module.exports = new RegisterController();