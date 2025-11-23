# Sistema de Gestión de Edificios y Gastos Comunes

## 📋 Descripción del Proyecto

Sistema de gestión para administración de edificios, departamentos y gastos comunes, implementado con bases de datos **Oracle (modelo relacional)** y **MongoDB (modelo de documentos)**, demostrando la migración y equivalencia entre ambos paradigmas.

---

## 🚀 Guía de Instalación y Configuración

### **Requisitos Previos**

- **Oracle Database** (11g o superior) o **Oracle XE**
- **MongoDB Atlas** (cuenta gratuita) o instalación local de MongoDB
- **Node.js** (v14 o superior)
- **SQL*Plus** o **SQL Developer** (para Oracle)
- **mongosh** o **MongoDB Compass** (para MongoDB)

---

## 📦 Instalación

### **1. Clonar o Descargar el Proyecto**

```bash
cd workspace
```

### **2. Instalar Dependencias de Node.js**

```bash
cd mongodb
npm install
```

**Dependencias instaladas:**

- `mongodb` - Driver oficial de MongoDB
- `oracledb` - Driver oficial de Oracle (si es necesario para migración)
- `dotenv` - Gestión de variables de entorno

---

## 🗄️ Configuración de Base de Datos Oracle

### **Paso 1: Crear Tablas**

**Tablas creadas:**

- `COMUNA` - Comunas de Chile
- `ADMINISTRADOR` - Administradores de edificios
- `EDIFICIO` - Edificios con dirección y comuna
- `DEPARTAMENTO` - Departamentos dentro de edificios
- `GASTO_COMUN` - Gastos comunes mensuales por departamento

### **Paso 2: Poblar Tablas**

**Datos insertados:**

- 5 comunas (Las Condes, Providencia, Santiago, etc.)
- 5 administradores
- 5 edificios
- 5 departamentos en el edificio "Murano"
- 5 registros de gastos comunes

### **Paso 3: Ejecutar Consultas de Prueba**

`consultas.sql`

## 🍃 Configuración de MongoDB

### **Paso 1: Configurar Variables de Entorno**

Crea o edita el archivo `.env` en la raíz del proyecto:

```env
# Configuración de MongoDB
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/?appName=Cluster0
MONGO_DB_NAME=aintegraedi

# Configuración de Oracle (opcional)
ORACLE_USER=aintegraedi
ORACLE_PASSWORD=tu_password
ORACLE_CONNECT_STRING=localhost/XE
```

**⚠️ Importante:**
- Reemplaza `usuario` y `password` con tus credenciales reales de MongoDB Atlas
- El archivo `.env` NO debe subirse a repositorios públicos (ya está en `.gitignore`)
- Puedes usar `.env.example` como plantilla

### **Paso 2: Crear Colecciones con Validación de Esquema**

```bash
cd mongodb
node crearColecciones.js
```

**Resultado:**
- ✅ Colección `administradores` con índice único en `numrun`
- ✅ Colección `edificios` con subdocumentos de departamentos y comuna
- ✅ Colección `gastos_comunes` con validación de tipos de datos

**Características:**
- Validación de esquemas con `$jsonSchema`
- Índices únicos y compuestos
- Datos embebidos (departamentos, comunas)
- Referencias (administrador_id, edificio_id)

### **Paso 3: Poblar Colecciones desde JSON**

```bash
node poblarDesdeJson.js
```

**Proceso:**
1. Lee archivos JSON desde `data/`
2. Crea mapeos de referencias (numrun → ObjectId, id_edificio_sql → ObjectId)
3. Inserta datos con relaciones válidas
4. Verifica relaciones con `$lookup`

**Salida esperada:**
```
✅ Administradores: 5
✅ Edificios: 5
✅ Gastos Comunes: 5
✅ Relaciones Válidas: 5/5
```

### **Paso 4: Ejecutar Consultas de Prueba**

Ejecutar las consultas en `mongodb/consulta.txt`

## 📊 Ventajas de Cada Modelo

### **Oracle (Relacional)**

✅ **Ventajas:**
- Integridad referencial estricta (Foreign Keys)
- Transacciones ACID completas
- JOINs nativos y optimizados
- Ideal para datos altamente estructurados
- Consultas complejas con múltiples relaciones

❌ **Desventajas:**
- Requiere múltiples JOINs para datos relacionados
- Esquema rígido (difícil de modificar)
- Escalabilidad vertical (más costosa)

---

### **MongoDB (Documentos)**

✅ **Ventajas:**
- Datos embebidos reducen JOINs
- Esquema flexible (fácil evolución)
- Escalabilidad horizontal (sharding)
- Consultas rápidas para datos embebidos
- Ideal para aplicaciones modernas (JSON nativo)

❌ **Desventajas:**
- Duplicación de datos (desnormalización)
- Agregaciones más complejas que SQL
- Requiere planificación cuidadosa del modelo

---

## 📚 Recursos Adicionales

### **Documentación Oficial**

- [Oracle SQL](https://docs.oracle.com/en/database/)
- [MongoDB Manual](https://docs.mongodb.com/)
- [MongoDB Aggregation](https://docs.mongodb.com/manual/aggregation/)
- [Node.js MongoDB Driver](https://mongodb.github.io/node-mongodb-native/)

---

## 👥 Información del Proyecto

**Asignatura:** Bases de Datos Workshop  
**Semestre:** 4to - Analista Programador  
**Institución:** DuocUC  
**Año:** 2025
