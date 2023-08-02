const isLogin = async (req, res, next) => {
  try {
    if (req.session.user_id && req.session.is_admin === 0) {
      next();
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const isLogout = async (req, res, next) => {
  try {
    if (req.session.user_id && req.session.is_admin === 0) {
      res.redirect("/home");
    }
    else{
      next();
    }
    
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  isLogin,
  isLogout,
};
