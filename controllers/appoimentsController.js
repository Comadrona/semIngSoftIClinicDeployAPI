const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const pool = require('../database/db')

//@desc Get all appoiments
//@route get /appoiment
//@access private
const getAllAppoiments = asyncHandler(async(req,res)=>{
    const sql="SELECT appoiments.appoiment_id,services.service_id,appoiments.fechayhora,appoiments.estado,appoiments.user_id,users.name AS USERNAME,services.duracion,services.nombre AS SERVICENAME,services.preciosugerido FROM appoiments JOIN services ON appoiments.service_id = services.service_id JOIN users ON appoiments.user_id = users.user_id"
    const appoiments = await pool.query(sql + " ORDER BY CASE WHEN appoiments.estado = $1 THEN 2 WHEN appoiments.estado = $2 THEN 1 ELSE 0 END, appoiments.fechayhora;",['cancelada','cumplida']);
    
    if(appoiments.rowCount === 0){
        return res.status(400).json({message:"Not appoiments found"});
    }
    appoiments.rows.forEach((element) => {
        date = new Date(element.fechayhora);
        element.fechayhora=date.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
    });
    res.json(appoiments.rows);
});
const getUserAppoiments = asyncHandler(async(req,res)=>{
    const {userid} = req.body;
    const sql="SELECT appoiments.appoiment_id,services.service_id,appoiments.fechayhora,appoiments.estado,appoiments.user_id,users.name AS USERNAME,services.duracion,services.nombre AS SERVICENAME,services.preciosugerido FROM appoiments JOIN services ON appoiments.service_id = services.service_id JOIN users ON appoiments.user_id = users.user_id"
    const appoiments = await pool.query(sql + " WHERE appoiments.user_id = $1 ORDER BY CASE WHEN appoiments.estado = $2 THEN 2 WHEN appoiments.estado = $3 THEN 1 ELSE 0 END;",[userid,'cancelada','cumplida']);
    if(appoiments.rowCount ===0){
        return res.status(400).json({message:"Not appoiments found"});
    }
    appoiments.rows.forEach((element) => {
        date = new Date(element.fechayhora);
        element.fechayhora=date.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
    });
    res.json(appoiments.rows);
});
const getOneAppoiment = asyncHandler(async(req,res)=>{
    const {id} = req.body;
    const sql="SELECT appoiments.appoiment_id,services.service_id,appoiments.fechayhora,appoiments.estado,appoiments.user_id,users.name AS USERNAME,services.duracion,services.nombre AS SERVICENAME,services.preciosugerido FROM appoiments JOIN services ON appoiments.service_id = services.service_id JOIN users ON appoiments.user_id = users.user_id"
    const appoiments = await pool.query(sql + " WHERE appoiment_id = $1",[id]);
    if(appoiments.rowCount ===0){
        return res.status(400).json({message:"Not found"});
    }
    appoiments.rows.forEach((element) => {
        date = new Date(element.fechayhora);
        element.fechayhora=date.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
    });
    res.json(appoiments.rows);
});
//@desc Create new appoiment
//@route POST  /appoiment
//@access public
const createAppoiment = asyncHandler(async(req,res)=>{
    /*
    body esqueleto
    {
        "fechayhora":"2023/10/11, 14:00:00", 
        "user_id":8,
        "service_id":6
    }
    */
    const {fechayhora,user_id,service_id}=req.body;
    if(!fechayhora || !user_id || !service_id){
        return res.status(400).json({message:'All fields are required'});
    }
    let currentdate = new Date();
    const appoimentdate = new Date(fechayhora.split(', ')[0]);
    console.log(currentdate, appoimentdate)
    if(currentdate>appoimentdate){
        return res.status(401).json({message:'No  se puede registrar una cita con esa fecha'});
    }
    if(appoimentdate.getDay() === 0 ){
        return res.status(401).json({message:'No  se trabaja en domingo'});
    }
    
    
    const service = await pool.query("SELECT * FROM services WHERE service_id = $1",
    [service_id]);
    if(service.rowCount === 0){
        return res.status(401).json({message:'No existe el servicio'});
    }
    duracion=service.rows[0].duracion;
    let hora = parseInt(fechayhora.split(', ')[1].split(':')[0],10);
    if(hora < 8 || hora+duracion >20)return res.status(401).json({message:'No es una hora adecuada para generar la cita de este servicio'});
    const user = await pool.query("SELECT * FROM users WHERE user_id = $1",
    [user_id]);
    if(user.rowCount===0){
        return res.status(401).json({message:'No existe el usuario'});
    }else if(user.rows[0].correo === null){
        return res.status(401).json({message:'El usuario no esta disponible'});
    }else if(user.rows[0].administrador){
        return res.status(401).json({message:'El usuario no puede recibir consultas'});
    }
    const clinicalProfile = await pool.query("SELECT * FROM clinicalprofile WHERE user_id = $1",
    [user_id]);
    if(clinicalProfile.rowCount === 0 && service_id !==6){
        return res.status(401).json({message:'El usuario no puede registrar este servicio porque aun no tiene un perfil clinico'});
    }
    const appoimentFree = await pool.query("SELECT appoiments.fechayhora AT TIME ZONE 'America/Mexico_City' AS fechayhora,services.duracion FROM appoiments JOIN services ON appoiments.service_id = services.service_id WHERE DATE(appoiments.fechayhora) = $1 ORDER BY appoiments.fechayhora;",[fechayhora.split(" ")[0]]);
    horacita=fechayhora.split(' ')[1].split(':')[0];
    horasdecita=Array();
    horasdecita2=Array();
    horasdecita.push(parseInt(horacita));
    for(let i=1;i<duracion;i++)horasdecita.push(parseInt(horacita)+i);
    band=false;
    if(appoimentFree.rows){
        appoimentFree.rows.forEach((element) => {
            date = new Date(element.fechayhora);
            element.fechayhora=date.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
            hora=parseInt(element.fechayhora.split(', ')[1].split(':')[0]);
            horasdecita2.push(parseInt(hora));
            for(let i=1;i<parseInt(element.duracion);i++)horasdecita2.push(parseInt(hora)+i);
            horasdecita2.forEach((element)=>{
                if(horasdecita.includes(element)){
                    band=true;
                    return true;
                }
            });
            horasdecita2=[]
            if(band)return true;
        });
    }
    if(band)return res.status(400).json({message:'No existe el espacio'});
    
    const newappoiment = await pool.query(
        "INSERT INTO appoiments(fechayhora,user_id,service_id) VALUES($1,$2,$3) RETURNING *",
        [fechayhora,user_id,service_id]
    );
    if(!newappoiment.rows){
        return res.status(400).json({message:"Not appoiment created"});
    }
    
    return res.json(
        Object.assign({},{message:true},newappoiment.rows[0])
    );
});

