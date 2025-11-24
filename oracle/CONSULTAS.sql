SELECT *
FROM administrador
WHERE numrun_adm = 15018444;

SELECT * 
FROM comuna
WHERE id_comuna = 10;

SELECT
    gc.anno_mes_pcgc,
    gc.nro_depto,
    gc.monto_total_gc,
    e.nombre_edif
FROM
    GASTO_COMUN gc
JOIN
    EDIFICIO e ON gc.id_edif = e.id_edif
WHERE
    e.nombre_edif = 'Murano'
    AND gc.monto_total_gc > 85000;
