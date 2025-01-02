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

app.get('/stats/users', (req, res) => {
    const query = `
        SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, 
            COUNT(*) as user_count
        FROM users
        GROUP BY DATE (created_at)
        ORDER BY DATE (created_at) ASC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }

        const labels = results.map(row => row.date);
        const values = results.map(row => row.user_count);
        const total = values.reduce((acc, count) => acc + count, 0);

        res.json({ labels, values, total });
    });
});

app.get('/stats/messages', (req, res) => {
    const query = `
        SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, COUNT(*) as message_count
        FROM messages
        GROUP BY DATE (created_at)
        ORDER BY DATE (created_at) ASC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }

        const labels = results.map(row => row.date);
        const values = results.map(row => row.message_count);
        const total = values.reduce((acc, count) => acc + count, 0);

        res.json({ labels, values, total });
    });
});

app.listen(process.env.PORT,() => {
    console.log(`Server running on http://localhost:${process.env.PORT}`);
});
