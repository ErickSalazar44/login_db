const catchError = require("../utils/catchError");
const User = require("../models/User");
const { verifyAccount } = require("../utils/verifyAccount");
const EmailCode = require("../models/EmailCode");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendEmailResetPassword } = require("../utils/sendEmailResetPassword");

const getAll = catchError(async (req, res) => {
    const results = await User.findAll({ where: { isVerified: true } });
    return res.json(results);
});

const create = catchError(async (req, res) => {
    // desestructuro del body
    const { email, firstName, frontBaseUrl } = req.body;
    // creo el usuario
    const result = await User.create(req.body);
    // genero un codigo
    const code = require("crypto").randomBytes(64).toString("hex");
    // ejecuto
    verifyAccount(email, firstName, frontBaseUrl, code);

    // EmailCode recibe code y el idUSER
    await EmailCode.create({ code, userId: result.id });

    return res.status(201).json(result);
});

const getOne = catchError(async (req, res) => {
    const { id } = req.params;
    const result = await User.findByPk(id);
    if (!result) return res.sendStatus(404);
    return res.json(result);
});

const remove = catchError(async (req, res) => {
    const { id } = req.params;
    const result = await User.destroy({ where: { id } });
    if (!result) return res.sendStatus(404);
    return res.sendStatus(204);
});

const update = catchError(async (req, res) => {
    const { id } = req.params;

    // eliminamos los elementos no actualizables
    delete req.body.password;
    delete req.body.isVerified;
    delete req.body.email;

    const result = await User.update(req.body, {
        where: { id },
        returning: true,
    });
    if (result[0] === 0) return res.sendStatus(404);
    return res.json(result[1][0]);
});

const verifyUser = catchError(async (req, res) => {
    // traemos el code de los parametros
    const { code } = req.params;
    // buscamos de EmailCode por la columna code
    const emailCode = await EmailCode.findOne({ where: { code } });

    // en el caso de que no exista
    if (!emailCode) return res.sendStatus(401);

    // actualizamos el valor de el usuario a isVerified = true
    const user = await User.update(
        { isVerified: true },
        { where: { id: emailCode.userId } }
    );

    if (user[0] === 0) return res.sendStatus(401);

    //? elimnamos el code de la base de datos (para que solo sea de un uso)
    await emailCode.destroy();

    // retornamos
    return res.json(user[1][0]);
});

const login = catchError(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    // si el usuario no existe
    if (!user) return res.sendStatus(401);

    // si el usuario no esta verificado
    if (!user.isVerified) return res.sendStatus(401);

    // comparamos si la password es igual a la password desencriptada
    const isValid = await bcrypt.compare(password, user.password);

    // en el caso que no sea igual retornamos un 401
    if (!isValid) return res.sendStatus(401);

    // asignamos un token al usuario
    // sign recibe el usuario, el token, y cuando expire
    const token = jwt.sign({ user }, process.env.TOKEN_SECRET, {
        expiresIn: "1d",
    });

    return res.json({ user, token });
});

const logged = catchError(async (req, res) => res.json(req.user));

const resetPassword = catchError(async (req, res) => {
    const { email, frontBaseUrl } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) return res.sendStatus(401);

    // generamos un codigo unico
    const code = require("crypto").randomBytes(64).toString("hex");
    console.log(code);
    // con esto enviamos el email para el reset de password
    sendEmailResetPassword(email, user.firstName, frontBaseUrl, code);

    await EmailCode.create({ code, userId: user.id });

    return res.json(user);
});

const updatePassword = catchError(async (req, res) => {
    const { code } = req.params;

    const emailCode = await EmailCode.findOne({ where: { code } });
    if (!emailCode) return res.sendStatus(401);

    const hashPassword = await bcrypt.hash(req.body.password, 10);

    const user = await User.update(
        { password: hashPassword },
        { where: { id: emailCode.userId }, returning: true }
    );
    if (user[0] === 0) return res.sendStatus(404);

    await emailCode.destroy();
    return res.json(user[1][0]);
});

module.exports = {
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
};
