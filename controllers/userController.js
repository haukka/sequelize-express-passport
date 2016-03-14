var models = require("../models");
var passport = require('passport');

exports.findAll = function(req, res) {
    models.User.findAll()
	.then(function(users) {
	    console.log(users);
	    res.render('index', {title: 'express', user: users});
	}).catch(function(err){
	    res.send(err);
	});
}

exports.create = function(req, res) {
    models.User.findAndCountAll(
	{ where: {email: req.body.email}}
    ).then(function(result) {
	if (result.count == 0) {
	    models.User.create({
		email: req.body.email,
		password:req.body.password})
		.then(function(user) {
		    req.login(user, function(err) {
			if (err) return next(err);
			return res.redirect('/users');
		    });
		}).catch(function(err){
		    res.send(err);
		});
	} else {
	    res.send({message: "ce compte existe déjà"});
	}
    }).catch(function(err) {
	res.send(err);
    });
}

exports.findOne = function(req, res) {
    models.User.findOne(
	{where: {id: req.params.id}}).then(function(user) {
	    console.log(user);
	    res.render('index', {user: user});
	}).catch(function(err){
	    res.send(err);
	});
}

exports.Update = function(req, res) {
    console.log(req.body);
    models.User.update({username: req.body.username},{
	where: {id: req.params.id}}).then(function(user){
	    res.send({message: 'ca marche'});
	}).catch(function(err){
	    res.send({message: 'error'});
	});
}

exports.Delete = function(req, res ) {
    models.User.destroy({
	where: {
	    id: req.params.id
	}
    }).then(function() {
	res.redirect('/');
    }).catch(function(err){
	res.send(err);
    });
}
