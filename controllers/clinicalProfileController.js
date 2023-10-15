const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const pool = require('../database/db')

//@desc Get all appoiments
//@route get /appoiment
//@access private
const getAllClinicalProfiles = asyncHandler(async(req,res)=>{
    const sql="SELECT clinicalprofile.*,users.name AS USERNAME,users.correo,users.celular FROM clinicalprofile JOIN users ON clinicalprofile.user_id = users.user_id WHERE clinicalprofile.preferenciashorario IS NOT NULL; "
    const clinicalProfile = await pool.query(sql);
    
    if(clinicalProfile.rowCount ===0){
        return res.status(400).json({message:"Not clinical info found"});
    }
    res.json(clinicalProfile.rows);
});
const getUserClinicalProfile = asyncHandler(async(req,res)=>{
    const {userid} = req.body;
    const user = await pool.query("SELECT * FROM users WHERE user_id = $1",
    [userid]);
    if(user.rowCount===0){
        return res.status(400).json({message:'No existe el usuario'});
    }else if(user.rows[0].correo === null){
        return res.status(401).json({message:'El usuario no esta disponible'});
    }else if(user.rows[0].administrador){
        return res.status(401).json({message:'El usuario no puede tener un perfil clinico'});
    }

    const sql="SELECT clinicalprofile.*,users.name AS USERNAME,users.correo,users.celular FROM clinicalprofile JOIN users ON clinicalprofile.user_id = users.user_id"
    const clinicalProfile = await pool.query(sql + " WHERE clinicalprofile.user_id = $1 AND clinicalprofile.preferenciashorario IS NOT NULL;",[userid]);
    if(clinicalProfile.rowCount ===0){
        return res.status(400).json({message:"Clinical profile not found"});
    }
    res.json(clinicalProfile.rows);
});
const getOneClinicalProfile = asyncHandler(async(req,res)=>{
    const {id} = req.body;
    const sql="SELECT clinicalprofile.*,users.name AS USERNAME,users.correo,users.celular FROM clinicalprofile JOIN users ON clinicalprofile.user_id = users.user_id"
    const clinicalProfile = await pool.query(sql + " WHERE clinicalprofile_id = $1",[id]);
    if(clinicalProfile.rowCount ===0){
        return res.status(400).json({message:"Not found"});
    }
    res.json(clinicalProfile.rows);
});
//@desc Create new appoiment
//@route POST  /appoiment
//@access public
const createClinicalProfile = asyncHandler(async(req,res)=>{
    const {user_id,curp,fechanacimiento,peso,estatura,tiposangre,enfermedades,nss,preferenciahorario}=req.body;
    if(!curp || !user_id || !fechanacimiento || !peso || !estatura || !tiposangre || !enfermedades || !nss || !preferenciahorario){
        return res.status(400).json({message:'All fields are required'});
    }
    const user = await pool.query("SELECT * FROM users WHERE user_id = $1",
    [user_id]);
    if(user.rowCount===0){
        return res.status(400).json({message:'No existe el usuario'});
    }else if(user.rows[0].correo === null){
        return res.status(401).json({message:'El usuario no esta disponible'});
    }else if(user.rows[0].administrador){
        return res.status(401).json({message:'El usuario no puede tener un perfil clinico'});
    }
    const sql="SELECT * FROM clinicalprofile WHERE clinicalprofile.user_id = $1;"

    const clinicalprofileavailable = await pool.query(sql,[user_id]);
    
    if(clinicalprofileavailable.rowCount !== 0){
        return res.status(401).json({message:'El usuario ya cuenta con un perfil clinico'});
    }
    
    const newclinicalprofile = await pool.query(
        "INSERT INTO clinicalprofile(user_id,curp,fechanacimiento,peso,estatura,tiposangre,enfermedades,nss,preferenciashorario) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *",
        [user_id,curp,fechanacimiento,peso,estatura,tiposangre,enfermedades,nss,preferenciahorario]
    );
    if(newclinicalprofile.rowCount === 0){
        return res.status(400).json({message:"Not clinical profile created"});
    }
    
    return res.json(
        Object.assign({},{message:true},newclinicalprofile.rows[0])
    );
    
});

//@desc Update an appoiment
//@route PATCH /appoiment
//@access private
const updateClinicalProfile = asyncHandler(async(req,res)=>{
    const {clinicalprofile_id,curp,fechanacimiento,peso,estatura,tiposangre,enfermedades,nss,preferenciahorario}=req.body;
    if(!curp || !clinicalprofile_id || !fechanacimiento || !peso || !estatura || !tiposangre || !enfermedades || !nss || !preferenciahorario){
        return res.status(400).json({message:'All fields are required'});
    }
    const clinicalProfile = await pool.query("SELECT * FROM clinicalprofile WHERE clinicalprofile_id = $1",[clinicalprofile_id]);
    if(clinicalProfile.rowCount ===0){
        return res.status(400).json({message:"Not found"});
    }
    
    const updateclinicalprofile = await pool.query(
        "UPDATE clinicalprofile SET curp = $1, fechanacimiento = $2, peso = $3, estatura = $4, tiposangre = $5, enfermedades = $6, nss = $7, preferenciashorario = $8 WHERE clinicalprofile_id = $9 RETURNING *;",
        [curp,fechanacimiento,peso,estatura,tiposangre,enfermedades,nss,preferenciahorario,clinicalprofile_id]
    );
    if(updateclinicalprofile.rowCount === 0){
        return res.status(400).json({message:"Not clinical profile updated"});
    }
    
    return res.json(
        Object.assign({},{message:true},updateclinicalprofile.rows[0])
    );
});

//@desc Delete an appoiment
//@route Delete /appoiment
//@access private
const deleteClinicalProfile = asyncHandler(async(req,res)=>{
    const {clinicalprofile_id}=req.body;
    if(!clinicalprofile_id ){
        return res.status(400).json({message:'All fields are required'});
    }
    const clinicalProfile = await pool.query("SELECT * FROM clinicalprofile WHERE clinicalprofile_id = $1",[clinicalprofile_id]);
    if(clinicalProfile.rowCount ===0){
        return res.status(400).json({message:"Not found"});
    }
    
    const deleteclinicalprofile = await pool.query(
        "UPDATE clinicalprofile SET preferenciashorario = $1 WHERE clinicalprofile_id = $2 RETURNING *;",
        [null,clinicalprofile_id]
    );
    if(deleteclinicalprofile.rowCount === 0){
        return res.status(400).json({message:"Not clinical profile deleted"});
    }
    
    res.json(deleteclinicalprofile.rows);
});

module.exports = {
    getAllClinicalProfiles,
    createClinicalProfile,
    updateClinicalProfile,
    deleteClinicalProfile,
    getUserClinicalProfile,
    getOneClinicalProfile
}