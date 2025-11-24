const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../.env' });

// Usar configuración desde variables de entorno
const mongoUrl = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB_NAME;

async function poblarDesdeJSON() {
    const mongoClient = new MongoClient(mongoUrl);

    try {
        await mongoClient.connect();
        const db = mongoClient.db(dbName);

        console.log('✅ Conexión exitosa a MongoDB.\n');

        // Verificar que existen las colecciones
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        if (!collectionNames.includes('administradores') ||
            !collectionNames.includes('edificios') ||
            !collectionNames.includes('gastos_comunes')) {
            console.error('Las colecciones no existen. Ejecuta primero: node crear_colecciones.js');
            return;
        }

        // Limpiar datos existentes
        console.log('Limpiando datos existentes...');
        await db.collection('gastos_comunes').deleteMany({});
        await db.collection('edificios').deleteMany({});
        await db.collection('administradores').deleteMany({});
        console.log('Colecciones limpiadas.\n');

        // --- 1. ADMINISTRADORES ---
        console.log('═══════════════════════════════════════');
        console.log('POBLANDO ADMINISTRADORES');
        console.log('═══════════════════════════════════════');

        const administradoresData = JSON.parse(
            fs.readFileSync(path.join(__dirname, 'data', 'administradores.json'), 'utf8')
        );

        const adminMap = new Map(); // numrun -> ObjectId

        for (const admin of administradoresData) {
            const result = await db.collection('administradores').insertOne(admin);
            adminMap.set(admin.numrun, result.insertedId);
            console.log(`✓ ${admin.pnombre} ${admin.appaterno} (RUN: ${admin.numrun})`);
        }
        console.log(`\nTotal: ${administradoresData.length} administradores\n`);

        // --- 2. EDIFICIOS ---
        console.log('═══════════════════════════════════════');
        console.log('POBLANDO EDIFICIOS');
        console.log('═══════════════════════════════════════');

        const edificiosData = JSON.parse(
            fs.readFileSync(path.join(__dirname, 'data', 'edificios.json'), 'utf8')
        );

        const edificioMap = new Map(); // id_edificio_sql -> ObjectId

        // En poblarDesdeJson.js, aproximadamente línea 65-85

        for (const edificio of edificiosData) {
            const adminObjectId = adminMap.get(edificio.numrun_administrador);

            if (!adminObjectId) {
                console.error(`❌ Administrador no encontrado: RUN ${edificio.numrun_administrador}`);
                continue;
            }

            // TRANSFORMAR: Convertir id_comuna a objeto comuna embebido
            let comunaObj;
            if (edificio.comuna) {
                // Ya tiene el formato correcto
                comunaObj = edificio.comuna;
            } else if (edificio.id_comuna) {
                // Mapeo de id_comuna a nombre (según POBLACION_TABLAS.sql)
                const comunaMap = {
                    10: "Las Condes",
                    20: "Providencia",
                    230: "Santiago"
                };

                comunaObj = {
                    nombre: comunaMap[edificio.id_comuna] || "Desconocida",
                    id_comuna_sql: edificio.id_comuna
                };
            } else {
                console.error(`❌ Edificio sin comuna: ${edificio.nombre}`);
                continue;
            }

            const edificioDoc = {
                id_edificio_sql: edificio.id_edificio_sql,
                nombre: edificio.nombre,
                direccion: edificio.direccion,
                comuna: comunaObj,  // ← Objeto embebido correcto
                administrador_id: adminObjectId,
                departamentos: edificio.departamentos
            };

            const result = await db.collection('edificios').insertOne(edificioDoc);
            edificioMap.set(edificio.id_edificio_sql, result.insertedId);

            console.log(`✓ ${edificio.nombre} (ID SQL: ${edificio.id_edificio_sql})`);
        }
        console.log(`\nTotal: ${edificiosData.length} edificios\n`);

        // Verificar mapeo
        console.log('Mapeo de Edificios (id_edificio_sql → ObjectId):');
        for (const [sqlId, mongoId] of edificioMap.entries()) {
            console.log(`  ${sqlId} → ${mongoId}`);
        }
        console.log();

        // --- 3. GASTOS COMUNES ---
        console.log('═══════════════════════════════════════');
        console.log('POBLANDO GASTOS COMUNES');
        console.log('═══════════════════════════════════════');

        const gastosData = JSON.parse(
            fs.readFileSync(path.join(__dirname, 'data', 'gastos_comunes.json'), 'utf8')
        );

        console.log(`Registros a insertar: ${gastosData.length}\n`);

        let insertados = 0;
        let errores = 0;

        for (const gasto of gastosData) {
            const edificioObjectId = edificioMap.get(gasto.id_edificio_sql);

            if (!edificioObjectId) {
                console.error(`Edificio no encontrado: ID SQL ${gasto.id_edificio_sql}`);
                console.error(`   Depto: ${gasto.nro_depto}, Período: ${gasto.anno_mes}`);
                errores++;
                continue;
            }

            const gastoDoc = {
                anno_mes: gasto.anno_mes,
                edificio_id: edificioObjectId, // ✅ ObjectId válido
                nro_depto: gasto.nro_depto,
                fecha_desde: new Date(gasto.fecha_desde),
                fecha_hasta: new Date(gasto.fecha_hasta),
                prorrateado: gasto.prorrateado,
                fondo_reserva: gasto.fondo_reserva,
                agua_individual: gasto.agua_individual,
                combustible_individual: gasto.combustible_individual,
                lavanderia: gasto.lavanderia,
                evento: gasto.evento,
                servicio: gasto.servicio,
                monto_atrasado: gasto.monto_atrasado,
                multa: gasto.multa,
                monto_total: gasto.monto_total,
                fecha_pago: gasto.fecha_pago ? new Date(gasto.fecha_pago) : null
            };

            try {
                await db.collection('gastos_comunes').insertOne(gastoDoc);
                insertados++;
                console.log(`✓ Depto ${gasto.nro_depto} | $${gasto.monto_total.toLocaleString()} | Edificio: ${edificioObjectId}`);
            } catch (err) {
                console.error(`Error insertando gasto: ${err.message}`);
                errores++;
            }
        }

        console.log(`\nInsertados: ${insertados} | Errores: ${errores}\n`);

        // --- VERIFICACIÓN DE RELACIONES ---
        console.log('═══════════════════════════════════════');
        console.log('VERIFICANDO RELACIONES');
        console.log('═══════════════════════════════════════');

        const gastosConEdificio = await db.collection('gastos_comunes').aggregate([
            {
                $lookup: {
                    from: 'edificios',
                    localField: 'edificio_id',
                    foreignField: '_id',
                    as: 'edificio'
                }
            },
            {
                $project: {
                    nro_depto: 1,
                    monto_total: 1,
                    edificio_id: 1,
                    edificio_nombre: { $arrayElemAt: ['$edificio.nombre', 0] },
                    tiene_relacion: { $gt: [{ $size: '$edificio' }, 0] }
                }
            }
        ]).toArray();

        const relacionesValidas = gastosConEdificio.filter(g => g.tiene_relacion);
        const relacionesInvalidas = gastosConEdificio.filter(g => !g.tiene_relacion);

        console.log(`\nRelaciones válidas: ${relacionesValidas.length}`);
        console.log(`Relaciones inválidas: ${relacionesInvalidas.length}\n`);

        if (relacionesValidas.length > 0) {
            console.log('Ejemplos de relaciones correctas:');
            relacionesValidas.slice(0, 5).forEach((g, i) => {
                console.log(`  ${i + 1}. Depto ${g.nro_depto} → ${g.edificio_nombre} | $${g.monto_total}`);
            });
        }

        // --- RESUMEN FINAL ---
        console.log('\n═══════════════════════════════════════');
        console.log('RESUMEN FINAL');
        console.log('═══════════════════════════════════════');

        const adminCount = await db.collection('administradores').countDocuments();
        const edificioCount = await db.collection('edificios').countDocuments();
        const gastosCount = await db.collection('gastos_comunes').countDocuments();

        console.log(`Administradores: ${adminCount}`);
        console.log(`Edificios: ${edificioCount}`);
        console.log(`Gastos Comunes: ${gastosCount}`);
        console.log(`Relaciones Válidas: ${relacionesValidas.length}/${gastosCount}`);

        if (relacionesValidas.length === gastosCount && gastosCount > 0) {
            console.log('\n¡ÉXITO TOTAL! Todas las relaciones son válidas.');
        } else {
            console.log('\nHay problemas. Ejecuta: node verificar_datos.js');
        }

        console.log('═══════════════════════════════════════\n');

    } catch (err) {
        console.error('\nError fatal:', err.message);
        console.error('Stack:', err.stack);
    } finally {
        await mongoClient.close();
        console.log('Conexión cerrada.\n');
    }
}

poblarDesdeJSON();