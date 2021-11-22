const express = require('express');
const app = express();
const multer = require('multer');
const fs = require("fs");
const path = require("path");

require('dotenv').config()

if (process.env.NODE_ENV === 'deployment') {
    if (!fs.existsSync('./images')) {
        fs.mkdir(
            path.join(__dirname, 'images'), (err) => {
                if (err) {
                    return console.log(err);
                }
                console.log('Directory created successfully!');
            })
    }

}
const PORT = process.env.PORT;

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', ['*']);
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use(express.json());
app.use(express.urlencoded({extended: false, limit: '50mb'}))

const fileStorage = multer.diskStorage(
    {
        destination: function (req, file, cb) {
            cb(null, 'images')
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname)
        }
    }
);

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true)
    } else {
        cb(null, false)
    }
}

app.use(multer({
    storage: fileStorage, fileFilter: fileFilter
}).single('images'))

const userRoutes = require('./src/routes');

app.use('/ml', userRoutes);

const main = app.listen(process.env.PORT, err => {
    if (err) console.log(err);
    console.log(`⚡ Connected to http://localhost:${PORT} ⚡`)
});

module.exports = main
