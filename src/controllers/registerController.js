const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const User = require('../models/Users');
const Admin = require('../models/Admins');

class RegisterController {
    getRegisterForm(req, res) {
        res.render('register.ejs');
    }

    async createAccount(req, res) {
        try {
            let { username, email, phone, password, confirm, birthdate } = req.body;
    
            const regEmail = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
            const regPhone = /^0\d{9,10}$/; 
            const regDate = /^\d{4}-\d{2}-\d{2}$/; 
            const regPassword = /^[a-zA-Z0-9!?@]{6,}$/;
    
            if (!username || !email || !phone || !password || !confirm || !birthdate) {
                return res.render("register", {
                    message: "Please fill in all required fields.",
                });
            }
            if (regEmail.test(email) == false) {
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
    
            if (!regDate.test(birthdate)) {
                return res.render("register", {
                    message: "Invalid birthdate format.",
                });
            }

            const birthdateObj = new Date(birthdate);
            if (isNaN(birthdateObj.getTime())) {
                return res.render("register", {
                    message: "Invalid birthdate.",
                });
            }


            if (!regPassword.test(password)) {
                return res.render("register", {
                    message: "Password must be at least 6 characters long and contain only letters, numbers, and the special characters !?@.",
                });
            }
    
            const existUser = await User.findOne({ email: email });
            if (existUser) {
                return res.render("register", { message: "Email already registered." });
            }
    
            const existUsernameInUser = await User.findOne({ username: username });
            const existUsernameInAdmin = await Admin.findOne({ adname: username });
            if (existUsernameInUser || existUsernameInAdmin) {
                return res.render("register", { message: "Username already exists." });
            }
    
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
    
            const newUser = new User({
                username: username,
                email: email,
                phone: phone,
                password: hashedPassword,
                birthDate: birthdateObj, 
                createAt: new Date(),
                authenticated: false
            });
    
            await newUser.save();
            
            const authCode = crypto.randomBytes(3).toString('hex').toUpperCase(); 
            const authCodeExpiry = Date.now() + 60000; 
            req.session.authCode = authCode;
            req.session.authCodeExpiry = authCodeExpiry;
            req.session.email = email;

            let transporter = nodemailer.createTransport({
                service: process.env.EMAIL_SERVICE,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
    
            let mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Email Verification Code',
                text: `Your verification code is: ${authCode}. The code will expire in 1 minute.`
            };
    
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                    return res.status(500).render("register", { message: "Failed to send verification email." });
                } else {
                    return res.redirect("/verify-email");
                }
            });
    
        } catch (error) {
            console.log(error);
            res.status(500).render("register", { message: "Failed to create account." });
        }
    }
    

    getAuthenticationEmail(req, res) {
        const currentTime = Date.now();
        const countdown = Math.max(Math.floor((req.session.authCodeExpiry - currentTime) / 1000), 0);
    
        res.render('authenEmail', { isExpired: countdown === 0, countdown });
    }
    

    async verifyEmail(req, res) {
        const { authCode } = req.body;
        const currentTime = Date.now();
        let isExpired = false;
        let countdown = Math.max(Math.floor((req.session.authCodeExpiry - currentTime) / 1000), 0);
        let message = "";
    
        if (authCode === req.session.authCode && currentTime < req.session.authCodeExpiry) {
            const email = req.session.email;
            await User.findOneAndUpdate({ email: email }, { authenticated: true });
            req.session.authCode = null;
            req.session.authCodeExpiry = null;
            req.session.email = null;
            return res.redirect("/login?success=account_created");
        } else {
            if (currentTime >= req.session.authCodeExpiry) {
                isExpired = true;
                countdown = 0;
                message = "Expired authentication code."

            }else{
                message = "Invalid authentication code."
            }
            
            return res.render("authenEmail", { message, isExpired, countdown });
        }
    }
    
    async resendAuthCode(req, res) {
        try {
            const email = req.session.email;
            if (!email) {
                return res.redirect("/register");
            }

            const authCode = crypto.randomBytes(3).toString('hex').toUpperCase(); 
            const authCodeExpiry = Date.now() + 60000; 
            req.session.authCode = authCode;
            req.session.authCodeExpiry = authCodeExpiry;
    
            let transporter = nodemailer.createTransport({
                service: process.env.EMAIL_SERVICE,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
    
            let mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Resend Email Verification Code',
                text: `Your new verification code is: ${authCode}. The code will expire in 1 minute.`
            };
    
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                    return res.status(500).render("authenEmail", { message: "Failed to send verification email." });
                } else {
                    const countdown = 60;
                    return res.render("authenEmail", { countdown });
                }
            });
    
        } catch (error) {
            console.log(error);
            res.status(500).render("authenEmail", { message: "Failed to resend verification code." });
        }
    }
    
}

module.exports = new RegisterController();
