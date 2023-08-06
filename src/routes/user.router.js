const {
    getAll,
    create,
    getOne,
    remove,
    update,
    verifyUser,
    login,
    logged,
    resetPassword,
    updatePassword,
} = require("../controllers/user.controllers");
const express = require("express");
const { verifyJwt } = require("../utils/verify");

const routerUser = express.Router();

// ruta protegida
routerUser.route("/").get(verifyJwt, getAll).post(create);

routerUser.route("/login").post(login);

//! reset password
routerUser.route("/reset_password").post(resetPassword);

// ruta protegida
routerUser.route("/me").get(verifyJwt, logged);

routerUser.route("/verify/:code").get(verifyUser);

routerUser.route("/reset_password/:code").post(updatePassword);

// ruta protegida
routerUser
    .route("/:id")
    .get(verifyJwt, getOne)
    .delete(verifyJwt, remove)
    .put(verifyJwt, update);

module.exports = routerUser;
