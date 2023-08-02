const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');
const config = require('../config/config');


const securePassword = async(password)=>{
    try{

        const passwordHash = await bcrypt.hash(password,10);
        return passwordHash;

    }catch(error){
        console.log(error.message);
    }
}

//for rest password sent mail
const sendResetPasswordMail = async(name,email,token)=>{

    try {

        const transporter = nodemailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:config.emailUser,
                pass:config.emailPassword
            },
            tls:{
                rejectUnauthorized:false
            }
        });
        const mailOptions = {
            from:config.emailUser,
            to:email,
            subject:'For Reset password',
            html:'<p>Hi..'+name+', please click here to <a href="http://localhost:3000/admin/forget-password?token='+token+' "> Reset </a> your password...</p>'
        }
        transporter.sendMail(mailOptions,function(error,info){
            if(error){
                console.log(error.message);
            }else{
                console.log("Email has been sent:- ",info.response);
            }
        })
        
    } catch (error) {
        console.log(error.message);
    }
}

//for send mail

const addUserMail = async(name,email,password,user_id)=>{

    try{

       const transporter =  nodemailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:config.emailUser,
                pass:config.emailPassword
            },
            tls:{
                rejectUnauthorized:false
            }
        })

        const mailOptions = {
            from:config.emailUser,
            to:email,
            subject:'Admin addede you. Please verify your mail',
            html:'<p>Hi..'+name+', Please click here to <a href="http://localhost:3000/verify?id='+user_id+' "> verify </a> your mail.</p>,<br><br> <b>Email:-</b> '+email+'<b>Password:-</b>'+password
        }
        transporter.sendMail(mailOptions, function(error,info){
            if(error){
                console.log(error);
            }
            else{
                console.log("Email hs been sent:- ",info.response);
            }
        })

    }catch(error){
        console.log(error.message);
    }
}

const loadLogin = async(req,res)=>{

    try{
        
        res.render('login');

    }catch(error){
        console.log(error.message);
    }
}

const verifyLogin = async(req,res)=>{

    try{

        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({email:email})
        if(userData){

            const passwordMatch = await bcrypt.compare(password,userData.password);

            if(passwordMatch){
                //if the user is not admin
                if(userData.is_admin === 0){
                    res.render('login',{message:"Email and Password are incorrect..."})
                }else{
                    req.session.user_id = userData._id;
                    req.session.is_admin  = userData.is_admin;
                    res.redirect('/admin/home');

                }
                
            }else{
                res.render('login',{message:"Email and Password are incorrect..."})
            }

        }else{
            res.render('login',{message:"Email and Password are incorrect..."})
        }

    }catch(error){
        console.log(error.message);
    }
}

const loadDashboard = async(req,res)=>{

    try{
        const userData = await User.findById({_id:req.session.user_id});
        res.render('home',{admin:userData});

    }catch(error){
        console.log(error.message);
    }
}

const logout = async(req,res)=>{

    try{

        req.session.destroy();
        
        res.redirect('/admin');

    }catch(error){
        console.log(error.message);
    }
}

const forgetLoad = async(req,res)=>{

    try{
        res.render('forget');
    }catch(error){
        console.log(error.message);
    }
}

const forgetVerify = async(req,res)=>{

    try{

        const email = req.body.email;
        const userData = await User.findOne({email:email})
        if(userData){
            if(userData.is_admin === 0){
                res.render('forget',{message:"Email is incorrect..."})
            }
            else{
                const randomString = randomstring.generate();
                const updatedData = await User.updateOne({email:email},{$set:{token:randomString}});
                sendResetPasswordMail(userData.name,userData.email,randomString);
                res.render('forget',{message:"Please chech your mail to reset password..."})
            }

        }else{
            res.render('forget',{message:"Email is incorrect..."})
        }

    }catch(error){
        console.log(error.message);
    }
}

const forgetPasswordLoad = async(req,res)=>{
    try {

        const token = req.query.token;

        const tokenData = await User.findOne({token:token});
        if(tokenData){
            res.render('forget-password',{user_id:tokenData._id});

        }else{
            res.render('404',{message:"Invalid link..."})
        }
        
    } catch (error) {
        console.log(error.message);
    }
}

const resetPassword = async(req,res)=>{

    try{

        const password = req.body.password;
        const user_id = req.body.user_id;

        const securePass = await securePassword(password);

        const updatedData = await User.findByIdAndUpdate({_id:user_id},{$set:{password:securePass,token:''}});
        res.redirect('/admin');

    }catch(error){
        console.log(error.message);
    }
}

const adminDashboard = async(req,res)=>{

    try {

        const userData = await User.find({is_admin:0})

        res.render('dashboard',{users:userData});
        
        
    } catch (error) {
        console.log(error.message);
        
    }
}

// Add new user work start
const newUserLoad =async(req,res)=>{
    try{

        res.render('new-user');

    }catch(error){
        console.log(error.message);
    }
}

const addUser = async(req,res)=>{

    try{

        const name = req.body.name;
        const email = req.body.email;
        const mno = req.body.mno;
        const image = req.file.filename;
        const password = randomstring.generate(8);

        const spassword = await securePassword(password);

        const user = new User({
            name:name,
            email:email,
            mobile:mno,
            image:image,
            password:spassword,
            is_admin:0
        });
        const userData = await user.save();

        if(userData){
            addUserMail(name,email,password,userData._id);
            res.rendirect('/admin/dashborad');

        }else{
            res.render('new-user',{message:"Something Wrong"});
        }

    }catch(error){
        console.log(error.message);
    }
}

//edit user functionality 
const editUserLoad = async(req,res)=>{
    try {
        const id = req.query.id;
        const userData = await User.findById({_id:id});
        if(userData){
            res.render('edit-user',{user:userData});
        }
       else{
        res.redirect('/admin/dashboard');
       }
        
    } catch (error) {
        console.log(error.message);
    }
}

const updateUsers = async(req,res)=>{
    try {

        const userData = await User.findByIdAndUpdate({_id:req.body.id},{$set:{name:req.body.name,email:req.body.email,mobile:req.body.mno,is_verified:req.body.verify}})
       
        res.redirect('/admin/dashboard');
        
    } catch (error) {
        console.log(error.message);
    }
}

//delete user
const deleteUser = async(req,res)=>{
    try {
        const id = req.query.id;
       await User.deleteOne({_id:id});
       res.redirect('/admin/dashboard');

    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    loadLogin,
    verifyLogin,
    loadDashboard,
    logout,
    forgetLoad,
    forgetVerify,
    forgetPasswordLoad,
    resetPassword,
    adminDashboard,
    newUserLoad,
    addUser,
    editUserLoad,
    updateUsers,
    deleteUser
}