const nodemailer = require('nodemailer');
const asyncHandler = require('express-async-handler');
const pool = require('../database/db')
const sendEmail = require('../nodemailer/sendEmail')
module.exports = asyncHandler(async()=>{
    currentdate=new Date();
    currentdate.setDate(currentdate.getDate()-1)
    const sql = `
    SELECT users.correo,appoiments.appoiment_id,services.nombre,services.duracion,services.descripcion,appoiments.fechayhora
    FROM users
    JOIN appoiments
    ON appoiments.user_id = users.user_id
    JOIN services
    ON services.service_id = appoiments.service_id
    WHERE appoiments.estado = 'incumplida'
    AND users.correo IS NOT NULL 
    AND DATE(appoiments.fechayhora) = $1;
    `;
    const appoiments = await pool.query(sql,[currentdate.toLocaleString('eu-ES').split(" ")[0]]);
    
    if(appoiments.rowCount === 0){
        return res.status(400).json({message:"Not appoiments found"});
    }
    appoiments.rows.forEach((element) => {
        date = new Date(element.fechayhora);
        element.fechayhora=date.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
        console.log(element);
        sendEmail(element.correo,`
        Recuerda que el dia de mañana tienes una cita
        Tu cita es para realizarte un procedimiento de ${service.rows[0].nombre}
        Toma en cuenta la duracion de al menos ${service.rows[0].duracion} hora(s)
        La cita fue registrada para ${fechayhora}
        `)
    });

});