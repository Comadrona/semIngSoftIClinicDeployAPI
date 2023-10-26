const nodemailer = require('nodemailer');
const asyncHandler = require('express-async-handler');
const pool = require('../database/db')
module.exports = asyncHandler(async()=>{
    currentdate=new Date();
    currentdate.setDate(currentdate.getDate()-1)
    const updateappoiment = await pool.query(
        "UPDATE appoiments SET estado = $1 WHERE DATE(appoiments.fechayhora) = $2 RETURNING *",
        ['cancelada',currentdate.toLocaleString('eu-ES').split(" ")[0]]
    );
});