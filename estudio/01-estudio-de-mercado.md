# Estudio de mercado: qué nicho atacar primero en Madrid

Fecha: 24/10/2026. **Base:** 6 análisis con 449 webs auditadas (`tools/audit_web.py`), de las que 268 revisé también a mano con capturas en ordenador y móvil. Hay más detalle por nicho en `prospectos/`.

## Conclusión

1. **Empezar por los restaurantes de eventos y celebraciones,** con fincas de bodas y hostales como segunda y tercera prueba.
2. **Usar las webs caídas o hackeadas como primera llamada en cualquier nicho:** avisarles es hacerles un favor, y abre la puerta.
3. **Aparcar** reformas, abogados y clínicas dentales: hay menos webs malas de lo esperado y demasiadas agencias.

## Ranking

| # | Nicho | Webs claramente malas (revisión visual ≥ 4) | Webs caídas, hackeadas o dominio perdido | Valor de un cliente nuevo | Agencias | Encaje con el asistente de WhatsApp | Veredicto |
|---|---|---|---|---|---|---|---|
| 1 | **Restaurantes de eventos** | 17 % | 8 % | 1.000–4.500 € por evento (inferido) | Media | **Muy alto:** las consultas de eventos se pierden ("menús de grupo por email") | **Empezar aquí** |
| 2 | **Fincas de bodas y eventos** | 12 % (+19 % mejorables) | 7 % | 12.000–25.000 € por boda (inferido) | Media | **Alto:** el 75 % tiene WhatsApp, casi ninguna da precios ni fechas | Segunda prueba |
| 3 | **Hostales y hoteles pequeños** | ~5 % de 180 (revisé a mano solo las 18 peores) | ~3 % (dominios en venta) | Ahorro en comisiones de Booking | Baja–media | **Alto:** turistas que escriben en inglés y a cualquier hora | Tercera prueba, solo los de 20–40 habitaciones |
| 4 | Clínicas dentales | 19 % | 17 % de los dominios de directorios | Implantes y ortodoncia: alto [Probable] | **Muy alta** | Medio: hay datos de salud | Más adelante. Gancho: el registro sanitario |
| 5 | Abogados | 22 % | Algunos casos | Alto [Probable] | Alta | Medio | Más adelante: viven del boca a boca y no tienen prisa |
| 6 | Reformas y cocinas | 8 % | 14 % | 3.000–20.000 € o más | **Muy alta** | Alto (filtrar las peticiones de presupuesto) | Solo para los incidentes (por ejemplo, Cocinas Río, hackeada) |
| — | Restaurantes de barrio | 25 % (todas rotas o perdidas) | 25 % | 15–30 € | — | Bajo | Descartado: un cliente nuevo vale poco |

## Por qué los restaurantes de eventos van primero

Al principio pensé que los restaurantes eran mal nicho. Para los de barrio lo sigo pensando: un cliente vale 15 €. Pero los datos han cambiado mi opinión sobre los de eventos:

- **Tienen dinero y están llenos.** Los mejores prospectos tienen entre 1.000 y 4.500 reseñas en Google.
- **Su web les hace perder dinero de una forma visible:** menús de grupo "por email", PDFs de 2015, nada de versión móvil, webs caídas. Cualquier dueño lo entiende en 30 segundos.
- **La reserva de mesa ya la tienen resuelta** (CoverManager, TheFork). **La consulta de eventos no:** es justo lo que hace nuestro segundo producto, el asistente de WhatsApp que pregunta fecha, personas y menú.
- **Es fácil hablar con el dueño:** se llama al restaurante.
- **Cada evento extra deja 1.000–4.500 €,** así que dos eventos pagan la web.

## Lo que no esperaba

- **Reformas, abogados y dentistas tienen webs mejores de lo que pensaba.** La mayoría ya tiene un WordPress decente hecho por una agencia. El argumento de "tu web es vieja" no funciona ahí.
- **En todos los nichos, entre el 3 % y el 17 % de los negocios tiene la web caída, hackeada o ha perdido el dominio.** Es el mejor motivo para llamar: les avisas de un problema real que no saben que tienen. Podría ser una oferta propia, "rescate de webs", y una fuente de clientes que se repite: basta con revisar periódicamente las webs de un nicho.
- **La auditoría automática se queda corta.** La mayoría de webs malas tienen HTTPS y se adaptan al móvil, pero parecen de 2014. Hace falta mirar las capturas.

## Precio para probar en las llamadas [Supuesto]

En la web se presentan como dos opciones (prueba H3 del documento de posicionamiento):

| Opción | Entrada | Cuota | Primer año | Años siguientes |
|---|---|---|---|---|
| A. Pago único | 1.490 € | 49 €/mes (alojamiento, cambios e informe) | 2.078 € | 588 € |
| B. Sin entrada | 0 € | 169 €/mes (permanencia de 12 meses) | 2.028 € | 2.028 € |

- **Primeros 3 clientes:** descuento a cambio de testimonio y permiso para usarles como caso de éxito.
- **Referencia de mercado:** una web para pyme en España ronda los 2.000 € más 30–150 €/mes [Probable].
- **Competidor directo con precios públicos (Kerkis Lab, octubre de 2026):**
  - Web: 590–1.490 € + 39 €/mes.
  - Web con asistente de IA: 2.400 € + 119 €/mes.

  Ver `03-competidores.md`.

## Límites de este estudio

- **Los porcentajes no son comparables entre nichos.** Cada muestra sale de una fuente distinta:
  - hostales: el registro oficial,
  - abogados: Yelp, que tiene despachos más antiguos,
  - restaurantes: esmadrid y salir.com, con fichas seleccionadas.

  Úsalos como orden de magnitud, no como medida exacta.
- **Las muestras son pequeñas** (45–62 por nicho; 180 en hostales).
- **No hemos medido cuántas consultas pierden de verdad.** Eso lo dirá la prueba de llamadas en hora punta y el chat de diagnóstico de nuestra web.
