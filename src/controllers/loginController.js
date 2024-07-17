const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/Users');
const Admin = require('../models/Admins');
const Token = require('../models/Token');

class LoginController {
    getLoginForm(req, res) {
        const success = req.query.success;
        res.render('login.ejs', { success: success });
    }

    async checkAccount(req, res) {
        try {
            let { username, password } = req.body;
            console.log(req.body);

            const createToken = async(id, type) => {
                try {
                    const existingToken = await Token.findOne({ userId: id});
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
                        const tokenUser = await createToken(existUser._id, 'user');
                        
                        const userData = {
                            _id: existUser._id,
                            username: existUser.username,
                            email: existUser.email,
                            password: existUser.password,
                            token: tokenUser,
                        };

                        req.session.user = userData;
                        console.log(req.session.user);

                        return res.status(200).redirect("/");
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
}

module.exports = new LoginController();
