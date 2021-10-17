const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const authenticationRoutes = require('./routes/authentication');
const groupMemberRoutes = require('./routes/group-members');
const groupRoutes = require('./routes/groups');
const cardRoutes = require('./routes/cards');
const susuRoutes = require('./routes/susu');
const disbursementRoutes = require('./routes/disbursements');
const userRoutes = require('./routes/users');
const susuMemberRoutes = require('./routes/susu-members');
const contributionRoutes = require('./routes/contributions');

const app = express();
dotenv.config();

mongoose.connect(process.env.MONGO_DB_URI)
    .then(value => {
        console.log(`Connected to MongoDB on database ${value.connection.db.databaseName}`)
    }).catch(error => {
        console.log(`Error connecting to Mongo DB: ${error.message}`);
});

app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));

app.use('/api/v1/auth', authenticationRoutes);
app.use('/api/v1/group-members', groupMemberRoutes);
app.use('/api/v1/groups', groupRoutes);
app.use('/api/v1/cards', cardRoutes);
app.use('/api/v1/susus', susuRoutes);
app.use('/api/v1/disbursements', disbursementRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/susu-members', susuMemberRoutes);
app.use('/api/v1/contributions', contributionRoutes);


const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
    console.log(`Connected to server in ${process.env.NODE_ENV} mode on port ${PORT}`);
})
