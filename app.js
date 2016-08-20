var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');

var Multipass = require('atlas-node-multipass');
var apikey = '1234567890abcdef';
var sitekey = 'localhost';
var multipass = new Multipass(apikey, sitekey);

var passport = require('passport');
var passportLocal = require('passport-local');

var app = express();

app.set('view engine','ejs');

app.use(bodyParser.urlencoded({extended:false}));
app.use(cookieParser());
app.use(expressSession(
    {
        secret: process.env.SESSION_SECRET || 'secret',
        saveUninitialized:false,
        resave:false
    }));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new passportLocal.Strategy(function (username, password, done) {
   if(username == password){
       done(null, {id: username, name: username});
   }else{
       done(null,null);
   }
}));

passport.serializeUser(function (user, done) {
    done(null,user.id);
});

passport.deserializeUser(function (id, done) {
    //Query to database or cache here!
    done(null, {id: id, name: id});
});

function ensureAuthenticated(req,res,next){
    if (req.isAuthenticated()){
        next();
    }else{
        res.sendStatus(403);
    }
}

//routes
app.get('/', function (req, res) {
    res.render('index',{
        isAuthenticated: req.isAuthenticated(),
        user: req.user
    });
});

app.get('/login', function(req, res){
    res.redirect('http://localhost:8080/') ;
    //res.render('login');
});

/*app.post('/login',passport.authenticate('local'), function(req, res) {
    res.redirect('/');
});
*/
app.get('/auth/multipass/callback', passport.authenticate('local'), function (req, res) {

    var token = req.query.multipass;
    var obj = multipass.decode(token);
    //console.log(obj);
    res.redirect('/');
});


app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');   
});

app.get('/api/data',ensureAuthenticated, function (req, res) {
    res.json([
        {value: 'foo'},
        {value: 'bar'},
        {value: 'baz'}
    ])
});

var port = process.env.PORT || 8000;

app.listen(port, function(){
    console.log('http://127.0.0.1:'+port+'/');
});