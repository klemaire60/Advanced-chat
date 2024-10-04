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
const config = require('./config.json');

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

// Fonction pour vérifier les inputs pour éviter les injections SQL ou XSS
function containsInvalidChars(input) {
    const forbiddenChars = /['";<>]/; // Liste des caractères interdits
    return forbiddenChars.test(input); // Renvoie true si un des caractères est trouvé
}

app.post('/register', (req, res) => {
    const { mail, username, password } = req.body;
    if(!mail || !username || !password) return res.status(409).json({ message : "Un des champs est manquant" });
    
    let errorMessage ='';
    
    // Vérification de chaque champs
    if(containsInvalidChars(mail)) {
        errorMessage += "Le mail contient des caractères interdits. "
    }

    if(containsInvalidChars(username)) {
        errorMessage += "Le nom d'utilisateurs contient des caractères interdits. "
    }

    if(containsInvalidChars(password)) {
        errorMessage += "Le mot de passe contient des caractères interdits."
    }

    // Si un des champs contient un caractères interdits alors on renvoie la requête
    if(errorMessage !== "") {
        return res.status(401).json({ message : errorMessage });
    }

    const sqlVerif = 'SELECT idUser FROM user WHERE mail = ? OR username = ?'

    connection.query(sqlVerif, [mail, username], (err, result) => {
        if(err) { 
            console.error('Erreur lors de la requête sqlVerif\nErreur : \n', err);
            return res.status(500).json({ message : "Erreur lors de la création du compte" });
        }

        if(result.lenght > 0) {
            return res.status(401).json({ message : "Le mail est déjà utilisé "});
        }

        bcrypt.genSalt(10, (err, salt) => {
            if (err) {
                console.error("Erreur lors de la génération du sel Bcrypt\nErreur Bcrpt Salt:\n", err);
                return res.status(500).json({ message: "Erreur lors de la création du compte" });
            }

            bcrypt.hash(password, salt, (hashErr, hashedPassword) => {
                if(hashErr) {
                    console.error("Erreur lors du hachage du mot de passe\nErreur : \n", hashErr);
                    return res.status(500).json({ message : "Erreur lors de la création du compte" });
                }

                let token = jwt.sign(mail, config.jwtKey);

                const sqlNewUser = 'INSERT INTO user (username, mail, password, token) VALUES (?,?,?,?)';

                connection.query(sqlNewUser, [username, mail, hashedPassword, token], (err) => {
                    if(err) {
                        console.error("Erreur lors de la création du nouvel User\nErreur sql :\n", err);
                        return res.status(500).json({ message: "Erreur lors de la création du compte" });
                    }

                    res.cookie('userToken', token, {
                        httpOnly : true,
                        secure: false,
                        maxAge: 43200000
                    })
                    
                    return res.status(200).json({ message: "Compte créé avec succès" });
                })
            })
        })
    })
})

// Lancement du serveur
app.listen(config.port, () => {
    console.log('Serveur en écoute sur le port ', config.port);
})