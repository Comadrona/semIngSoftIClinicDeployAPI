const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const pool = require('../database/db')

//@desc Get all users
//@route get /users
//@access private
const getAllUsers = asyncHandler(async(req,res)=>{
    
    const users = await pool.query(`
    SELECT user_id,username,correo,celular,administrador,name 
    FROM users 
    ORDER BY
	    CASE WHEN correo IS NULL THEN 1
	    ELSE 0
	END,
	name;`);
    if(!users.rows){
        return res.status(400).json({message:"Not users found"});
    }
    res.json(users.rows);
});
//@desc Get all basic users
//@route get /users/basic
//@access private
const getAllBasicUsers = asyncHandler(async(req,res)=>{
    const users = await pool.query("SELECT user_id, username,correo,celular,administrador,name FROM users WHERE administrador = false AND users.correo IS NOT NULL ");
    if(!users.rows){
        return res.status(400).json({message:"Not users found"});
    }
    res.json(users.rows);
});
//@desc Get all admin users
//@route get /users/admin
//@access private
const hasClinicProfile = asyncHandler(async(req,res)=>{
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
    return res.json(
        Object.assign({},{message:true},clinicalProfile.rows[0])
    );

});
const getAllAdminUsers = asyncHandler(async(req,res)=>{
    
    const users = await pool.query("SELECT user_id, username,correo,celular,administrador,name FROM users WHERE administrador = true AND users.correo IS NOT NULL ");
    if(!users.rows){
        return res.status(400).json({message:"Not users found"});
    }
    res.json(users.rows);
});
//@desc Get one user
//@route get /users/unique
//@access private
const getOneUser = asyncHandler(async(req,res)=>{
    const {id} = req.body;
    const user = await pool.query("SELECT user_id, username,correo,celular,administrador,name FROM users WHERE user_id = $1",[id]);
    if(user.rowCount===0){
        return res.status(408).json({message:"Not found"});
    }
    if(user.rows[0].correo === null)return res.status(401).json({message:"User not available"});
    return res.json(
        Object.assign({},{message:true},user.rows[0])
    );;
});
//@desc Create new user
//@route POST /users
//@access public
const createUser = asyncHandler(async(req,res)=>{
    const {username,password,name,administrador,celular,correo}=req.body;
    if(!username || !password || !name || !celular || !correo || typeof administrador !== 'boolean'){
        return res.status(400).json({message:'All fields are required'});
    }
    else{
        const duplicate = await pool.query("SELECT * FROM users WHERE username = $1 OR correo = $2",[username,correo]);
        if(duplicate.rowCount){
            return res.status(400).json({message:'Username o  correo en uso'});
        }
        const hashedPwd = await bcrypt.hash(password, 10)
        const newuser = await pool.query(
            "INSERT INTO users(username,password,correo,celular,administrador,name) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
            [username,hashedPwd,correo,celular,administrador,name]
        );
        if(!newuser.rows){
            return res.status(400).json({message:"Not user created"});
        }
        return res.json(
            Object.assign({},{message:true},newuser.rows[0])
        );
    }
    
});

//@desc Update a user
//@route PATCH /users
//@access private
const updateUser = asyncHandler(async(req,res)=>{
    const {id,username,password,name,celular,correo}=req.body;
    if(!id || !username || !password || !name || !celular || !correo){
        return res.status(400).json({message:'All fields are required'});
    }
    const user = await pool.query("SELECT * FROM users WHERE user_id = $1",[id]);
    if(user.rowCount === 0){
        return res.status(400).json({message:'User not found'});
    }
    const duplicate = await pool.query("SELECT * FROM users WHERE (username = $1 AND user_id!=$3) OR (correo = $2 AND user_id!=$3);",[username,correo,id]);
    if(duplicate.rowCount){
        return res.status(400).json({message:'Username o  correo en uso'});
    }
    let querystr;
    let datatosend;
    if(password==='-*-*-*'){
        querystr="UPDATE users SET username = $1, correo = $2 , celular = $3, name = $4 WHERE user_id = $5 RETURNING *;";
        datatosend=[username,correo,celular,name,id];
    }else{
        querystr="UPDATE users SET username = $1,password = $2 , correo = $3 , celular = $4, name = $5 WHERE user_id = $6 RETURNING *;";
        const hashedPwd = await bcrypt.hash(password, 10)
        datatosend = [username,hashedPwd,correo,celular,name,id];
    }
    const updateuser = await pool.query(querystr,datatosend);
    if(!updateuser.rows){
        return res.status(400).json({message:"Not user updated"});
    }
    return res.json(
        Object.assign({},{message:'user updated'},updateuser.rows[0])
    );
});

//@desc Delete a user
//@route Delete /users
//@access private
const deleteUser = asyncHandler(async(req,res)=>{
    const {id}=req.body;
    const user = await pool.query("SELECT * FROM users WHERE user_id = $1",[id]);
    if(user.rowCount === 0){
        return res.status(400).json({message:'User not found'});
    }
    const deleteUser = await pool.query(
        "UPDATE users SET  correo = $1 , celular = $2 WHERE user_id = $3 RETURNING *",
        [null,null,id]
    );
    if(deleteUser.rowCount===0){
        return res.status(400).json({message:"Not user deleted"});
    }
    return res.json(
        Object.assign({},{message:true},deleteUser.rows[0])
    );
});
const activateUser = asyncHandler(async(req,res)=>{
    const {user_id,telefono,correo}=req.body;
    const user = await pool.query("SELECT * FROM users WHERE user_id = $1",[user_id]);
    if(user.rowCount === 0){
        return res.status(400).json({message:'User not found'});
    }
    const duplicate = await pool.query("SELECT * FROM users WHERE (correo = $1 AND user_id!=$2)",[correo,user_id]);
    if(duplicate.rowCount){
        return res.status(400).json({message:'Correo en uso'});
    }
    const activateuser = await pool.query(
        "UPDATE users SET  correo = $1 , celular = $2 WHERE user_id = $3 RETURNING *",
        [correo,telefono,user_id]
    );
    if(activateuser.rowCount===0){
        return res.status(400).json({message:"Not user updated"});
    }
    return res.json(
        Object.assign({},{message:true},activateuser.rows[0])
    );
})
module.exports = {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    getOneUser,
    getAllBasicUsers,
    getAllAdminUsers,
    hasClinicProfile,
    activateUser
}