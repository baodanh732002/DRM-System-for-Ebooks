const User = require('../models/Users');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const moment = require('moment');

class UserController {
    async getUserProfile(req, res) {
        try {
            const user = req.session.user || null;
            if (!user) {
                return res.redirect("/login");
            }
    
            const userData = await User.findById(user._id);
    
            userData.birthDateFormatted = moment(userData.birthDate).format('DD/MM/YYYY');
            userData.createAtFormatted = moment(userData.createAt).format('DD/MM/YYYY');

            const userBirthDateFormat = moment(userData.birthDate).format('YYYY-MM-DD');
    
            res.render('userProfile', { userData, user, message: null, userBirthDateFormat });
        } catch (error) {
            console.log(error);
            res.status(500).send("Failed to render profile page");
        }
    }

    async updateUser(req, res) {
        try {
            const { username, phone, birthDate } = req.body;
            const user = req.session.user;

            if (!user) {
                return res.redirect("/login");
            }

            const userData = await User.findById(user._id);

            userData.birthDateFormatted = moment(userData.birthDate).format('DD/MM/YYYY');
            userData.createAtFormatted = moment(userData.createAt).format('DD/MM/YYYY');
            const userBirthDateFormat = moment(userData.birthDate).format('YYYY-MM-DD');

            let regPhone = /^0\d{9,10}$/;
            console.log(phone);
            if (!regPhone.test(phone)) {
                return res.render("userProfile", {
                    userData,
                    message: "Invalid Phone.",
                    userBirthDateFormat,
                    user
                });
            }

            const existUsernameInUser = await User.findOne({ username: username });
            const existUsernameInAdmin = await Admin.findOne({ adname: username });
            if (existUsernameInUser || existUsernameInAdmin) {
                return res.render("userProfile", {
                    userData,
                    message: "Username already exist.",
                    userBirthDateFormat,
                    user
                });
            }

            req.session.newUserInfo = { username, phone, birthDate };

            const sendAuthCodeEmail = async (email, res, redirectPath) => {
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
                    subject: 'Change Information Verification Code',
                    text: `Your verification code is: ${authCode}. The code will expire in 1 minute.`
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log(error);
                        return res.status(500).send("Failed to send verification email.");
                    } else {
                        console.log('Email sent: ' + info.response);
                        return res.redirect(redirectPath);
                    }
                });
            }

            sendAuthCodeEmail(user.email, res, "/verify-change");

        } catch (error) {
            console.log(error);
            res.status(500).send("Failed to update user profile.");
        }
    }

    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword, confirmPassword } = req.body;
            const user = req.session.user;

            if (!user) {
                return res.redirect("/login");
            }

            const existingUser = await User.findById(user._id);
            const isMatch = await bcrypt.compare(currentPassword, existingUser.password);

            const userData = await User.findById(user._id);

            userData.birthDateFormatted = moment(userData.birthDate).format('DD/MM/YYYY');
            userData.createAtFormatted = moment(userData.createAt).format('DD/MM/YYYY');
            const userBirthDateFormat = moment(userData.birthDate).format('YYYY-MM-DD');

            if (!isMatch) {
                return res.render('userProfile', { user, message: "Current password is incorrect.", userData, userBirthDateFormat });
            }

            if (newPassword !== confirmPassword) {
                return res.render('userProfile', { user, message: "New password and confirm password do not match.", userData, userBirthDateFormat });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            req.session.newPassword = hashedPassword;

            const sendAuthCodeEmail = async (email, res, redirectPath) => {
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
                    subject: 'Change Password Verification Code',
                    text: `Your verification code is: ${authCode}. The code will expire in 1 minute.`
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log(error);
                        return res.status(500).send("Failed to send verification email.");
                    } else {
                        console.log('Email sent: ' + info.response);
                        return res.redirect(redirectPath);
                    }
                });
            }

            sendAuthCodeEmail(user.email, res, "/verify-change");

        } catch (error) {
            console.log(error);
            res.status(500).send("Failed to change password.");
        }
    }

    async verifyChange(req, res) {
        const { authCode } = req.body;
        const currentTime = Date.now();
        const user = req.session.user;

        if (!user) {
            return res.redirect("/login");
        }

        let isExpired = false;
        let countdown = Math.max(Math.floor((req.session.authCodeExpiry - currentTime) / 1000), 0);
        let message = "";

        if (authCode === req.session.authCode && currentTime < req.session.authCodeExpiry) {
            if (req.session.newUserInfo) {
                await User.updateOne({ _id: user._id }, req.session.newUserInfo);
                req.session.newUserInfo = null;
            }
            if (req.session.newPassword) {
                await User.updateOne({ _id: user._id }, { password: req.session.newPassword });
                req.session.newPassword = null;
            }

            req.session.authCode = null;
            req.session.authCodeExpiry = null;
            return res.redirect("/login?success=change_successful");
        } else {
            if (currentTime >= req.session.authCodeExpiry) {
                isExpired = true;
                countdown = 0;
                message = "Expired authentication code.";
            } else {
                message = "Invalid authentication code.";
            }
            return res.render("verifyChange", { message, isExpired, countdown });
        }
    }

    async resendAuthCode(req, res) {
        try {
            const user = req.session.user;

            if (!user) {
                return res.redirect("/login");
            }

            const sendAuthCodeEmail = async (email, res, redirectPath) => {
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
                    subject: 'Resend Verification Code',
                    text: `Your new verification code is: ${authCode}. The code will expire in 1 minute.`
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log(error);
                        return res.status(500).render("verifyChange", { message: "Failed to send verification email." });
                    } else {
                        console.log('Email sent: ' + info.response);
                        const countdown = 60;
                        return res.render("verifyChange", { countdown });
                    }
                });
            }

            sendAuthCodeEmail(user.email, res, "/verify-change");

        } catch (error) {
            console.log(error);
            res.status(500).render("verifyChange", { message: "Failed to resend verification code." });
        }
    }

    async getVerifyChange(req, res) {
        const currentTime = Date.now();
        const countdown = Math.max(Math.floor((req.session.authCodeExpiry - currentTime) / 1000), 0);

        res.render('verifyChange', { isExpired: countdown === 0, countdown });
    }
}

module.exports = new UserController();
