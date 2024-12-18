FROM node:19-bullseye

WORKDIR /app

# Copia los archivos del proyecto
COPY . ./inventoryBack

WORKDIR /app/inventoryBack

# Instala las dependencias
RUN npm install

# Genera migraciones si no existen
RUN rm -rf prisma/migrations
RUN npx prisma migrate dev --name init

# Asegúrate de aplicar las migraciones
RUN npx prisma migrate deploy

# Expone el puerto para el servidor
EXPOSE 8080

# Comando para iniciar la aplicación
CMD ["npm", "start"]
