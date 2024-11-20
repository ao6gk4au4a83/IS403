// Setup Stuff **
let express = require("express");
const { userInfo } = require("os");
let app = express();
let path = require("path");
const port = 4500;
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Get data from forms **
app.use(express.urlencoded({extended: true}));

// Connection to LOCAL database
const knex = require("knex") ({      
    client : "pg",
    connection : {
        host : "localhost",
        user : "postgres",
        password : "admin",
        database : "403Project",
        port : 5432
    }
});

// Routes naviagting to pages **
// Home/Index  page
app.get('/', (req, res) => {
  res.render('index');
});
// Login page ##### Do we need this and like 40?
app.get('/login', (req, res) => {
  res.render('login'); 
});

// Allow CSS **
app.use(express.static(__dirname + '/views'));

// ROUTES FOR LOGIN PAGE
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


// ROUTES FOR ADMIN PAGE(S) **
// Route to display user record page
app.get('/admin', (req, res) => {
    knex('users')
      .join('login', 'users.email', '=', 'login.email')
      .select(
        'users.email',
        'login.password',
        'users.first_name',
        'users.last_name',
        'users.phone',
      )
      .then(users => {
        // Render the admin.ejs user record template and pass the data
        res.render('admin', { users });
      })
      .catch(error => {
        console.error('Error querying database:', error);
        res.status(500).send('Internal Server Error');
      });
  });

  // Route to edit the individual users
  app.get('/editUser/:email', (req, res) => {
    let email = req.params.email;
    // Query the users by email first
    knex('login')
      .where('email', email)
      .first() // takes the single object in the array into an object without the array
      .then(user => {
        if (!user) {
          return res.status(404).send('User not found');
        }
        // Query all info after fetching the user
        knex('users')
          .select('email', 'first_name', 'last_name', 'phone')
          .then(userInfo => {
            // Render the edit form and pass both user and login
            res.render('editUser', { login, user });
          })
          .catch(error => {
            console.error('Error fetching user info:', error);
            res.status(500).send('Internal Server Error');
          });
      })
      .catch(error => {
        console.error('Error fetching user for editing:', error);
        res.status(500).send('Internal Server Error');
      });
  });
  
  // Route to post data back to the database
  app.post('/editUser/:email', (req, res) => {
    const email = req.params.email;
    // Access each value directly from req.body
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;
    const phone = req.body.phone; 
    // Update the user in the database
    knex('users')
      .where('email', email)
      .update({
        first_name: first_name,
        last_name: last_name,
        phone: phone,
      })
      .then(() => {
        res.redirect('/'); // Redirect to the list of users after saving
      })
      .catch(error => {
        console.error('Error updating user:', error);
        res.status(500).send('Internal Server Error');
      });
  });
  
  // Route to delete user accounts
  app.post('/deleteUser/:email', (req, res) => {
    const email = req.params.email;
    knex('users')
      .where('email', email)
      .del() // Deletes the record with the specified email
      .then(() => {
        res.redirect('/'); // Redirect to the user list after deletion
      })
      .catch(error => {
        console.error('Error deleting user:', error);
        res.status(500).send('Internal Server Error');
      });
  });




// DON'T PUT ANYTHING AFTER THIS!
app.listen( port, () => console.log("Listening"));