// Setup Stuff **
const { rejects } = require("assert");
let express = require("express");
// const { user } = require("os");
let session = require('express-session');
let bodyParser = require('body-parser');
let app = express();
let path = require("path");
const port = process.env.PORT || 4500;
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Middleware to check if a user is logged in
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/login');
}

// Get data from forms **
app.use(express.urlencoded({extended: true}));
app.use(express.json()); // from Chat "to parse JSON data"

// Connection to LOCAL database
const knex = require("knex") ({      
    client : "pg",
    connection : {
      host : process.env.RDS_HOSTNAME || "localhost",
      user : process.env.RDS_USERNAME || "postgres",
      password : process.env.RDS_PASSWORD || "admin",
      database : process.env.RDS_DB_NAME || "403Project",
      port : process.env.RDS_PORT || 5432,
      ssl: process.env.DB_SSL ? {rejectUnauthorized: false} : false
    }
});

// Routes naviagting to pages **
// Home/Index  page
app.get('/', (req, res) => {
  res.render('index');
});

// POLICY PAGE
app.get('/policy', (req, res) => {
  res.render('policy');
});

// PRICING PAGE
app.get('/pricing', (req, res) => {
  res.render('pricing');
});

// LOGIN PAGE
app.get('/login', (req, res) => {
  res.render('login');
});

// REVIEWS PAGE
app.get('/reviews', (req, res) => {
  knex('users')
    .join('reviews', 'users.email', '=', 'reviews.user_email')
    .select(
      'reviews.id',
      'users.email',
      'reviews.review_date',
      'reviews.rating',
      'reviews.comment',
    )
    .then(reviews => {
      // Render the admin_reviews.ejs review record template and pass the data
      res.render('reviews', { reviews });
    })
    .catch(error => {
      console.error('Error querying database:', error);
      res.status(500).send('Internal Server Error 6');
    });
});

// Allow CSS **
app.use(express.static(__dirname + '/views'));


// Handle login submission
app.post('/login', async (req, res) => {
  const { loginEmail, loginPassword } = req.body;
  console.log(loginEmail, "Please work");

  try {
    const user = await knex('login')
      .select('*')
      .where({ email: loginEmail, password: loginPassword }) // Simple check, no hashing
      .first();

    if (user) {
      req.session.user = user; // Store user data in session
      res.redirect('/admin');
    } else {
      res.send('Invalid credentials. <a href="/login">Try again</a>.');
    }
  } catch (error) {
    console.error("Error querying the database:", error.message);
    res.status(500).send("Internal Server Error 0.5");
  }
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
// DISPAY USERS
// Route for search bar
app.get('/search', async (req, res) => {
  const query = req.query.query;
  try {
      // Use Knex to fetch users where first_name or last_name matches the query
      const users = await knex('users')
          .where('first_name', 'ILIKE', `%${query}%`) // Case-insensitive match
          .orWhere('last_name', 'ILIKE', `%${query}%`);

      // Render the admin page and pass the matching users
      res.render('admin', { users });
  } catch (error) {
      console.error('Error executing search query:', error);
      res.status(500).send('Internal Server Error 1');
  }
});

// Route to display user record page
// please save right
app.get('/admin', isAuthenticated, (req, res) => {
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
        res.status(500).send('Internal Server Error 2');
      });
  });

// EDIT USERS
// Route to edit the individual users
app.get('/editUser/:email', isAuthenticated, (req, res) => {
    let email = req.params.email;
    console.log(email)
    // Query all info after fetching the user
    knex('users')
      .select('email', 'first_name', 'last_name', 'phone')
      .where('email', email)
      .first()
      .then(user => {
        if (!user){
          return res.status(404).send('User not found')
        }
        // Render the edit form and pass both user and login
        res.render('editUser', { user });
        })
          
      .catch(error => {
        console.error('Error fetching user info:', error);
        res.status(500).send('Internal Server Error 3');
        });
    });
  
