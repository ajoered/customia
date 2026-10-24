# Clínicas dentales independientes (Madrid y noroeste): prospectos

**Método:**
- **Muestra:** 62 clínicas independientes con dominio propio, por zonas:

  | Zona | Clínicas |
  |---|---|
  | Chamberí | 12 |
  | Salamanca | 11 |
  | Chamartín | 10 |
  | Retiro | 6 |
  | Moncloa | 5 |
  | Majadahonda | 5 |
  | Las Rozas | 5 |
  | Pozuelo | 4 |
  | Alcobendas | 4 |

- **Fuentes:** el directorio Masquemédicos y dominios comprobados a mano.
- **Fuera de la muestra:** las cadenas (Milenium, Adeslas, Cleardent, Moonz…).
- **Revisión:** todas las webs pasaron por `tools/audit_web.py` y revisé a mano las capturas de las 62, en ordenador y en móvil.

Datos completos en `clinicas-dentales-auditoria.csv`.

## Resultados

- **Puntuación automática ≥ 40: 1 de 61 medibles (2 %).** La media es 7: casi todas tienen HTTPS y se adaptan al móvil.
- **Revisión visual ≥ 4: 12 de 62 (19 %).** 4 tienen nota 5, y dos de ellas en realidad no tienen web.
- **Dominios perdidos: 13 de unos 75** que aparecen en directorios. 8 ya no existen, 1 es spam de tragaperras, 2 están aparcados y 2 dan error.
- **Agencias: nicho saturado.**
  - Solo 3 de 60 webs llevan firma de agencia.
  - Pero 9 usan Google Ads y 29 Google Tag Manager.
  - Hay muchas agencias dentales buscando clientes en Madrid: UpDent, Comunicación Dental, Prismadent, Publidental…
- **10 de 60 usan email de Gmail o Hotmail.**

## Normas de publicidad sanitaria (afectan a la web)

**Comprobar que siguen vigentes:** las fuentes son un protocolo de inspección de 2018 y el código del Colegio de 2013. El decreto se modificó en 2023 (Decreto 205/2023).

- **Número de registro sanitario ("CS…") en la publicidad:** lo exige el Decreto 51/2006 de la Comunidad de Madrid (art. 21.b). **Solo 6 de 60 portadas lo muestran**, aunque solo revisé la portada. Es un gancho de venta concreto: *"tu web no cumple la norma"*.
- **Ofertas con el precio completo:** lo exige la Ley 11/1998 (art. 14.2). Un mal ejemplo: un popup de "implante + corona 990 €" sin más detalle.
- **Código ético del Colegio de Dentistas de Madrid (COEM):**
  - Prohíbe prometer resultados (arts. 39 y 55).
  - Las fotos de "antes y después" exigen consentimiento explícito del paciente o anonimato (art. 87). **15 de 60 webs tienen galerías así.**

## Mejores prospectos

| Clínica | Problemas de su web | Teléfono | Email | Servicios |
|---|---|---|---|---|
| **Cabeza Ferrer** (Majadahonda, chalet). 3 dentistas y 3 enfermeras | **En el móvil se ve la web de escritorio en miniatura.** Diseño de 2012, vídeo en formato .avi, sin cita online y email de Gmail | 91 638 32 73 · 91 639 10 57 | clinicacabezaferrer@gmail.com | Implantes, ortodoncia, periodoncia, estética facial, pacientes extranjeros |
| **Rafael Menéndez** (C/ Ayala 43, Salamanca). Otra sede en Santander | **Su dominio solo muestra el nombre**, sin contenido. Los directorios enlazan ahí como "web" | 91 376 68 83 · 609 60 62 22 (de Masquemédicos) | — | Implantes, ortodoncia, periodoncia, cirugía |
| **Instituto González Iglesias / Ríos Rosas** (Chamberí). 40 años | Wix de 2014. En el iPhone se ve la versión de escritorio con el texto ilegible. Enlaces a Google+ | 91 554 11 70 | dentalriosrosas@gmail.com | Implantes, ortodoncia, periodoncia, odontopediatría |
| **Ortodoncia MGD** (Av. América 45). Desde 1995, unos 6 dentistas | **Unos 70 enlaces ocultos a casinos en el pie** (probable hackeo). Portada vacía | 91 519 92 95 · 646 40 40 74 | info@ortodonciamgd.com | Ortodoncia, cirugía maxilofacial, ATM |
| **Dental Habana 17** (Chamartín) | Plantilla de 2015, botón de Google+ y slider genérico. **Pagan Google Ads** | 91 562 56 38 · 628 21 41 48 | clinica@dentalhabana.com | Implantes con cirugía guiada, ortodoncia |
| **Clínica Sierra** (P.º Habana 4, Chamartín) | El logo pisa el titular, el menú está descolocado, tarda 4,6 s en cargar y tiene erratas | 91 562 92 61 · 636 55 79 97 | consulta@clinicasierra.es | Todas las especialidades |
| **Bonadent** (Argüelles). "Pioneros en implantes desde 1989" | Muestra un aviso de "navegador obsoleto", tarda 7 s en responder y el dominio antiguo da error | 91 549 70 94 | — | Implantes, Invisalign |
| **Clínica Sada** (C/ Velázquez 55, Salamanca). Unos 7 dentistas | Aviso de "navegador obsoleto", portada saturada de logos de aseguradoras y sin email visible. Pagan Google Ads | 91 576 05 08 · 629 40 46 90 | — | Implantes, carillas, cirugía oral |

No encontré número de reseñas de Google. Las opiniones citadas son de Masquemédicos.
