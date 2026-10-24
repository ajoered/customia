# Restaurantes de eventos y celebraciones en Madrid: prospectos

**Método:**
- **Muestra:** 60 webs. 48 son restaurantes con salones, menús de grupo o de nivel alto. Las otras 12 son restaurantes de barrio, como grupo de comparación.
- **Fuentes:** sobre todo esmadrid.com y salir.com. Son fichas seleccionadas, así que la muestra probablemente sale algo mejor que la media real.
- **Revisión:** todas pasaron por `tools/audit_web.py` y revisé las capturas a mano.

Datos completos en `restaurantes-auditoria.csv`. La columna `grupo` indica eventos o comparación.

## Resultados

| | Eventos y alto nivel (48) | Barrio (12) |
|---|---|---|
| Puntuación automática ≥ 40 | 2 (4 %) | 0 |
| Web caída o dominio perdido | 4 (8 %) | 3 (25 %) |
| Nota visual ≥ 4 | 8 de 46 (17 %) | 3 de 12 (25 %, todas rotas o perdidas) |
| Reservas online en la web | 22 de 44 (CoverManager 13, TheFork 8) | 3 de 10 |
| Menús en PDF | 15 de 44 | 5 de 10 |

**Qué significan:**

- **La web delata el problema de otra forma.** Casi todas tienen HTTPS y se adaptan al móvil. Lo que falla es otra cosa:
  - menús de grupo del tipo "solicítelos por email",
  - menús en PDF o en imagen,
  - contenido caducado,
  - webs caídas.
- **Lo que les duele no es la reserva de mesa** (la mitad ya usa CoverManager o TheFork), **sino las consultas de eventos.** Encaja muy bien con el asistente de WhatsApp: pregunta fecha, número de personas y menú, y le pasa el resumen al restaurante.
- **Valor de un evento:**
  - Los menús de grupo van de 25 a 80 € por persona.
  - Con salones de 20 a 75 personas, un evento deja unos **1.000–4.500 €** (inferido).
- **Los mejores prospectos tienen entre 1.000 y 4.500 reseñas en Google:** negocios llenos, con dinero y con una web que les hace perder eventos.
- **Competencia:** la plataforma Listae está detrás de 4 webs casi idénticas. 31 de 44 enlazan su Instagram.

## Mejores prospectos

Las reseñas de Google son las que muestra gastroranking.es.

| Restaurante | Problemas de su web | Teléfono | Email | Señales |
|---|---|---|---|---|
| **Asador Real** (Ópera) | **No tiene versión móvil** (se ve la de escritorio en diminuto). No hay reserva online y los menús de grupo hay que "solicitarlos por correo". El email de la portada tiene una errata (atecionalcliente@). Opiniones de 2014 | 91 547 11 11 · 91 559 85 85 | reservas@asadorreal.com | 2.910 reseñas. 3 salones, el mayor de 65 personas. Desde 1996 |
| **Compostela** (Argüelles) | **Sin HTTPS: el formulario de reserva envía los datos sin cifrar.** Tildes rotas en toda la web ("MEN�S"). Menús de eventos en imagen y PDF de 2015 | 91 542 73 32 · 91 559 08 83 | info@restaurantecompostela.es | 1.716 reseñas. Menús de 24,5–44,5 €. Desde 1996 |
| **Charolés** (San Lorenzo de El Escorial) | Wix antiguo sin versión móvil. Los menús de grupo no están publicados y remiten a otro email. Sin reserva online | 91 890 59 75 | charoles@charoles.es | 1.788 reseñas. 2 salones privados. Desde 1977 |
| **Mesón La Cueva** (San Lorenzo de El Escorial) | Diseño de hacia 2012, el mapa de contacto da error y los menús están solo en PDF | 91 890 15 16 · WhatsApp 669 39 33 19 | mesonlacueva@mesonlacueva.com | 1.168 reseñas. 5 comedores, 140 personas. Menús de 32–60 € + IVA |
| **O'Grelo** (Retiro) | **Web inaccesible:** el dominio redirige a una dirección que no existe | 91 409 72 04 | info@restauranteogrelo.com | **4.452 reseñas.** 3 salones privados. Más de 30 años |
| **Asador Pelotari** (Recoletos) | **Web caída** (error 522 en todas las pruebas) | 91 578 24 97 | pelotari@pelotari-asador.com | 1.677 reseñas. Salón de unas 50 personas. Desde 1990 |
| **La Montaña** (El Pardo) | **El dominio ya no existe:** la web ha desaparecido | 91 376 08 83 | — | 1.723 reseñas. Salón de 50 y terraza de 95. Bodas y bautizos |
| **Casa Adriano** (Tetuán) | No carga (error 503). Confirmar en un navegador normal | 91 450 08 85 | info@restaurantecasaadriano.com | 1.079 reseñas. Salón de hasta 75 personas |

En las 4 webs caídas, el teléfono y el email salen de esmadrid.com y gastroranking.es. **Antes de llamar, comprueba desde tu móvil que la web sigue sin funcionar.**
