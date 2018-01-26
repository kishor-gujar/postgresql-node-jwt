const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const app = new express();

const passport = require('passport');
const passportJWT = require('passport-jwt');
const JwtStrategy = passportJWT.Strategy;
const ExtractJwt = passportJWT.ExtractJwt;
const parser = require('body-parser');
const knex = require('knex');
const knexDb = knex({  
    client: 'postgresql',
        connection: {
            database: 'programmingplace',
            user:     'king',
            password: 'toor', 
        }
 });
const bookshelf = require('bookshelf');
const securePassword = require('bookshelf-secure-password');
const db = bookshelf(knexDb);
db.plugin(securePassword);
const jwt = require('jsonwebtoken');

const User = db.Model.extend({
    tableName: 'users',
    hasSecurePassword: true
});

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.SECRET_OR_KEY
}

const Strategy = new JwtStrategy(opts, (payload, next) => {
    //TODO: GET USER FROM DB
    User.forge({ id: payload.id }).fetch().then( res => {
        next(null, res);
    });
});
passport.use(Strategy);
app.use(passport.initialize());
app.use(parser.urlencoded({
    extended: false
}));

app.use(parser.json());

app.get('/', (req, res) => {
    res.send("hello world");
});

app.post('/seedUser', (req, res, next) => {
    if(!req.body.email || !req.body.password) {
        return res.status(401).send('No fields');
    }
    User.forge({ email: req.body.email }).fetch().then(result => {
        if(result){
            return res.status(400).send('User with that email exists');
        }
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password
        });
    
        user.save().then(() => {
            res.send('ok'); 
        });
    });
});

app.post('/getToken', (req, res) => {
    if(!req.body.email || !req.body.password) {
        return res.status(401).send('No Fields');
    }
    User.forge({ email: req.body.email }).fetch().then(result => {
        if(!result){
            return res.status(400).send('User not Found');
        }
        result.authenticate(req.body.password).then(user => {
            const payload = { id: user.id };
            const token = jwt.sign(payload, process.env.SECRET_OR_KEY);
            res.send(token);
        }).catch(err => {
            return res.status(401).send({err: err});
        });
    });
});

app.get('/protected', passport.authenticate('jwt', { session: false }), (req, res) => {
    res.send('I\'m protected');
});
const PORT = process.env.PORT || 3000;
app.listen(PORT);