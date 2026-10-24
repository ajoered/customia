# Cómo contactar a los negocios (y qué dice la ley)

## Resumen

**No mandes el primer contacto por email.** En España, un email comercial que el destinatario no ha pedido está prohibido, **también si el destinatario es una empresa**. Primero llama o pásate por el negocio, pide permiso para mandarles la propuesta y, cuando digan que sí, envía el email.

## Lo que dice la ley

| Canal | ¿Se puede usar para el primer contacto? | Base |
|---|---|---|
| Email, WhatsApp, SMS o formulario web | **No**, salvo que lo hayan pedido o autorizado antes | LSSI art. 21.1 [Seguro] |
| Llamada al teléfono del negocio | Sí, con un riesgo bajo | Ley 11/2022 art. 66.1.b [Probable, ver abajo] |
| Visita en persona | Sí | No es una comunicación electrónica [Seguro] |
| Carta por correo postal | Sí | La LSSI no cubre el correo postal [Seguro] |

**Email ([Seguro], texto del BOE):** el art. 21.1 de la LSSI prohíbe enviar *"comunicaciones publicitarias o promocionales por correo electrónico u otro medio de comunicación electrónica equivalente que previamente no hubieran sido solicitadas o expresamente autorizadas por los destinatarios"*. La propia ley define *destinatario* como *"persona física o jurídica"*, así que mandarlo a info@empresa.com no te libra. La única excepción es tener una relación de cliente previa (art. 21.2), que aquí no se da.

- **Multas:** una infracción leve llega hasta 30.000 €. Si los envíos son masivos o insistentes (varios correos al mismo destinatario), pasa a grave: de 30.001 € a 150.000 € (arts. 38 y 39 LSSI).
- **Casos reales:** la AEPD ha puesto multas de 800 € y de 12.000 € por correos promocionales sin consentimiento. Normalmente actúa porque alguien se queja.
- **Riesgo real para nosotros:** con 5–20 negocios, la probabilidad de multa es baja. Pero basta una queja de un dueño molesto, y hay una forma fácil y gratis de evitarlo.

**Llamadas ([Probable]):** el art. 66.1.b de la Ley General de Telecomunicaciones (Ley 11/2022) da a los *"usuarios finales"* el derecho a no recibir llamadas comerciales sin consentimiento, *"salvo que la comunicación pueda ampararse en otra base de legitimación"* del RGPD. Está pensado sobre todo para particulares, y la AEPD lo aplica con dureza a llamadas a consumidores.

- **Bajo riesgo:** llamar al teléfono público de un hotel, una clínica o un despacho para hablar de su web.
- **Más cuidado:** si el negocio es un autónomo y el número es su móvil personal, tiene más protección.
- **Cómo comprobarlo:** consultar con un abogado de protección de datos antes de llamar a escala (más de 50 llamadas al mes).

## El proceso que recomiendo

1. **Haz la demo antes de contactar.** Prepara el rediseño y graba un vídeo de 60 segundos comparando su web actual con la nueva, en móvil.
2. **Primer contacto: llamada o visita.** Un guion de 30 segundos:
   > "Hola, soy [tu nombre]. Hago webs para negocios de Madrid. Vi la web de [negocio] y, sin compromiso, les he preparado cómo podría quedar una versión nueva, sobre todo en el móvil, que es por donde entra la mayoría de clientes. ¿A qué email se la puedo mandar para que la vea el responsable?"

   Si dicen que sí, ya tienes su autorización expresa. Apunta la fecha, la hora y quién te la dio.
3. **Email de seguimiento,** que ya es legal porque lo han pedido. Incluye el enlace a la demo, el vídeo, 3 problemas concretos de su web actual (sacados de `tools/audit_web.py`) y un precio cerrado. Añade al pie una línea para darse de baja.
4. **Alternativa sin llamar:** una carta con 2 capturas de pantalla (antes y después) y un código QR a la demo. Cuesta un poco más, pero destaca y es 100 % legal.
5. **Si no hay respuesta:** como mucho un seguimiento por teléfono. Nada de secuencias automáticas de emails.

## La demo: cómo publicarla sin problemas

La demo usa su nombre, su logo y sus fotos. Para que no se pueda confundir con su web oficial:

- Ponla en una dirección difícil de adivinar dentro de **nuestro** dominio (por ejemplo `demo.nuestramarca.es/hostal-x-7f3a`). **Nunca** compres un dominio con su nombre.
- Pon `noindex` para que Google no la muestre, y una franja visible arriba: *"Propuesta de rediseño preparada para [Negocio]. No es la web oficial."*
- Bórrala si dicen que no o si pasan 30 días sin respuesta.
- No copies textos de otras webs. Reescribe el contenido. Sus propias fotos solo se usan dentro de la propuesta que les enseñas a ellos.

## Fuentes

- LSSI (Ley 34/2002), texto consolidado: <https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758>
- Ley 11/2022 General de Telecomunicaciones: <https://www.boe.es/buscar/act.php?id=BOE-A-2022-10757>
- Multa de 12.000 € por newsletter sin consentimiento: <https://lawwwing.com/blog-por-que-nos-necesitas-sancion-de-12-000e-por-no-recoger-el-consentimiento-para-la-newsletter/>
- Multas de la AEPD por correos publicitarios: <https://www.genbeta.com/actualidad/que-te-envien-correos-publicidad-que-te-dejen-rechazarlos-puede-salir-caro-a-quien-envia-aepd-multa/amp>
- Análisis de Fieldfisher sobre bases de datos B2B y la AEPD: <https://www.fieldfisher.com/es-es/locations/spain/insights/bases-datos-empresariales>
