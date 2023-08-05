const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const randormstring = require('randomstring');
const config = require('../config/config')

const securePassword = async(password)=>{

    try{

        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash

    }catch(error){
        console.log(error.message);
    }
}

const loadRegister = async(req,res)=>{
    try{

        res.render('registration')

    }catch(error){
        console.log(error.message);
    }
}

//for send mail

const sendVerifyMail = async(name,email,user_id)=>{

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
            subject:'For Verification mail',
            html:'<p>Hi..'+name+', Please click here to <a href="http://localhost:3000/verify?id='+user_id+' "> verify </a> your mail.</p>'
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

//for reset password send mail

const sendResetPasswordMail = async(name,email,token)=>{

    try{

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
            subject:'For Reset Password',
            html:'<p>Hi..'+name+', please click here to <a href="http://localhost:3000/forget-password?token='+token+' "> Reset </a> your password...</p>'
        }
        transporter.sendMail(mailOptions,function(error,info){
            if(error){
                console.log(error);
            }else{
                console.log("Email has been sent:- ",info.response);
            }
        })


    }catch(error){
        console.log(error.message);
    }
}


const insertUser = async(req,res)=>{
    try{
        const spassword = await securePassword(req.body.password);
        const user = new User({
            name:req.body.name,
            email:req.body.email,
            mobile:req.body.mno,
            image:req.file.filename,
            password:spassword,
            is_admin:0
        });

        const userData = await user.save();

        if(userData){
            sendVerifyMail(req.body.name,req.body.email,userData._id);
            res.render('registration',{message:'Your registration has been successfully completed...Plese verify your mail.' })
        }
        else{
            res.render('registration',{message:'Your registration failed...' })
        }
    }catch(error){
        console.log(error.message);
    }
}

const verifyMail = async(req,res)=>{

    try{

        const updateInfo = await User.updateOne({_id:req.query.id},{$set:{is_verified:1}})

        console.log(updateInfo);
        res.render("email-verified")
    }catch(error){
        console.log(error.message);
    }
}

// login user methods statred

const loginLoad  = async(req,res)=>{
    console.log("At Login page: "+req.session.user_id);
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

        const userData = await User.findOne({email:email});

        if(userData){

            const passwordMatch = await bcrypt.compare(password,userData.password)
            if(passwordMatch){
                if(userData.is_verified === 0 ){
                    if(userData.is_admin === 1){
                        res.render('login',{message:"Email and Password are incorrect"})
                    }
                    else{
                        res.render('login',{message:"Please verify your mail.."})
                    }
                    
                }
                else{
                    req.session.user_id = userData._id;
                    req.session.is_admin  = userData.is_admin;
                    res.redirect('/home')
                    console.log("Session created: "+req.session.user_id)
                }

            }
            else{
                res.render('login',{message:"Email and Password are incorrect"})
            }
        }
        else{
            res.render('login',{message:"Email and Password are incorrect"})
        }


    }catch(error){
        console.log(error.message);
    }
}

const loadHome = async(req,res)=>{
    try{

        const userData = await User.findById({_id:req.session.user_id})

        res.render('home',{user:userData})

    }catch(error){
        console.log(error.message);
    }
}

const userLogout = async(req,res)=>{
    console.log("Entering userLogout function");

    try{
        req.session.destroy(); 
        res.redirect('/');

    }catch(error){
        console.log(error.message);
    }
}

//forget password code start

const forgetLoad = async(req,res)=>{

    try{
        res.render('forget')

    }catch(error){
        console.log(error.message);
    }
}

const forgetVerify = async(req,res)=>{

    try{

        const email = req.body.email;
        const userData = await User.findOne({email:email});
        if(userData){
            
            if(userData.is_verified===0){
                res.render('forget',{message:"Please verify your mail..."})
            }else{
                const randomstring = randormstring.generate();
                const updatedData = await User.updateOne({email:email},{$set:{token:randomstring}})
                sendResetPasswordMail(userData.name,userData.email,randomstring);
                res.render('forget',{message:"Please check your mail to reset password"})
            }

        }else{
            res.render('forget',{message:"User Email is Invalid..."})
            
        }


    }catch(error){
        console.log(error.message);
    }
}

const forgetPasswordLoad = async(req,res)=>{
    try{

        const token = req.query.token;
        const tokenData = await User.findOne({token:token});
        if(tokenData){
            res.render('forget-password',{user_id:tokenData._id});

        }else{
            res.render('404',{message:"Token is Invalid..."})
        }
    }catch(error){
        console.log(error.message);
    }
}

const resetPassword = async(req,res)=>{
    try{

        const password = req.body.password;
        const user_id = req.body.user_id;
        const secure_password = await securePassword(password);

        const updatedData = await User.findByIdAndUpdate({_id:user_id},{$set:{password:secure_password,token:''}})

        res.redirect('/');

    }catch(error){
        console.log(error.message);
    }
}

//for verification send mail link

const verificationLoad = async(req,res)=>{

    try{

        res.render('verification')

    }catch(error){
        console.log(error.message);
    }
}

const sendVerificationLink = async(req,res)=>{
    try{
        const email = req.body.email;
        const userData = await User.findOne({email:email});
        if(userData){

            sendVerifyMail(userData.name,userData.email,userData._id)

            res.render('verification',{message:"Verification Mail has Sent..."})

        }else{
            res.render('verification',{message:"This email not exist.."})
        }

    }catch(error){
        console.log(error.message);
    }
}

//user profile edit and update

const editLoad = async(req,res)=>{

    try{

        const id = req.query.id;
        const userData = await User.findById({_id:id});
        if(userData){
            res.render('edit',{user:userData});
            
        }else{
            res.render('home');
        }

    }catch(error){
        console.log(error.message);
    }
}

const updateProfile = async(req,res)=>{

    try{

        if(req.file){
            const userData = await User.findByIdAndUpdate({_id:req.body.user_id},{$set:{name:req.body.name, email:req.body.email, mobile:req.body.mno, image:req.file.filename}})

        }else{
            const userData = await User.findByIdAndUpdate({_id:req.body.user_id},{$set:{name:req.body.name, email:req.body.email, mobile:req.body.mno}})
        }

        res.redirect('/home');

    }catch(error){
        console.log(error.message);
    }
}

module.exports = {
    loadRegister,
    insertUser,
    verifyMail,
    loginLoad,
    verifyLogin,
    loadHome,
    userLogout,
    forgetLoad,
    forgetVerify,
    forgetPasswordLoad,
    resetPassword,
    verificationLoad,
    sendVerificationLink,
    editLoad,
    updateProfile
}