//@desc Update an appoiment
//@route PATCH /appoiment
//@access private
/*
    9-20
*/
const updateAppoiment = asyncHandler(async(req,res)=>{
    const {fechayhora,appoiment_id}=req.body;
    if(!fechayhora|| !appoiment_id){
        return res.status(400).json({message:'All fields are required'});
    }
    const appoiment = await pool.query("SELECT * FROM appoiments WHERE appoiment_id = $1",[appoiment_id]);
    if(appoiment.rowCount === 0){
        return res.status(400).json({message:'Appoiment not found'});
    }
    const service = await pool.query("SELECT * FROM services WHERE service_id = $1",
    [appoiment.rows[0].service_id]);
    if(!service.rowCount){
        return res.status(400).json({message:'No existe el servicio'});
    }
    duracion=service.rows[0].duracion;
    let hora = parseInt(fechayhora.split(', ')[1].split(':')[0],10);
    if(hora < 9 || hora+duracion >20)return res.status(401).json({message:'No es una hora adecuada para generar la cita de este servicio'});
    currentdate=new Date();
    if( (appoiment.rows[0].fechayhora.getDate() - currentdate.getDate()) < 3 ){
        return res.status(400).json({message:"Not allowed to change the appoiment"});
    }
    const appoimentdate = new Date(fechayhora.split(', ')[0]);
    console.log(currentdate, appoimentdate)
    if(currentdate>appoimentdate){
        return res.status(401).json({message:'No  se puede registrar una cita con esa fecha'});
    }
    if(appoimentdate.getDay() === 0 ){
        return res.status(401).json({message:'No  se trabaja en domingo'});
    }
    const appoimentFree = await pool.query("SELECT appoiments.appoiment_id,appoiments.fechayhora AT TIME ZONE 'America/Mexico_City' AS fechayhora,services.duracion FROM appoiments JOIN services ON appoiments.service_id = services.service_id WHERE DATE(appoiments.fechayhora) = $1 ORDER BY appoiments.fechayhora;",[fechayhora.split(" ")[0]]);
    horacita=fechayhora.split(' ')[1].split(':')[0];
    horasdecita=Array();
    horasdecita2=Array();
    horasdecita.push(parseInt(horacita));
    for(let i=1;i<duracion;i++)horasdecita.push(parseInt(horacita)+i);
    band=false;
    if(appoimentFree.rows){
        appoimentFree.rows.forEach((element) => {
            date = new Date(element.fechayhora);
            element.fechayhora=date.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
            hora=parseInt(element.fechayhora.split(', ')[1].split(':')[0]);
            horasdecita2.push(parseInt(hora));
            for(let i=1;i<parseInt(element.duracion);i++)horasdecita2.push(parseInt(hora)+i);
            horasdecita2.forEach((element2)=>{
                if(horasdecita.includes(element2) && (element.appoiment_id !== appoiment_id)){
                    console.log(appoiment_id);
                    console.log(element);
                    band=true;
                    return true;
                }
            });
            if(band)return true;
        });
    }
    if(band)return res.status(400).json({message:'No existe el espacio'});
    
    const newappoiment = await pool.query(
        "UPDATE appoiments SET fechayhora = $1  WHERE appoiment_id = $2 RETURNING *",
        [fechayhora,appoiment_id]
    );
    if(!newappoiment.rows){
        return res.status(400).json({message:"Not appoiment updated"});
    }
    
    return res.json(
        Object.assign({},{message:true},newappoiment.rows[0])
    );
});

