const jwt = require("jsonwebtoken");
require("dotenv").config();

// verificar si el token es correcto o no
const verifyJwt = (req, res, next) => {
    //busca el token
    const authHeader = req.headers.authorization || req.headers.Authorization;

    // si no es correcto retorna 401
    if (!authHeader?.startsWith("Bearer ")) return res.sendStatus(401);
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
        if (err) return res.sendStatus(403);

        // req.user -> datos decodificados
        req.user = decoded.user;
        next();
    });
};

module.exports = { verifyJwt };
