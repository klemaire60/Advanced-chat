const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const cookieParser = require('cookie-parser');
const mysql = require('mysql');

// Fichier de configuration des paramètres
const config = require('./config');

// Paramètres de la base de données
connection = mysql.createConnection({
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

// App principale
const app = express();

// Définition du limitateur de requêtes
const Limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limite chaque IP à 500 requêtes par fenêtre
    message: 'Trop de requêtes effectuées depuis cette IP, veuillez réessayer plus tard.',
});

// Utilisation des paramètres et modules définis précédemment
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(Limiter);

// Lancement du serveur
app.listen(config.port, () => {
    console.log('Serveur en écoute sur le port ', config.port);
})