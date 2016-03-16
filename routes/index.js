var express = require('express');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var nodemailer = require('nodemailer');
var crypto = require('crypto');
var router = express.Router();
var bcrypt = require('bcrypt');
var models = require('../models');

var smtpTransport = nodemailer.createTransport('SMTP', {
    service: 'Gmail',
    auth: {
	user: 'your gmail',
	pass: 'your password'
    }
});

passport.use(new FacebookStrategy({
    clientID: 'Your_id',
    clientSecret: 'Your_fb_id_secret',
    callbackURL: 'http://localhost:3000/auth/facebook/callback',
    profileFields: ['id','email', 'displayName']
}, function(accessToken, refreshToken, profile, done) {
    models.User.findOrCreate({ where : { facebookId: profile.id}, 
	defaults: {
	    email: profile.emails[0].value, fbtoken: accessToken
	}})
        .spread(function(user, created) {
            if (created == true) {
                console.log(user.email + ' was created at - ' + created)
            } else {
                console.log(user.email + ' already exists')
            }
            return done(null, user)
        }).catch(function(err) {
	    return done(err);
	});
}));

passport.use(new LocalStrategy({usernameField: 'email', passwordField: 'password'}, function(username, password, done) {
    models.User.findOne({
	where: { email: username }
    }).then(function(user) {
	if (!user) {
            return done(null, false, { message: 'Cet utilisateur n\'existe pas'});
        }
	user.comparePassword(password, function (err, result) {
	    if (err || (result != true)) return done(null, false, { message: 'Le mot de passe est invalide'} );
	    return done(null, user);
	});
    }).catch(function(err) {
	return done(err);
    });
}));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  models.User.findOne({
      where: {id: id}
  }).then(function (user) {
      done(null, user);
  }).catch(function(err){
      done(null, err);
  });
});

router.get('/', function (req, res) {
    res.render('index', { user : req.user });
});

router.get('/register', function(req, res) {
    res.render('register', {});
});

router.post('/login', passport.authenticate('local', {
    successRedirect: '/users',
    failureRedirect: '/login',
    failureFlash: true
}));

router.get('/login', function(req, res) {
    res.render('login', { user : req.user , message: req.flash('error')});
});

router.get('/auth/facebook', passport.authenticate('facebook'));

router.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), function(req, res) {
    res.redirect('/users');
});

router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

router.get('/forgot', function(res, res){
    res.render('forgot', {});
});

router.post('/forgot', function(req, res, next) {
    models.User.findOne({where: {email: req.body.email }})
	.then(function(user) {
	    user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
	    user.resetPasswordExpires = Date.now() + 3600000;
	    user.save().then(function(userToken) {
		var mailOptions = {
		    to: userToken.email,
		    from: "reset@gmail.com",
		    subject: 'Password Reset',
		    text: 'Vous recevez ce mail car vous avez demander à réinitialiser votre mot de passe.\n\n' +
			'Cliquez sur le lien ci-dessous ou collez le dans votre navigateur pour completer le processus.\n\n' +
			'http://' + req.headers.host + '/reset/' + userToken.resetPasswordToken + '\n\n' +
			'Si vous n\'avez pas fait cette demande, ignorer ce mail et le mot de passe restera inchangé.\n'
		};
		smtpTransport.sendMail(mailOptions, function(err) {
		    if (err) {
			console.log(err);
		    } else
			console.log("mail envoyé");
		});
	    }).catch(function(err) {
		return res.redirect('/forgot');
	    });
	});
    res.redirect('/forgot');
});

router.get('/reset/:token', function(req, res) {
    models.User.findOne({
	where: {
	    resetPasswordToken: req.params.token,
	    resetPasswordExpires: { $gt: Date.now() }
	}}).then(function(user) {
	    res.render('reset', {
		user: req.user
	    });
	}).catch(function(err) {
	    console.log("Le token est invalide ou a expiré.");
	    return res.redirect('/forgot');
	});
});

router.post('/reset/:token', function(req, res) {
    models.User.findOne({
	where: {
	    resetPasswordToken: req.params.token,
	    resetPasswordExpires: { $gt: Date.now() }
	}}).then(function(user) {
	    user.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8));
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            user.save().then(function(newUser) {
		req.logIn(newUser, function(err) {
		    var mailOptions = {
			to: newUser.email,
			from: 'reset@gmail.com',
			subject: 'Mot de passe changé',
			text: 'Bonjour,\n\n' +
			    'Le mot de passe pour votre compte ' + newUser.email + ' vient d\'etre changé.\n'
		    };
		    smtpTransport.sendMail(mailOptions, function(err) {
			if (err) {
			    console.log(err);
			} else
			    console.log('mail envoyé');
		    });
		    res.redirect('/');
		});
	    }).catch(function(err) {
		console.log('password not saved');
	    });
	}).catch(function(err) {
            console.log("Le token est invalide ou a expiré2.");
            return res.redirect('back');
        });
});

module.exports = router;
