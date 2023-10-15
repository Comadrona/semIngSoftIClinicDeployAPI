const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const pool = require('../database/db')

//@desc Get all appoiments fullfiled
//@route get /appoiment/fullfiled
//@access private
const getAllAppoimentsFullfiled = asyncHandler(async(req,res)=>{
    const sql="SELECT appoiments.appoiment_id,services.service_id,appoiments.fechayhora,appoiments.estado,appoiments.user_id,users.name AS USERNAME,services.duracion,services.nombre AS SERVICENAME, appoimentsfullfiled.observaciones, appoimentsfullfiled.montototal FROM appoiments JOIN services ON appoiments.service_id = services.service_id JOIN users ON appoiments.user_id = users.user_id JOIN appoimentsfullfiled ON appoimentsfullfiled.appoiment_id = appoiments.appoiment_id;"
    const appoiments = await pool.query(sql);
    
    if(!appoiments.rows){
        return res.status(400).json({message:"Not appoiments found"});
    }
    appoiments.rows.forEach((element) => {
        date = new Date(element.fechayhora);
        element.fechayhora=date.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
    });
    res.json(appoiments.rows);
});
//@desc Get all appoiments fullfiled
//@route get /appoiment/fullfiled/user
//@access private
const getUserAppoimentsFullfiled = asyncHandler(async(req,res)=>{
    const {userid} = req.body;
    const sql="SELECT appoiments.appoiment_id,services.service_id,appoiments.fechayhora,appoiments.estado,appoiments.user_id,users.name AS USERNAME,services.duracion,services.nombre AS SERVICENAME, appoimentsfullfiled.observaciones, appoimentsfullfiled.montototal FROM appoiments JOIN services ON appoiments.service_id = services.service_id JOIN users ON appoiments.user_id = users.user_id JOIN appoimentsfullfiled ON appoimentsfullfiled.appoiment_id = appoiments.appoiment_id"
    const appoiments = await pool.query(sql + " WHERE appoiments.user_id = $1;",[userid]);
    if(appoiments.rowCount ===0){
        return res.status(400).json({message:"Not appoiments found"});
    }
    appoiments.rows.forEach((element) => {
        date = new Date(element.fechayhora);
        element.fechayhora=date.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
    });
    res.json(appoiments.rows);
});
//@desc Get one appoiments fullfiled
//@route get /appoiment/fullfiled/unique
//@access private
const getOneAppoimentFullfiled = asyncHandler(async(req,res)=>{
    const {id} = req.body;
    const sql="SELECT appoiments.appoiment_id,services.service_id,appoiments.fechayhora,appoiments.estado,appoiments.user_id,users.name AS USERNAME,services.duracion,services.nombre AS SERVICENAME, appoimentsfullfiled.observaciones, appoimentsfullfiled.montototal FROM appoiments JOIN services ON appoiments.service_id = services.service_id JOIN users ON appoiments.user_id = users.user_id JOIN appoimentsfullfiled ON appoimentsfullfiled.appoiment_id = appoiments.appoiment_id"
    const appoiments = await pool.query(sql + " WHERE appoimentsfullfiled_id = $1",[id]);
    if(appoiments.rowCount ===0){
        return res.status(400).json({message:"Not found"});
    }
    appoiments.rows.forEach((element) => {
        date = new Date(element.fechayhora);
        element.fechayhora=date.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
    });
    res.json(appoiments.rows);
});
//@desc Fullfiled an appoiment
//@route POST  /appoiment/fullfiled
//@access public
const createAppoimentFullfiled = asyncHandler(async(req,res)=>{
    const {appoiment_id,observaciones,montototal}=req.body;
    if(!appoiment_id || !observaciones || !montototal){
        return res.status(400).json({message:'All fields are required'});
    }
    const appoiment = await pool.query("SELECT * FROM appoiments WHERE appoiment_id = $1",[appoiment_id]);
    if(appoiment.rowCount === 0){
        return res.status(400).json({message:'Appoiment not found'});
    }
    if(appoiment.rows[0].estado === 'cumplida'){
        return res.status(401).json({message:'Appoiment already fullfiled'});
    }
    if(appoiment.rows[0].estado === 'cancelada'){
        return res.status(401).json({message:'Appoiment already canceled'});
    }
    const updateappoiment = await pool.query(
        "UPDATE appoiments SET estado = $1 WHERE appoiment_id = $2 RETURNING *",
        ['cumplida',appoiment_id]
    );
    if(!updateappoiment.rows){
        return res.status(400).json({message:"Not appoiment updated"});
    }
    const newappoimentfullfiled = await pool.query(
        "INSERT INTO appoimentsfullfiled(appoiment_id,observaciones,montototal) VALUES($1,$2,$3) RETURNING *",
        [appoiment_id,observaciones,montototal]
    );
    if(newappoimentfullfiled.rowCount === 0){
        return res.status(400).json({message:"Not appoiment created"});
    }
    return res.json(
        Object.assign({},{message:true},newappoimentfullfiled.rows[0])
    );
});


module.exports = {
    getAllAppoimentsFullfiled,
    createAppoimentFullfiled,
    getUserAppoimentsFullfiled,
    getOneAppoimentFullfiled
}