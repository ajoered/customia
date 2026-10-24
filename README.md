# customia

Rediseño de webs anticuadas para negocios de Madrid, como primer paso para ofrecerles después soluciones con IA hechas a medida.

## Estructura

- `estudio/`: estudio de mercado, elección de nichos y cómo contactar a los negocios cumpliendo la ley.
- `prospectos/`: auditorías de webs por nicho (CSV) y lista de negocios concretos.
- `tools/audit_web.py`: puntúa de 0 a 100 lo anticuada que está una web y explica por qué.
  - Una web: `python3 tools/audit_web.py https://ejemplo.es`
  - Una lista (una URL por línea): `python3 tools/audit_web.py --csv urls.txt > auditoria.csv`
- `tools/screenshot.js`: capturas de pantalla en ordenador y en móvil.
  - Uso: `node tools/screenshot.js https://ejemplo.es capturas/ nombre`
  - Necesita Playwright.
