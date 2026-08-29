# Paku Vet (móvil) — Agentes

## Antes de nada

Lee `paku-backend/specs/workspace.md` y `paku-backend/specs/constitution.md`.
Los repos Paku son hermanos en el workspace (este está en `Paku/paku-vet-dev/`).

## Rol

App móvil para allies / veterinarios en campo: aceptar órdenes, navegación, servicio en sitio,
tracking en vivo, chat con el dueño, historia clínica.

## Spec-Driven Development

- **Dominio y API**: canon en `paku-backend/specs/`. No replicar lógica de negocio.
- **Features de este repo**: spec → plan → tasks en `specs/`. Ver `specs/README.md`.
- Estado actual: `specs/status.md`.

## Convenciones

- React Native + Expo (EAS). Gestor: **pnpm** (hay `package-lock.json` obsoleto: ignorar / eliminar).
- Estado global con Zustand (`src/store/`). Capa API en `src/api/`.
- Docs propias: `ARCHITECTURE.md`, `COMMANDS.md`, `TROUBLESHOOTING.md`.
