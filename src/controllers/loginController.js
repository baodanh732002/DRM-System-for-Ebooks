const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/Users');
const Admin = require('../models/Admins');
const Token = require('../models/Token');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

class LoginController {
    getLoginForm(req, res) {
        req.session.user = null;
        req.session.admin = null;
        const success = req.query.success;
        res.render('login.ejs', { success: success });
    }

    async checkAccount(req, res) {
        try {
            let { username, password } = req.body;

            const createToken = async (id, type) => {
                try {
                    const existingToken = await Token.findOne({ userId: id });
                    if (existingToken) {
                        const now = new Date();
                        if (existingToken.expiryDate > now) {
                            return existingToken.token;
                        } else {
                            await Token.deleteOne({ _id: existingToken._id });
                        }
                    }

                    const token = jwt.sign({ _id: id, type: type }, process.env.JWT_SECRET, { expiresIn: '1d' });
                    const expiryDate = new Date();
                    expiryDate.setDate(expiryDate.getDate() + 1);

                    const newToken = new Token({
                        userId: id,
                        token: token,
                        expiryDate: expiryDate
                    });

                    await newToken.save();
                    return token;
                } catch (error) {
                    throw new Error(error.message);
                }
            }

            const sendOtp = async (email, req) => {
                const otp = crypto.randomBytes(3).toString('hex').toUpperCase(); 
                const otpExpiry = Date.now() + 60000;
                req.session.otp = otp;
                req.session.otpExpiry = otpExpiry;
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
                    subject: 'OTP Verification Code',
                    text: `Your OTP is: ${otp}. The code will expire in 1 minute.`
                };

                await transporter.sendMail(mailOptions);
            }

            const sendAuthCode = async (email, req) => {
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

                await transporter.sendMail(mailOptions);
            }

            if (!username || !password) {
                return res.render("login", {
                    message: "Please fill in all required fields.",
                });
            } else {
                const admin = await Admin.findOne({ adname: username });
                if (admin) {
                    const checkPassword = await bcrypt.compare(password, admin.password);
                    if (checkPassword) {
                        const tokenAdmin = await createToken(admin._id, 'admin');
                        
                        const adminData = {
                            _id: admin._id,
                            adname: admin.adname,
                            email: admin.email,
                            token: tokenAdmin,
                        };

                        req.session.admin = adminData;
                        return res.status(200).redirect("/indexManagement");
                    } else {
                        return res.render("login", { message: "Login details are incorrect" });
                    }
                }

                const existUser = await User.findOne({ username: username });
                if (existUser) {
                    const checkPassword = await bcrypt.compare(password, existUser.password);
                    if (checkPassword) {
                        if (!existUser.authenticated) {
                            await sendAuthCode(existUser.email, req);
                            return res.redirect("/verify-email");
                        }

                        await sendOtp(existUser.email, req);
                        return res.redirect("/otp-login");
                    } else {
                        return res.render("login", { message: "Login details are incorrect" });
                    }
                } else {
                    return res.render("login", { message: "Login details are incorrect" });
                }
            }
        } catch (error) {
            console.log(error);
            return res.status(500).render("login", { message: "Failed to login." });
        }
    }

    async getOtpLogin(req, res) {
        const currentTime = Date.now();
        const countdown = Math.max(Math.floor((req.session.otpExpiry - currentTime) / 1000), 0);

        res.render('otpLogin', { isExpired: countdown === 0, countdown });
    }

    async verifyOtp(req, res) {
        const { otp } = req.body;
        const currentTime = Date.now();
        let isExpired = false;
        let countdown = Math.max(Math.floor((req.session.otpExpiry - currentTime) / 1000), 0);
        let message = "";

        const createToken = async (id, type) => {
            try {
                const existingToken = await Token.findOne({ userId: id });
                if (existingToken) {
                    const now = new Date();
                    if (existingToken.expiryDate > now) {
                        return existingToken.token;
                    } else {
                        await Token.deleteOne({ _id: existingToken._id });
                    }
                }

                const token = jwt.sign({ _id: id, type: type }, process.env.JWT_SECRET, { expiresIn: '1d' });
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 1);

                const newToken = new Token({
                    userId: id,
                    token: token,
                    expiryDate: expiryDate
                });

                await newToken.save();
                return token;
            } catch (error) {
                throw new Error(error.message);
            }
        }

        if (otp === req.session.otp && currentTime < req.session.otpExpiry) {
            const email = req.session.email;
            const user = await User.findOneAndUpdate({ email: email }, { authenticated: true });

            const tokenUser = await createToken(user._id, 'user');

            const userData = {
                _id: user._id,
                username: user.username,
                email: user.email,
                token: tokenUser,
            };
            req.session.user = userData;

            req.session.otp = null;
            req.session.otpExpiry = null;
            req.session.email = null;

            return res.redirect("/");
        } else {
            if (currentTime >= req.session.otpExpiry) {
                isExpired = true;
                countdown = 0;
                message = "Expired OTP";

            }else{
                message = "Invalid OTP";
            }
            return res.render("otpLogin", { message, isExpired, countdown });
        }
    }

    async resendOtp(req, res) {
        try {
            const email = req.session.email;
            if (!email) {
                return res.redirect("/login");
            }

            const sendOtp = async (email, req) => {
                const otp = crypto.randomBytes(3).toString('hex').toUpperCase(); 
                const otpExpiry = Date.now() + 60000; 
                req.session.otp = otp;
                req.session.otpExpiry = otpExpiry;
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
                    subject: 'Resend OTP Verification Code',
                    text: `Your OTP is: ${otp}. The code will expire in 1 minute.`
                };

                await transporter.sendMail(mailOptions);
            }

            await sendOtp(email, req);
            const countdown = 60;
            return res.render("otpLogin", { countdown });
        } catch (error) {
            console.log(error);
            res.status(500).render("otpLogin", { message: "Failed to resend OTP." });
        }
    }

    getForgotPasswordForm(req, res) {
        res.render('forgotPassword.ejs');
    }

    async sendResetCode(req, res) {
        try {
            const { email } = req.body;
            const user = await User.findOne({ email: email });

            if (!user) {
                return res.render('forgotPassword', { message: "Email does not exist." });
            }

            const resetCode = crypto.randomBytes(3).toString('hex').toUpperCase(); 
            const resetCodeExpiry = Date.now() + 60000; 
            req.session.resetCode = resetCode;
            req.session.resetCodeExpiry = resetCodeExpiry;
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
                subject: 'Password Reset Verification Code',
                text: `Your reset code is: ${resetCode}. The code will expire in 1 minute.`
            };

            await transporter.sendMail(mailOptions);
            res.redirect('/verify-reset-code');
        } catch (error) {
            console.error(error);
            res.status(500).render('forgotPassword', { message: "Failed to send reset code." });
        }
    }

    getVerifyResetCodeForm(req, res) {
        const countdown = Math.max(Math.floor((req.session.resetCodeExpiry - Date.now()) / 1000), 0);
        res.render('verifyResetCode.ejs', { countdown });
    }

    async verifyResetCode(req, res) {
        const { resetCode } = req.body;
        const currentTime = Date.now();
        let isExpired = false;
        let countdown = Math.max(Math.floor((req.session.resetCodeExpiry - currentTime) / 1000), 0);
        let message = "";

        if (resetCode === req.session.resetCode && currentTime < req.session.resetCodeExpiry) {
            return res.redirect('/reset-password');
        } else {
            if (currentTime >= req.session.resetCodeExpiry) {
                isExpired = true;
                countdown = 0;
                message = "Expired reset code.";
            }else{
                message = "Invalid authentication code."
            }
            return res.render("verifyResetCode", { message, isExpired, countdown });
        }
    }

    getResetPasswordForm(req, res) {
        res.render('resetPassword.ejs');
    }

    async resetPassword(req, res) {
        const { newPassword, confirmPassword } = req.body;
        const email = req.session.email;
        const regPassword = /^[a-zA-Z0-9!?@]{6,}$/;

        if (!regPassword.test(newPassword)) {
            return res.render("resetPassword", {
                message: "Password must be at least 6 characters long and contain only letters, numbers, and the special characters !?@.",
            });
        }

        if (newPassword !== confirmPassword) {
            return res.render('resetPassword', { message: "Passwords do not match." });
        }

        try {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await User.findOneAndUpdate({ email: email }, { password: hashedPassword });

            req.session.resetCode = null;
            req.session.resetCodeExpiry = null;
            req.session.email = null;

            res.redirect('/login?success=password_reset');
        } catch (error) {
            console.error(error);
            res.status(500).render('resetPassword', { message: "Failed to reset password." });
        }
    }

    async resendResetCode(req, res){
        try {
            const email = req.session.email;
            if (!email) {
                return res.redirect("/login");
            }

            const sendResetCode = async (email, req) => {
                const resetCode = crypto.randomBytes(3).toString('hex').toUpperCase(); 
                const resetCodeExpiry = Date.now() + 60000; 
                req.session.resetCode = resetCode;
                req.session.resetCodeExpiry = resetCodeExpiry;
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
                    subject: 'Password Reset Code',
                    text: `Your password reset code is: ${resetCode}. The code will expire in 1 minute.`
                };

                await transporter.sendMail(mailOptions);
            }

            await sendResetCode(email, req);
            const countdown = 60;
            return res.render("verifyResetCode", { countdown });
        } catch (error) {
            console.log(error);
            res.status(500).render("verifyResetCode", { message: "Failed to resend reset code." });
        }
    }
}

module.exports = new LoginController();
