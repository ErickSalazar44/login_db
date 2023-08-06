const EmailCode = require("./EmailCode");
const User = require("./User");
//? un usuario puede tener un unico codigo de verificacion
// EmailCode -> userId
User.hasOne(EmailCode); // userId
EmailCode.belongsTo(User); // emailCode tiene muchos usuarios
