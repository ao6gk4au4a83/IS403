// Setup Stuff **
let express = require("express");
const { user } = require("os");
let app = express();
let path = require("path");
const port = process.env.PORT || 4500;
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

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
      port : process.env.RDS_PORT || 5432
    }
});

// Routes naviagting to pages **
// Home/Index  page
app.get('/', (req, res) => {
  res.render('index');
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
      res.status(500).send('Internal Server Error');
  }
});

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

// EDIT USERS
// Route to edit the individual users
app.get('/editUser/:email', (req, res) => {
    let email = req.params.email;
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
        res.status(500).send('Internal Server Error');
        });
    });
  
// Route to post edits data back to the database
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
        res.redirect('/admin'); 
      })
      .catch(error => {
        console.error('Error updating user:', error);
        res.status(500).send('Internal Server Error');
      });
});
  
// DELETE USERS
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

// ADD USERS
// Route to add user account
app.get('/addUser', (req, res) => {
  res.render('addUser')
});  

// Route to save new user to database
app.post('/addUser', (req, res) => {
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
app.get('/admin_reviews', (req, res) => {
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
      res.status(500).send('Internal Server Error');
    });
});

// EDIT REVIEWS
// Route to edit the individual reviews
app.get('/editReview/:id', (req, res) => {
  let id = req.params.id;
  // Query the users by email first
  knex('reviews')
    .where('id', id)
    .first() // takes the single object in the array into an object without the array
    .then(review => {
      if (!review) {
        return res.status(404).send('Review not found');
      }
      res.render('editReview', { review });
      
    })
    .catch(error => {
      console.error('Error fetching user for editing:', error);
      res.status(500).send('Internal Server Error');
    });
});

// // Route to post data back to the database
app.post('/editReview/:id', (req, res) => {
  const id = req.params.id;
  // Access each value directly from req.body
  const user_email = req.body.user_email;
  const comment = req.body.comment;
  const rating = req.body.rating; 
  // Update the user in the database
  knex('reviews')
    .where('id', id)
    .update({
      comment: comment,
      rating: rating,
    })
    .then(() => {
      res.redirect('/admin_reviews'); // Redirect to the list of reviews after saving
    })
    .catch(error => {
      console.error('Error updating review:', error);
      res.status(500).send('Internal Server Error');
    });
});

// DELETE REVIEWS
// Route to delete user accounts
app.post('/deleteReview/:id', (req, res) => {
  const id = req.params.id;
  knex('reviews')
    .where('id', id)
    .del() // Deletes the record with the specified email
    .then(() => {
      res.redirect('/admin_reviews'); // Redirect to the user list after deletion
    })
    .catch(error => {
      console.error('Error deleting user:', error);
      res.status(500).send('Internal Server Error');
    });
});

// ADD REVIEWS??

// DON'T PUT ANYTHING AFTER THIS!
app.listen( port, () => console.log("Listening"));