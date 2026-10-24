# Hostales y hoteles pequeños de Madrid capital: prospectos

**Método:** del registro oficial de alojamientos de la Comunidad de Madrid (datos abiertos) saqué 442 hostales y hoteles de 1 a 3 estrellas de Madrid capital. Para cada uno probé dominios probables (hostal + nombre, en .com y .es) y comprobé que la página fuera del negocio. Así salieron 181 webs propias, que pasé por `tools/audit_web.py`, y luego revisé a mano las capturas de las peores.

Datos completos: `hostales-hoteles-auditoria.csv`.

## Resultados (180 webs que responden)

| Señal | Webs | % |
|---|---|---|
| Sin HTTPS (Chrome la marca como "No seguro") | 49 | 27 % |
| No adaptada a móvil | 16 | 9 % |
| Puntuación legacy ≥ 25 | 45 | 25 % |
| Puntuación legacy ≥ 40 | 16 | 9 % |

**Qué significan estos números:**

- **El dato del 9 % está inflado.** De las 16 webs con puntuación ≥ 40, unas 6 son dominios caducados o en venta (Hostal Abadía, Hostal Americano, Caballero Errante…). Eso también es una oportunidad, pero distinta: han perdido su dominio.
- **Hay un grupo de unos 20 hostales con la misma plantilla** (jQuery 1.8 y sin HTTPS), hecha por el mismo proveedor: Alfaro, Greco, CC Atocha, Fuentesol, Mendoza… Se ven mediocres, no desastrosas. Probablemente pagan una cuota a ese proveedor.
- **Las webs peores son casi siempre de los hostales más baratos.** Por ejemplo, Hostal Naranco cobra 20–40 €/noche y su web dice "próximamente WiFi". Los que tienen dinero ya tienen web decente con motor de reservas: el Hotel II Castillas usa Mirai; su dominio antiguo con frames solo redirige a una web moderna.

## Mejores prospectos

| # | Negocio | Datos | Problemas de su web | Contacto (público) |
|---|---|---|---|---|
| 1 | **Hostal Triana** (1★), C/ de la Salud 13, 1º | 40 habitaciones; familia Laya desde 1963; Kayak 8,8 con unas 2.200 opiniones | Sin HTTPS: Chrome avisa de "No seguro" justo donde se reserva. En el menú aparecen restos de otra web ("Medicina Estética", "Pie Diabético"). Diseño de 2014 | 91 532 68 12 · 608 60 37 74 · triana@hostaltriana.com · hostaltriana.com |
| 2 | **Hostal Residencia Fernández** (1★), C/ del León 10, 1º | Kayak 7,6 con unas 1.100 opiniones | La portada es un Flash que ya no carga: **se ve en blanco**. Sin HTTPS, no adaptada a móvil, copyright de 2010. Su email es de Hotmail | 91 429 56 37 · hostal-fernandez@hotmail.com · hostalfernandez.com |
| 3 | **Hostal López** (1★), C/ Huertas 54 | Barrio de las Letras; edificio reformado (según esMadrid) | Web de 2010, no adaptada a móvil, sin HTTPS. Las reservas van por un formulario PHP antiguo | 91 429 43 49 · reservas@hostallopez.com · hostallopez@telefonica.net |
| 4 | **Diezmadrid Hostal**, C/ de la Cruz 26, 2ºD | Reservas por WuBook y WhatsApp; cobra parking a 19 €/día | Imágenes rotas en la portada, sin HTTPS, no adaptada a móvil, copyright de 2013 (hecha con el constructor de GoDaddy) | 91 772 87 39 · WhatsApp 635 189 482 · reservas@diezmadrid.com |
| 5 | **Hotel 4C Puerta Europa** (2★), C/ Bravo Murillo 364 | 33 habitaciones; Kayak 8,0 con unas 2.160 opiniones. Es del mismo grupo que el 4C Bravo Murillo, así que **pueden ser dos webs** | Sin HTTPS, diseño de 2013, código para Internet Explorer | 91 571 23 71 · info@hotel-puertaeuropa.com |

Descartados por ahora: Hostal Naranco (precios de 20 €, poco presupuesto) y Hotel II Castillas (su web real ya es moderna).

## Argumento de venta para este nicho

Booking se lleva cerca del 15–20 % de cada reserva [Probable]: las demandas colectivas hablan de comisiones de hasta el 20 %, y la CNMC estima que Booking tiene entre el 70 % y el 90 % del mercado en España. Cuenta de ejemplo:

- Un hostal de 40 habitaciones a unos 60 € de media y con un 80 % de ocupación factura unos **700.000 €/año** [Supuesto].
- Si el 60 % de las reservas le llega por Booking, paga unos **70.000 €/año** en comisiones.
- Pasar solo un 5 % de esas reservas a la web propia le ahorra unos 3.500 €/año: **más de lo que cuesta la web**.

## Fuentes

- Registro de alojamientos turísticos, Comunidad de Madrid: <https://datos.comunidad.madrid/catalogo/dataset/alojamientos_turisticos>
- Hostal Triana en Kayak: <https://www.es.kayak.com/Madrid-Hoteles-Hostal-Triana.141713.ksp>
- Hostal Triana en esMadrid: <https://www.esmadrid.com/alojamientos/triana>
- Hostal Fernández en Kayak: <https://www.es.kayak.com/Madrid-Hoteles-Hostal-Fernandez.519512.ksp>
- Hostal Fernández en esMadrid: <https://www.esmadrid.com/alojamientos/hostal-residencia-fernandez>
- Hostal López en esMadrid: <https://www.esmadrid.com/alojamientos/lopez>
- 4C Puerta Europa en Kayak: <https://www.es.kayak.com/Madrid-Hoteles-4C-Puerta-Europa.347728.ksp>
- 4C Puerta Europa en Rumbo: <https://www.rumbo.es/hoteles/espana/madrid/4c-puerta-europa_hid-1557284>
- Demanda colectiva contra Booking: <https://es.ara.cat/economia/industria/10-000-hoteles-booking-macrodemanda-europea-clausulas-abusivas_1_5479056.html>
- Multa de la CNMC a Booking: <https://www.vozpopuli.com/economia/empresas/multa-booking-reservas.html>
