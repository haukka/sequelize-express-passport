var express = require('express');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var router = express.Router();
var models = require('../models');

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


module.exports = router;
