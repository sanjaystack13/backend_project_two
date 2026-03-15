//verified 20/06/2024

const Usermodel = require("../Models/UserModel");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

const loginuser = async (req, res) => {

    try {
        const { phone_number, email, password } = req.body;

        const existinguser = await Usermodel.findOne({ $or: [{ phone_number: phone_number }, { email: email }], isActive: true });
        console.log(existinguser);

        if (!existinguser) {
            return res.status(400).json({ message: "user not found" })
        }

        if (existinguser.password !== password) {
            return res.status(400).json({ message: "Password is incorrect" });
        }
        // const isValidPassword = await Usermodel.findOne({"existinguser.password":password});
        // if(!isValidPassword)
        //     {
        //         return res.status(400).json({message:"Password is incorrect"});
        //     }

        // const token = jwt.sign({ id: existinguser._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

        return res.status(200).json({
            user: existinguser,
            // token,
            message: "user found"
        })


    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

module.exports = {
    loginuser
}