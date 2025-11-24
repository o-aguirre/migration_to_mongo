const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '../.env' });

// Usar configuración desde variables de entorno
const mongoUrl = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB_NAME;

async function crearColecciones() {
    const mongoClient = new MongoClient(mongoUrl);

    try {
        await mongoClient.connect();
        const db = mongoClient.db(dbName);

        console.log('Conexión exitosa a MongoDB.');

        // Limpiar colecciones existentes
        console.log('Eliminando colecciones existentes...');
        const collections = await db.listCollections().toArray();
        
        for (const collection of collections) {
            await db.collection(collection.name).drop();
            console.log(`Colección ${collection.name} eliminada.`);
        }

        // Crear colección de administradores con validación de esquema
        console.log('Creando colección: administradores');
        await db.createCollection('administradores');
        await db.collection('administradores').createIndex(
            { numrun: 1 }, 
            { unique: true }
        );
        console.log('Colección "administradores" creada');

        // Edificios
        await db.createCollection('edificios');
        await db.collection('edificios').createIndex(
            { id_edificio_sql: 1 }, 
            { unique: true }
        );
        console.log('Colección "edificios" creada');

        // Gastos Comunes
        await db.createCollection('gastos_comunes');
        await db.collection('gastos_comunes').createIndex(
            { edificio_id: 1, anno_mes: 1, nro_depto: 1 }
        );
        console.log('Colección "gastos_comunes" creada');

        console.log('\n🎉 Todas las colecciones creadas\n');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await mongoClient.close();
    }

}

// Ejecutar la creación de colecciones
crearColecciones();