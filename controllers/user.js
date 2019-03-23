const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const serverURL = "https://sangeet-test-node.herokuapp.com";
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sagar02501@gmail.com',
    pass: 'gccmcjbllzimtmdq'
  }
});

exports.createUser = async (req, res, next) => {

  // try {
  //   const emailToken = jwt.sign(
  //       { userId: 'u123' },
  //       "some_key_for_mail",
  //       { expiresIn: '1h' });

  //   const url = `http://localhost:1234/confirmation/${emailToken}`;

  //   await transporter.sendMail({
  //       to: 'sagar02501@gmail.com',
  //       subject: 'Confirm Email',
  //       html: `Please click this link to confirm your email: <a href="${url}">${url}</a>`
  //     });

  // } catch(e) {
  //   console.log("error: ",e);
  // }

  bcrypt.hash(req.body.password, 10)
    .then(hash => {
      const user = new User({
        email: req.body.email,
        password: hash
      });
      user.save()
       .then(result => {
        jwt.sign(
          { userId: result._id },
          process.env.EMAIL_KEY,
          { expiresIn: '1h' },
          (err, emailToken) => {
            const url = `${serverURL}/api/user/confirmation/${emailToken}`;
            transporter.sendMail({
              to: 'sagar02501@gmail.com',
              subject: 'Confirm Email',
              html: `Please click this link to confirm your email: <a href="${url}">${url}</a>`
            });
            console.log("mail sent");
          },
        );

         res.status(200).json({
           message: 'User Created!',
           result: result
         });
       })
       .catch(err => {
        res.status(500).json({
            message: 'Invalid Authentication credentials!'
        });
       });
    });
}

exports.userLogin = (req, res, next) => {
  let fetchedUser;
  User.findOne( {email: req.body.email} )
    .then(user => {
      if (!user) {
        return res.status(401).json({
          message: "Auth failed!"
        });
      }
      fetchedUser = user;
      if(!user.confirmed) return -1;
      return bcrypt.compare(req.body.password, user.password);
    })
    .then(result => {
      if (!result) {
        return res.status(401).json({
          message: "Auth failed!"
        });
      }
      if (result == -1) {
        return res.status(401).json({
          message: "Please verify your email!"
        });
      }

      const token = jwt.sign(
        {email: fetchedUser.email, userId: fetchedUser._id},
        process.env.JWT_KEY,
        { expiresIn: '1h' }
        );
        res.status(200).json({
          token: token,
          expiresIn: 3600,
          userId: fetchedUser._id
        });
    })
    .catch(err => {
      return res.status(401).json({
        message: "Invalid Authentication credentials!"
      });
    })
}

exports.confirmation = (req, res, next) => {
    const user = jwt.verify(req.params.token, process.env.EMAIL_KEY);
    const userId = user.userId;
    User.updateOne({ _id: userId}, {confirmed: true}).then(
      result => {
        if ( result.n > 0 ) {
          res.send('<div style="text-align: center"><h1>Email verified successfully<h1><a href="http://localhost:1234/auth/login">Click here to login</a><div>');
        // return res.redirect('http://localhost:1234/auth/login');
        }
        else {
          res.status(401).json({message: 'Not Authorized!' });
        }
      }
    )
    .catch(err => {
      res.status(500).json({
        message: 'Could not update user!'
      });
    })
}