// Route to post edits data back to the database
app.post('/editUser/:email', isAuthenticated, (req, res) => {
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
        res.redirect('/admin'); 
      })
      .catch(error => {
        console.error('Error updating user:', error);
        res.status(500).send('Internal Server Error 4');
      });
});
  
// DELETE USERS
// Route to delete user accounts
app.post('/deleteUser/:email', isAuthenticated, async (req, res) => {
  const email = req.params.email;

  try {
      await knex.transaction(async (trx) => {
          // First, delete all related reviews
          await trx('reviews')
              .where('user_email', email)
              .del();

          // Delete from users table
          await trx('users')
              .where('email', email)
              .del();

          // Then delete from login table
          await trx('login')
              .where('email', email)
              .del();
      });

      res.redirect('/admin');
  } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).send('Failed to delete user account');
  }
});


// ADD USERS
// Route to add user account
app.get('/addUser', isAuthenticated, (req, res) => {
  res.render('addUser')
});  

// Route to save new user to database
app.post('/addUser', isAuthenticated, (req, res) => {
  const { email, password, first_name, last_name, phone } = req.body;

  // Use Knex transaction
  knex.transaction(trx => {
      // Insert into login table
      return trx('login')
          .insert({ email, password })
          .then(() => {
              // Insert into users table
              return trx('users').insert({ email, first_name, last_name, phone });
          });
  })
  .then(() => {
      // Success: Redirect to admin page or any other appropriate page
      res.redirect('/admin');
  })
  .catch(error => {
      // Error handling: Rollback is automatic if anything fails within the transaction
      console.error('Error adding user with transaction:', error);
      res.status(500).send('Error adding user');
  });
});

// DISPLAY REVIEWS 
// Route to display review record page
app.get('/admin_reviews', isAuthenticated, (req, res) => {
  knex('users')
    .join('reviews', 'users.email', '=', 'reviews.user_email')
    .select(
      'reviews.id',
      'users.email',
      'reviews.review_date',
      'reviews.rating',
      'reviews.comment',
    )
    .then(reviews => {
      // Render the admin_reviews.ejs review record template and pass the data
      res.render('admin_reviews', { reviews });
    })
    .catch(error => {
      console.error('Error querying database:', error);
      res.status(500).send('Internal Server Error 6');
    });
});

// EDIT REVIEWS
// Route to edit the individual reviews
app.get('/editReview/:user_email', isAuthenticated, (req, res) => {
  let email = req.params.user_email;
  // Query the users by email first
  knex('reviews')
    .where('user_email', email)
    .first() // takes the single object in the array into an object without the array
    .then(review => {
      if (!review) {
        return res.status(404).send('Review not found');
      }
      res.render('editReview', { review });
      
    })
    .catch(error => {
      console.error('Error fetching user for editing:', error);
      res.status(500).send('Internal Server Error 7');
    });
});

// // Route to post data back to the database
app.post('/editReview/:user_email', isAuthenticated, (req, res) => {
  // Access each value directly from req.body
  const email = req.params.user_email;
  const comment = req.body.comment;
  const rating = req.body.rating; 
  // Update the user in the database
  knex('reviews')
    .where('user_email', email)
    .update({
      comment: comment,
      rating: rating,
    })
    .then(() => {
      res.redirect('/admin_reviews'); // Redirect to the list of reviews after saving
    })
    .catch(error => {
      console.error('Error updating review:', error);
      res.status(500).send('Internal Server Error 8');
    });
});

// DELETE REVIEWS
// Route to delete user accounts
app.post('/deleteReview/:user_email', isAuthenticated, (req, res) => {
  const email = req.params.user_email;
  knex('reviews')
    .where('user_email', email)
    .del() // Deletes the record with the specified email
    .then(() => {
      res.redirect('/admin_reviews'); // Redirect to the user list after deletion
    })
    .catch(error => {
      console.error('Error deleting user:', error);
      res.status(500).send('Internal Server Error 9');
    });
});




// DON'T PUT ANYTHING AFTER THIS!
app.listen( port, () => console.log("Listening"));