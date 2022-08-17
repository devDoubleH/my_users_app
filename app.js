const express = require('express');
const app = express();
const sqlite3 = require('sqlite3');
const port = process.env.PORT || 3000;

const user_id = Math.floor(Math.random() * 1000000);
const db = new sqlite3.Database('db.sql', sqlite3.OPEN_READWRITE, (err) => {
    if (err) return console.error(err.message);
    console.log('Connected to the in-memory SQlite database.');
});

// db.run('DROP TABLE IF EXISTS users');

// db.run('CREATE TABLE IF NOT EXISTS users (firstname, lastname, age, email, password, user_id)');

// json parser
app.use(express.json());
app.use(express.static('views'));

class User {
    constructor(firstname, lastname, age, password, email){
        this.firstname = firstname;
        this.user_id = user_id;
        this.lastname = lastname;
        this.age = age;
        this.password = password;
        this.email = email;
    }

    create(firstname, lastname, age, password, email){        
        const sql = `INSERT INTO users (firstname, lastname, age, password, email, user_id) VALUES (?, ?, ?, ?, ?, ?)`;

        db.run(sql, [firstname, lastname, age, password, email, user_id], (err) => {
            if (err) return console.error(err.message);
            console.log('User created');
        });

        return db;
    }

    find(user_id){
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM users WHERE user_id = ${user_id}`, (err, row) => {
                if (err) return console.error(err.message);
                resolve(row);
            }
            );
        });
    }

    destroy(user_id){
        db.run(`DELETE FROM users WHERE user_id=${user_id}`, (err)=>{
            if (err) return console.error(err.message);
            console.log('user deleted');
        });
    }

    all(){
        return new Promise((resolve, reject) => {
            db.all(`SELECT * FROM users`, (err, rows) => {
                if (err) return console.error(err.message);
                rows.forEach((row) => {
                    delete row.password;
                });
                resolve(rows);
            }
            );
        });

    }

    update(user_id, attribute, value){
        db.run(`UPDATE users SET ${attribute} = ${value} WHERE user_id = ${user_id}`, (err) => {
            if (err) return console.error(err.message);
            console.log('user updated');
        } );
    }

}

const user = new User();

app.get('/', (req, res) => {
// render all users to the page
    user.all().then((users) => {
        res.render('index', {users: users});
    });

}).listen(port, () => {
    console.log(`Listening on port ${port}`);
});


app.get('/users', (req, res) => {
    user.all().then((rows) => {
        res.send(rows);
    });
});


app.post('/users', (req, res) => {
    const { firstname, lastname, age, password, email } = req.body;
    user.create(firstname, lastname, age, password, email);
    db.get(`SELECT * FROM users WHERE email=${email} AND password=${password}`, (err, row) => {
        if (err) return console.error(err.message);
        res.send(row.user_id);
    });
});


app.post('/sign_in', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ? AND password = ?`, [email, password], (err, row) => {
        if (err) return console.error(err.message);
        user.update(row.user_id, 'is_online', '"online"');
        delete row.password;
        res.send(row);
    });
});


app.put('/users', (req, res) => {
    const { user_id, password, newPassword } = req.body;
    user.find(user_id).then((row) => {
        if (row.password === password && row.is_online === "online") {
            user.update(user_id, 'password', newPassword);
            delete row.password;
            res.send(row);
        } else {
            res.send({
                error: 'Incorrect password',
            });
        }
    });
})

app.delete('/sign_out', (req, res) => {
    const { user_id } = req.body;
    user.find(user_id).then((row) => {
        if (row.is_online === "online") {
            user.update(user_id, 'is_online', '"offline"');
        }
    });
    res.send({
        message: 'User signed out',
    });
});



app.delete('/users', (req, res) => {
    const { user_id } = req.body;
    user.find(user_id).then((row) => {
        if (row.is_online === "online") {
            user.destroy(user_id);
        }
    });
    res.send({
        message: 'User deleted',
    });
});

