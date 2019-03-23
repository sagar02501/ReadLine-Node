const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/users');

const app = express();

mongoose.connect("mongodb+srv://sangeet:"+process.env.MONGO_ATLAS_PW+"@cluster0-i7xyd.mongodb.net/"+process.env.DATABASE+"?retryWrites=true")
  .then(() => {
    console.log('Connected to database!');
  })
  .catch((err) => {
    console.log('Connection failed!', err);
  });

app.use(bodyParser.json());
// app.use(express.static('images'));
app.use('/images', express.static(path.join(__dirname, 'images')));
console.log("dir: ", __dirname);
// app.use('/images', express.static(path.join('/images')));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT, PATCH, OPTIONS');
  next();
});

app.use('/api/posts', postRoutes);
app.use('/api/user', userRoutes);

module.exports = app;
