const isLogin = async (req, res, next) => {
  try {
    if (req.session.user_id && req.session.is_admin === 1) {
      next();
    } else {
      res.redirect("/admin");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const isLogout = async (req, res, next) => {
  try {
    if (req.session.user_id && req.session.is_admin === 1) {
      res.redirect("/admin/home");
    }

    next();
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  isLogin,
  isLogout,
};
