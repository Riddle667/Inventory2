const { PrismaClient } = require('@prisma/client');
const express = require('express');


class Server {
    constructor(){
        this.app = express();
        this.port = process.env.PORT;
        this.Server = require('http').createServer(this.app);

        this.paths = {
            auth: '/api/auth',
            user: '/api/user',
        }

        // Inicializar Prisma Client
        this.prisma = new PrismaClient();

        // Middlewares
        this.middlewares();

        // Routes
        this.routes();

        // Database connection
        this.dbConnection();
    }

    async dbConnection(){
        try {
            await this.prisma.$connect();
            console.log('Database connected');
        } catch (error) {
            console.error('Error connecting to the database', error);
            process.exit(1);
        }
    }

    middlewares(){
        this.app.use(express.json());
    }

    routes(){
        this.app.use(this.paths.user, require('./routes/user'));
        this.app.use(this.paths.auth, require('./routes/auth'));
    }

    listen(){
        this.Server.listen(this.port, () => {
            console.log(`Server running on port ${this.port}`);
        });
    }
}

module.exports = Server;