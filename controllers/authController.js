const asyncHandler = require('express-async-handler')
const pool = require('../database/db')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const login = asyncHandler(async(req,res)=>{
    const { username, password } = req.body

    if (!username || !password) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    const user = await pool.query("SELECT * FROM users WHERE username = $1",[username]);
    if(user.rowCount===0){
        return res.status(401).json({message:"Not user found"});
    }else if(user.rows[0].correo === null){
        return res.status(401).json({message:"Not user found"});
    }
    const match = await bcrypt.compare(password, user.rows[0].password)

    if (!match) return res.status(401).json({ message: 'Unauthorized' })

    const accessToken = jwt.sign(
        {
            "UserInfo": {
                "id":user.rows[0].user_id,
                "username": user.rows[0].username,
                "roles": user.rows[0].administrador ? 'Administrador': 'Basico'
            }
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }
    )

    const refreshToken = jwt.sign(
        { "username": user.rows[0].username },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    )

    // Create secure cookie with refresh token 
    res.cookie('jwt', refreshToken, {
        httpOnly: true, //accessible only by web server 
        secure: true, //https
        sameSite: 'None', //cross-site cookie 
        maxAge: 7 * 24 * 60 * 60 * 1000 //cookie expiry: set to match rT
    })

    // Send accessToken containing username and roles 
    res.json({ accessToken })
});

const refresh = (req,res)=>{
    const cookies = req.cookies

    if (!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized' })

    const refreshToken = cookies.jwt

    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        asyncHandler(async (err, decoded) => {
            if (err) return res.status(403).json({ message: 'Forbidden' })
            const user = await pool.query("SELECT * FROM users WHERE username = $1",[decoded.username]);
            if(!user.rows){
                return res.status(401).json({message:"Unauthorized"});
            }

            const accessToken = jwt.sign(
                {
                    "UserInfo": {
                        "id":user.rows[0].user_id,
                        "username": user.rows[0].username,
                        "roles": user.rows[0].administrador ? 'Administrador': 'Basico'
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15m' }
            )

            res.json({ accessToken })
        })
    )
};

const logout = (req,res)=>{
    const cookies = req.cookies
    if (!cookies?.jwt) return res.sendStatus(204) //No content
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true })
    res.json({ message: 'Cookie cleared' })
};

module.exports = {
    login,
    refresh,
    logout
}