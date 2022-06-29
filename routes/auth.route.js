require('dotenv').config();

const express = require('express');
const route = express.Router();

const argon2 = require('argon2');
const jwt = require('jsonwebtoken');

const User = require('../models/User.model');

route.get('/', (req, res) => res.send('USER ROUTE'));

// @route POST api/auth/register
// @desc Register User
// @access Public

route.post('/register', async (req, res) => {
    const {username, password} = req.body;

    if (!username || !password)
        return res.status(400).json({
            success: false,
            message: `Missing username and/or password`,
        });

    try {
        // Check for existing user
        const user = await User.findOne({username});
        if (user) {
            return res
                .status(400)
                .json({success: false, message: `User already exists`});
        }

        // All good
        const hashedPassword = await argon2.hash(password);
        const newUser = new User({
            username,
            password: hashedPassword,
        });

        await newUser.save();

        // Return token
        const accessToken = jwt.sign(
            {userId: newUser._id},
            process.env.ACCESS_TOKEN_SECRET,
        );

        res.json({
            success: true,
            message: 'User created Successfully',
            accessToken,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: `Internal server error`,
        });
    }
});

// @route POST api/auth/login
// @desc Login User
// @access Public

route.post('/login', async (req, res) => {
    const {username, password} = req.body;

    if (!username || !password)
        return res.status(400).json({
            success: false,
            message: `Missing username and/or password`,
        });

    try {
        // Check for existing user
        const user = await User.findOne({username});
        if (!user) {
            return res.status(400).json({
                success: false,
                message: `Incorrect username or password`,
            });
        }

        // Username found:
        const passwordValid = await argon2.verify(user.password, password);
        if (!passwordValid) {
            return res.status(400).json({
                success: false,
                message: `Incorrect username or password`,
            });
        }

        // All good
        const accessToken = jwt.sign(
            {userId: user._id},
            process.env.ACCESS_TOKEN_SECRET,
        );

        res.json({
            success: true,
            message: 'User logged Successfully',
            accessToken,
        });
        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: `Internal server error`,
        });
    }
});

module.exports = route;
