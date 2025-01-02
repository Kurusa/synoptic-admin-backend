const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
});

app.get('/', (req, res) => {
    res.send('Server is running');
});

app.get('/users', (req, res) => {
    db.query('SELECT id, is_blocked, user_name, first_name, chat_id, status, language, created_at FROM users', (err, results) => {
        if (err) {
            return res.status(500).json({error: err});
        }
        res.json(results);
    });
});

app.get('/messages/stats', (req, res) => {
    const query = `
        SELECT DATE (created_at) as date, COUNT (*) as message_count
        FROM messages
        GROUP BY DATE (created_at)
        ORDER BY DATE (created_at) ASC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({error: 'Database error'});
        }

        const labels = results.map(row => row.date);
        const data = results.map(row => row.message_count);

        res.json({labels, data});
    });
});

app.listen(process.env.PORT,() => {
    console.log(`Server running on http://localhost:${process.env.PORT}`);
});
