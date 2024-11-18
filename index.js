let express = require("express");

let app = express();

let path = require("path");

const port = 5000;

app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

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
app.get("/", (req, res) =>  // this IS a Route, with an arrow function inside
{
    // knec is the libaray that connets to database
    // this query vvv      if it works sends the result of this query to this variable
    knex.select().from('pokemon').orderBy('description').then( pokes => {
        // response.render  then er pass it a key and a value
        res.render("index", { pokemon: pokes });
    }).catch(err => {  // this is just incase of an error
        console.log(err);
        res.status(500).json({err});
    });
});




//################################### trying to make the css work ###################################################
// using app.use to serve up static CSS files in public/assets/ folder when /public link is called in ejs files
// app.use("/route", express.static("foldername"));
app.use('views', express.static('views'));


app.listen( port, () => console.log("Listening"));