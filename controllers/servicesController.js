const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const pool = require('../database/db')

//@desc Get all services
//@route get /services
//@access private
const getAllServices = asyncHandler(async(req,res)=>{
    
    const users = await pool.query("SELECT * FROM services WHERE services.preciosugerido IS NOT NULL");
    if(!users.rows){
        return res.status(400).json({message:"Not services found"});
    }
    res.json(users.rows);
});
//@desc Create a service
//@route PATCH /services
//@access private
const createService = asyncHandler(async(req,res)=>{
    const {nombre,descripcion,preciosugerido,duracion} = req.body;
    if(!nombre || !descripcion || !preciosugerido || !duracion){
        return res.status(400).json({message:'All fields are required'});
    }
    const newservice = await pool.query(
        "INSERT INTO services(nombre,descripcion,preciosugerido,duracion) VALUES($1,$2,$3,$4) RETURNING *",
        [nombre,descripcion,preciosugerido,duracion]
    );
    if(newservice.rowCount===0){
        return res.status(400).json({message:"Not service created"});
    }
    res.json(newservice.rows);
});
//@desc Update a service
//@route PATCH /services
//@access private
const updateService = asyncHandler(async(req,res)=>{
    const {service_id,nombre,descripcion,preciosugerido} = req.body;
    if(!service_id || !nombre || !descripcion || !preciosugerido){
        return res.status(400).json({message:'All fields are required'});
    }
    const service = await pool.query("SELECT * FROM services WHERE service_id = $1",[service_id]);
    if(service.rowCount === 0){
        return res.status(400).json({message:'Service not found'});
    }
    const updateservice = await pool.query(
        "UPDATE services SET nombre = $1,descripcion = $2 , preciosugerido = $3 WHERE service_id = $4 RETURNING *",
        [nombre,descripcion,preciosugerido,service_id]
    );
    if(updateservice.rowCount===0){
        return res.status(400).json({message:"Not service updated"});
    }
    return res.json(
        Object.assign({},{message:true},updateservice.rows[0])
    );
});

//@desc Delete a service
//@route Delete /services
//@access private
const deleteService = asyncHandler(async(req,res)=>{
    const {service_id} = req.body;
    if(!service_id){
        return res.status(400).json({message:'All fields are required'});
    }
    const service = await pool.query("SELECT * FROM services WHERE service_id = $1",[service_id]);
    if(service.rowCount === 0){
        return res.status(400).json({message:'Service not found'});
    }
    const updateservice = await pool.query(
        "UPDATE services SET preciosugerido = $1 WHERE service_id = $2 RETURNING *;",
        [null,service_id]
    );
    if(updateservice.rowCount===0){
        return res.status(400).json({message:"Not service deleted"});
    }
    return res.json(
        Object.assign({},{message:true},updateservice.rows[0])
    );
});

module.exports = {
    getAllServices,
    updateService,
    deleteService,
    createService
}