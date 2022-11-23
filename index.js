const express = require('express');

const cors = require('cors');

const port = process.env.PORT || 5000;

const app = express();

app.get('/', (req, res) => {
    res.send('Camera Resale Server is running')
})

app.listen(port, () => {
    console.log(`Camera Resale Server is running at ${port}`);
})
