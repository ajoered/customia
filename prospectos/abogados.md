# Despachos de abogados en Madrid: prospectos

**Método:** 45 webs de despachos independientes con 2 a 15 abogados, en áreas con asuntos de mucho valor: herencias, familia, accidentes, laboral, extranjería e inmobiliario. Salieron de Yelp y de búsquedas web. Las pasé por `tools/audit_web.py` y las revisé a mano con capturas. Datos completos en `abogados-auditoria.csv`, con las columnas `valoracion_visual` y `nota_revision`.

## Resultados

- **Auditoría automática: casi ninguna web mala.** 0 % de webs reales con puntuación ≥ 40; el único caso era un falso positivo por protección anti-bots, ya corregido en el auditor.
- **Revisión visual: 10 de 45 (22 %) se ven claramente anticuadas o rotas.** Muchas tienen HTTPS y se adaptan al móvil, pero parecen de 2014. Aquí el auditor se queda corto y hay que mirar las capturas.
- **Sesgo:** las webs malas salieron casi todas de Yelp, donde están fichados despachos más antiguos. Los que aparecen arriba en Google ya tienen web moderna.
- **Saturación de agencias: alta.**
  - 11 de 45 (24 %) llevan el crédito de una agencia en el pie de página.
  - 25 tienen Google Tag Manager y 4 usan Google Ads.
  - Directorios y webs de captación ocupan los primeros puestos en Google.
- **Normas de publicidad de la abogacía:** Estatuto General (RD 135/2021, arts. 19-20) y Código Deontológico (art. 6). Prohíben:
  - prometer resultados (por ejemplo "98 % de éxito"),
  - usar testimonios o casos de clientes sin su autorización,
  - ofrecer servicios a víctimas de accidentes hasta pasados 45 días, salvo que ellas lo pidan,
  - usar emblemas del Colegio,
  - llamarse "especialista" sin acreditarlo.

  Además, obligan a indicar el Colegio al que se pertenece. **Ofrecer una web que cumpla estas normas es un buen argumento de venta.**
- **A favor:** los asuntos valen mucho dinero y deciden 1 o 2 socios.
- **En contra:** los despachos con web mala viven del boca a boca y no tienen prisa. Varios ya pagan a un proveedor, así que hay que ofrecerles migrar desde lo que tienen.

## Mejores prospectos

| # | Despacho | Problemas de su web | Teléfono | Email |
|---|---|---|---|---|
| 1 | **Villaluenga & Garrido**, C/ Donoso Cortés 83 (Chamberí). 2 socios y 4 colaboradores, desde 1993. Responsabilidad civil, seguros, penal y familia | Foto de banco de imágenes (un mazo), sin botón de llamada. Logo y menú casi ilegibles sobre azul marino. Una lista de palabras en vez de servicios | 91 543 04 86 · 91 543 13 02 · 691 84 08 53 | (solo formulario) |
| 2 | **González y Silva & Co.**, C/ Juan Bravo 20 (Salamanca). Desde 1985, con economistas. Herencias | Diseño de 2014. Contenido caducado ("URGENTE: CASO BANKIA"). En el móvil, la primera pantalla es solo teléfono y menú | 91 577 72 31 · 684 38 40 23 | abogados@gonzalezysilva.com |
| 3 | **Lordén & Lordén**, C/ Diego de León 69 (Salamanca). Desde 1996. Sucesiones y familia | La imagen principal es un banner de un premio de 2018 que en el móvil no se lee. Tres teléfonos amontonados y ningún botón claro | 91 402 80 69 · 91 309 14 75 · 670 95 63 07 | info@lordenabogados.es |
| 4 | **Segarri Abogados**, C/ Pensamiento 17 (Tetuán). Despidos, divorcios, herencias | Sin HTTPS ("No seguro"). Error de Google Maps en el móvil. WordPress de 2018 y una analítica que ya no recoge datos | 690 72 39 03 · 606 17 18 57 | segarri@segarri.com |
| 5 | **Destreza Legal**, C/ Cea Bermúdez 14 (Chamberí). Herencias, civil, deudas | En el móvil la palabra "Bienveni-do" sale partida. WordPress de 2019 sin actualizar. **Pagan Google Ads, así que la web les cuesta dinero cada día** | 91 219 62 58 · 654 05 47 49 | info@destrezalegal.com |
| 6 | **Bufete Álvarez Pérez**, C/ Velázquez 57 (Salamanca). Desde 2005 | Una ventana emergente tapa la portada. No dice en qué áreas trabaja. Maquetada con tablas antiguas | 695 10 07 54 | madrid@bufetealvarezperez.com |
| 7 | **Bufete Herrador**, C/ Ibiza 3 (Retiro). Desde 1989. Daños y responsabilidad civil | En el móvil el titular y el botón salen cortados. Copyright de 2015. Plantilla genérica | 91 557 29 90 | despacho@bufeteherrador.com |
| 8 | **De Santa Ana Abogados**, C/ Sagasta 8 | **La web está caída** (muestra un error) | — | — · Antes de llamar, comprueba que sigue activo |

No encontré número de reseñas de Google para ninguno.
