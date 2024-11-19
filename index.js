let express = require("express");

let app = express();

let path = require("path");

const port = 4500;

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

app.get('/login', (req, res) => {
    res.render('login'); // This looks for 'views/login.ejs'
});

app.get('/admin', (req, res) => {
    res.render('admin'); // This looks for 'views/login.ejs'
});

app.use(express.urlencoded({extended: true})); // get the fata from the forms
// post = erq.body
//get  = req.query
//    = reg.params


// SUMMON THE CSS
app.use(express.static(__dirname + '/views'));


const knex = require("knex") ({      // this is our connnection string
    client : "pg",
    connection : {
        host : "localhost",
        user : "postgres",
        password : "admin",
        database : "assignment3",
        port : 5432
    }
});




// ########################### THIS IS FROM THE POKEMON ASSIGNMENT 3 ########################
// My ROUTE
// this is a route URL
app.get('/', (req, res) => {
    res.render('index');
});

// Handle Login
app.get('/login', (req, res) => {
    const { email, password } = req.query;

    // Query the database to find a user with the provided email and password
    db.select().from('users').where({ email, password }).first()
    .then(user => {
        if (user) {
            res.send('Login successful!');
        } else {
            res.send('Invalid email or password.');
        }
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({ err });
    });
});

// Handle Sign-Up
app.post('/signup', (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    // Insert the new user into the database
    db('users').insert({
        firstName,
        lastName,
        email,
        password
    })
    .then(() => {
        res.send('User registered successfully!');
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({ err });
    });
});





//################################### trying to make the css work ###################################################
// using app.use to serve up static CSS files in public/assets/ folder when /public link is called in ejs files
// app.use("/route", express.static("foldername"));
app.use('views', express.static('views'));


app.listen( port, () => console.log("Listening"));