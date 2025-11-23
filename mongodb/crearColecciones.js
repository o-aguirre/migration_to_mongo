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
        await db.createCollection('administradores', {
            validator: {
                $jsonSchema: {
                    bsonType: 'object',
                    required: ['numrun', 'dvrun', 'pnombre', 'appaterno', 'apmaterno'],
                    properties: {
                        numrun: {
                            bsonType: 'number',
                            description: 'Número de RUN del administrador - requerido'
                        },
                        dvrun: {
                            bsonType: 'string',
                            maxLength: 1,
                            description: 'Dígito verificador del RUN - requerido'
                        },
                        pnombre: {
                            bsonType: 'string',
                            maxLength: 15,
                            description: 'Primer nombre - requerido'
                        },
                        snombre: {
                            bsonType: ['string', 'null'],
                            maxLength: 15,
                            description: 'Segundo nombre - opcional'
                        },
                        appaterno: {
                            bsonType: 'string',
                            maxLength: 15,
                            description: 'Apellido paterno - requerido'
                        },
                        apmaterno: {
                            bsonType: 'string',
                            maxLength: 15,
                            description: 'Apellido materno - requerido'
                        }
                    }
                }
            }
        });

        // Crear índice único en numrun
        await db.collection('administradores').createIndex({ numrun: 1 }, { unique: true });
        console.log('Índice único creado en administradores.numrun');

        // Crear colección de edificios con validación de esquema
        console.log('Creando colección: edificios');
        await db.createCollection('edificios', {
            validator: {
                $jsonSchema: {
                    bsonType: 'object',
                    required: ['id_edificio_sql', 'nombre', 'direccion', 'comuna', 'administrador_id', 'departamentos'],
                    properties: {
                        id_edificio_sql: {
                            bsonType: 'number',
                            description: 'ID del edificio en Oracle - requerido'
                        },
                        nombre: {
                            bsonType: 'string',
                            maxLength: 30,
                            description: 'Nombre del edificio - requerido'
                        },
                        direccion: {
                            bsonType: 'string',
                            maxLength: 60,
                            description: 'Dirección del edificio - requerido'
                        },
                        comuna: {
                            bsonType: 'object',
                            required: ['nombre', 'id_comuna_sql'],
                            properties: {
                                nombre: {
                                    bsonType: 'string',
                                    description: 'Nombre de la comuna'
                                },
                                id_comuna_sql: {
                                    bsonType: 'number',
                                    description: 'ID de la comuna en Oracle'
                                }
                            }
                        },
                        administrador_id: {
                            bsonType: 'objectId',
                            description: 'Referencia al administrador - requerido'
                        },
                        departamentos: {
                            bsonType: 'array',
                            items: {
                                bsonType: 'object',
                                required: ['nro_depto', 'total_banos', 'total_dormitorios', 'metros_cuadrados', 'porc_prorrateo'],
                                properties: {
                                    nro_depto: {
                                        bsonType: 'number',
                                        description: 'Número del departamento'
                                    },
                                    total_banos: {
                                        bsonType: 'number',
                                        description: 'Total de baños'
                                    },
                                    total_dormitorios: {
                                        bsonType: 'number',
                                        description: 'Total de dormitorios'
                                    },
                                    total_balcones: {
                                        bsonType: ['number', 'null'],
                                        description: 'Total de balcones'
                                    },
                                    metros_cuadrados: {
                                        bsonType: 'number',
                                        description: 'Metros cuadrados'
                                    },
                                    porc_prorrateo: {
                                        bsonType: 'number',
                                        description: 'Porcentaje de prorrateo'
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        // Crear índices para edificios
        await db.collection('edificios').createIndex({ id_edificio_sql: 1 }, { unique: true });
        await db.collection('edificios').createIndex({ administrador_id: 1 });
        console.log('Índices creados en edificios');

        // Crear colección de gastos comunes con validación de esquema
        console.log('Creando colección: gastos_comunes');
        await db.createCollection('gastos_comunes', {
            validator: {
                $jsonSchema: {
                    bsonType: 'object',
                    required: ['anno_mes', 'edificio_id', 'nro_depto', 'fecha_desde', 'fecha_hasta', 'monto_total'],
                    properties: {
                        anno_mes: {
                            bsonType: 'number',
                            description: 'Año y mes del gasto - requerido'
                        },
                        edificio_id: {
                            bsonType: 'objectId',
                            description: 'Referencia al edificio - requerido'
                        },
                        nro_depto: {
                            bsonType: 'number',
                            description: 'Número del departamento - requerido'
                        },
                        fecha_desde: {
                            bsonType: 'date',
                            description: 'Fecha inicio del período - requerido'
                        },
                        fecha_hasta: {
                            bsonType: 'date',
                            description: 'Fecha fin del período - requerido'
                        },
                        prorrateado: {
                            bsonType: ['number', 'null'],
                            description: 'Monto prorrateado'
                        },
                        fondo_reserva: {
                            bsonType: ['number', 'null'],
                            description: 'Monto fondo de reserva'
                        },
                        agua_individual: {
                            bsonType: ['number', 'null'],
                            description: 'Consumo agua individual'
                        },
                        combustible_individual: {
                            bsonType: ['number', 'null'],
                            description: 'Consumo combustible individual'
                        },
                        lavanderia: {
                            bsonType: ['number', 'null'],
                            description: 'Gasto lavandería'
                        },
                        evento: {
                            bsonType: ['number', 'null'],
                            description: 'Gasto evento'
                        },
                        servicio: {
                            bsonType: ['number', 'null'],
                            description: 'Gasto servicio'
                        },
                        monto_atrasado: {
                            bsonType: ['number', 'null'],
                            description: 'Monto atrasado'
                        },
                        multa: {
                            bsonType: ['number', 'null'],
                            description: 'Monto multa'
                        },
                        monto_total: {
                            bsonType: 'number',
                            description: 'Monto total - requerido'
                        },
                        fecha_pago: {
                            bsonType: ['date', 'null'],
                            description: 'Fecha de pago'
                        }
                    }
                }
            }
        });

        // Crear índices para gastos comunes
        await db.collection('gastos_comunes').createIndex({ edificio_id: 1, anno_mes: 1 });
        await db.collection('gastos_comunes').createIndex({ edificio_id: 1, nro_depto: 1 });
        console.log('Índices creados en gastos_comunes');

        console.log('\n¡Colecciones creadas exitosamente!');
        console.log('Resumen:');
        console.log('- administradores: Con validación de esquema e índice único en numrun');
        console.log('- edificios: Con validación de esquema, subdocumentos de departamentos y comuna');
        console.log('- gastos_comunes: Con validación de esquema y referencias a edificios');

    } catch (err) {
        console.error('Error al crear las colecciones:', err);
    } finally {
        await mongoClient.close();
        console.log('Conexión a MongoDB cerrada.');
    }
}

// Ejecutar la creación de colecciones
crearColecciones();