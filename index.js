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
        WHERE created_at > '2020-09-18'
        GROUP BY DATE (created_at)
        ORDER BY DATE (created_at) ASC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({error: 'Database error'});
        }

        function squashSequence(rows, index, count) {
            if (index >= rows.length || rows[index].user_count !== 1) {
                return {count, index};
            }

            return squashSequence(rows, index + 1, count + 1);
        }

        const formattedResults = [];
        let i = 0;

        while (i < results.length) {
            const startDate = results[i].date;
            let endDate = startDate;
            let count = results[i].user_count;

            if (results[i].user_count === 1) {
                const result = squashSequence(results, i + 1, count);
                count = result.count;
                i = result.index - 1;
                endDate = results[i].date;
            }

            const startYear = startDate.slice(0, 4);
            const endYear = endDate.slice(0, 4);

            const range = startDate === endDate
                ? startDate
                : `${startDate} - ${
                    startYear === endYear
                        ? endDate.slice(5)
                        : endDate
                }`;

            formattedResults.push({range, count});
            i++;
        }

        const labels = formattedResults.map(row => row.range);
        const values = formattedResults.map(row => row.count);
        const total = values.reduce((acc, count) => acc + count, 0);

        res.json({labels, values, total});
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
            return res.status(500).json({error: 'Database error'});
        }

        const labels = results.map(row => row.date);
        const values = results.map(row => row.message_count);
        const total = values.reduce((acc, count) => acc + count, 0);

        res.json({labels, values, total});
    });
});

app.get('/stats/cities', (req, res) => {
    const query = `
        SELECT cities.id, 
               IF (cities.title_uk > '', cities.title_uk, cities.title_en) AS name,
               cities.lat, 
               cities.lon, 
               COUNT(user_cities.user_id) as user_count
        FROM cities
        INNER JOIN user_cities ON cities.id = user_cities.city_id
        GROUP BY cities.id, name, cities.lat, cities.lon
        ORDER BY user_count DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }

        res.json(results);
    });
});

app.listen(process.env.PORT, () => {
    console.log(`Server running on http://localhost:${process.env.PORT}`);
});
