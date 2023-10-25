const nodemailer = require('nodemailer');
module.exports = function (destino,mensaje) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.MAIL_USERNAME,
          pass: process.env.MAIL_PASSWORD,
          clientId: process.env.OAUTH_CLIENTID,
          clientSecret: process.env.OAUTH_CLIENT_SECRET,
          refreshToken: process.env.OAUTH_REFRESH_TOKEN
        }
    });
    
    let mailOptions = {
        from: 'semingsoftbeautyclinic@gmail.com',
        to: destino,
        subject: 'Beauty Clinic - Informacion de su cita',
        text: mensaje
    };
    
    transporter.sendMail(mailOptions, function(err, data) {
        if (err) {
          console.log("Error " + err);
        } else {
          console.log("Email sent successfully");
        }
    });
}