const { PrismaClient } = require('@prisma/client');
const express = require('express');
const cors = require('cors');
const logger = require('morgan');
const fileUpload = require('express-fileupload');
const startCronJobs = require('./Helpers/cron');

class Server {
    constructor(){
        this.app = express();
        this.port = process.env.PORT;
        this.Server = require('http').createServer(this.app);

        this.paths = {
            auth: '/api/auth',
            user: '/api/user',
            client: '/api/client',
            category: '/api/category',
            product: '/api/product',
            upload: '/api/upload',
            order: '/api/order',
            statistics: '/api/statistics',
            alert: '/api/alert'
        }

        // Inicializar Prisma Client
        this.prisma = new PrismaClient();

        // Middlewares
        this.middlewares();

        // Routes
        this.routes();

        // Database connection
        this.dbConnection();

        // Start cron jobs
        startCronJobs();
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
        // Morgan
        this.app.use(logger('dev'));

        // Read and parse body
        this.app.use(express.json());

        // Cors
        this.app.use(cors());

        // fileUpload - load files
        this.app.use(fileUpload({
            useTempFiles: true,
            tempFileDir: '/tmp/',
            createParentPath: true
        }));
    }

    routes(){
        this.app.use(this.paths.user, require('./Routes/userRoutes'));
        this.app.use(this.paths.auth, require('./Routes/authRoutes'));
        this.app.use(this.paths.client, require('./Routes/clientRoutes'));
        this.app.use(this.paths.category, require('./Routes/categoryRoutes'));
        this.app.use(this.paths.product, require('./Routes/productRoutes'));
        this.app.use(this.paths.upload, require('./Routes/uploadRoutes'));
        this.app.use(this.paths.order, require('./Routes/orderRoutes'));
        this.app.use(this.paths.statistics, require('./Routes/statisticsRoutes'));
        this.app.use(this.paths.alert, require('./Routes/alertRoutes'));

    }
    
    listen(){
        this.Server.listen(this.port, () => {
            console.log(`Server running on port ${this.port}`);
        });
    }
}

module.exports = Server;