//@desc Delete an appoiment
//@route Delete /appoiment
//@access private
const deleteAppoiment = asyncHandler(async(req,res)=>{
    const {appoiment_id}=req.body;
    if(!appoiment_id){
        return res.status(400).json({message:'All fields are required'});
    }
    const appoiment = await pool.query("SELECT * FROM appoiments WHERE appoiment_id = $1",[appoiment_id]);
    if(appoiment.rowCount === 0){
        return res.status(400).json({message:'Appoiment not found'});
    }
    currentdate=new Date();
    if( (appoiment.rows[0].fechayhora.getDate() - currentdate.getDate()) < 3 ){
        return res.status(400).json({message:"Not allowed to delete the appoiment"});
    }
    const updateAppoimentquery = await pool.query(
        "UPDATE appoiments SET estado = $1 WHERE appoiment_id = $2 RETURNING *",
        ["cancelada",appoiment_id]
    );
    if(!updateAppoimentquery.rows){
        return res.status(400).json({message:"Not appoiment deleted"});
    }
    res.json({message:"Appoiment deleted"});
});
const verificarTiempos = (time,duracion,appoiments)=>{
    horasdecita=Array();
    for(let i=0;i<duracion;i++)horasdecita.push(time+i);
    horasdecita2=Array();
    for(let tryhour=0;tryhour<appoiments.length;tryhour++){
        hora = parseInt(appoiments[tryhour].fechayhora.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }).split(', ')[1].split(':')[0]);
        for(let i=0;i<parseInt(appoiments[tryhour].duracion);i++)horasdecita2.push(hora+i);
        for(let horacita2=0;horacita2<horasdecita2;horacita2++){
            if(horasdecita.includes(horasdecita2[horacita2])){
                return false;
            }
        }
        horasdecita2=[];
    }
    return true;
};
const createAutomaticAppoiment = asyncHandler(async(req,res)=>{
    /*
    http://localhost:5000/appoiments/automatic
    body esqueleto
    {
        "user_id":8,
        "service_id":6
    }
    */
    const {user_id,service_id}=req.body;
    if(!user_id || !service_id){
        return res.status(400).json({message:'All fields are required'});
    }

    const user = await pool.query("SELECT * FROM users WHERE user_id = $1",
    [user_id]);
    if(user.rowCount===0){
        return res.status(401).json({message:'No existe el usuario'});
    }else if(user.rows[0].correo === null){
        return res.status(401).json({message:'El usuario no esta disponible'});
    }else if(user.rows[0].administrador){
        return res.status(401).json({message:'El usuario no puede recibir consultas'});
    }

    const service = await pool.query("SELECT * FROM services WHERE service_id = $1",
    [service_id]);
    if(service.rowCount === 0){
        return res.status(401).json({message:'No existe el servicio'});
    }
    duracion=service.rows[0].duracion;
    const clinicalProfile = await pool.query("SELECT * FROM clinicalprofile WHERE user_id = $1",
    [user_id]);
    if(clinicalProfile.rowCount === 0 && service_id !==6){
        return res.status(401).json({message:'El usuario no puede registrar este servicio porque aun no tiene un perfil clinico'});
    }
    let appoimenttimes;
    switch(clinicalProfile.rows[0].preferenciashorario){
        case '08-12':
            appoimenttimes = [8,9,10,11,12];break;
        case '12-16':
            appoimenttimes = [12,13,14,15,16];break;
        case '16-20':
            appoimenttimes = [16,17,18,19,20];break;
    }
    for(let i = 1;i<=duracion;i++)appoimenttimes.pop()
    let currentdate = new Date();
    let appoimentdays = [];
    let auxdate = new Date();
    let i = 1;
    while(appoimentdays.length<3){
        auxdate.setDate(currentdate.getDate()+i);i++;
        if(auxdate.getDay()!==0)appoimentdays.push(new Date(auxdate))
    }
    for(let day=0;day<appoimentdays.length;day++){
        processdate = appoimentdays[day].toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }).split(", ")[0];
        const appoiments = await pool.query("SELECT appoiments.fechayhora AT TIME ZONE 'America/Mexico_City' AS fechayhora,services.duracion FROM appoiments JOIN services ON appoiments.service_id = services.service_id WHERE DATE(appoiments.fechayhora) = $1 ORDER BY appoiments.fechayhora;",[processdate]);
        if(appoiments.rowCount === 0 ){
            hora = String(appoimenttimes[0])+":00:00"
            processdate+=", "+hora;
            const newappoiment = await pool.query(
                "INSERT INTO appoiments(fechayhora,user_id,service_id) VALUES($1,$2,$3) RETURNING *",
                [processdate,user_id,service_id]
            );
            if(newappoiment.rowCount===0){
                return res.status(400).json({message:"Not appoiment created"});
            }
            
            return res.json(
                Object.assign({},{message:true},newappoiment.rows[0])
            );
        }else{
            for(let hour=0;hour<appoimenttimes.length;hour++){
                if(verificarTiempos(appoimenttimes[hour],duracion,appoiments.rows)){
                    hora = String(appoimenttimes[hour])+":00:00"
                    processdate+=", "+hora;
                    const newappoiment = await pool.query(
                        "INSERT INTO appoiments(fechayhora,user_id,service_id) VALUES($1,$2,$3) RETURNING *",
                        [processdate,user_id,service_id]
                    );
                    if(newappoiment.rowCount===0){
                        return res.status(400).json({message:"Not appoiment created"});
                    }
                    
                    return res.json(
                        Object.assign({},{message:true},newappoiment.rows[0])
                    );
                }
            }
            
        }
        
    }
    return res.status(400).json({message:'No existe el espacio'});
});
module.exports = {
    getAllAppoiments,
    createAppoiment,
    updateAppoiment,
    deleteAppoiment,
    getUserAppoiments,
    getOneAppoiment,
    createAutomaticAppoiment
}