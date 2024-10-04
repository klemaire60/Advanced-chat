const mysql = require('mysql');

// Paramètres de la base de données
const connection = mysql.createConnection({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name
});

// Connection à la BDD
connection.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données :', err);
        throw err;
    }
    console.log('Connecté à la base de données MySQL');
});

// Export de la connexion à la BDD pour l'utiliser dans le projet 
module.exports = connection;