-- =============================================================================
-- Agenda de Turnos — Centro de Salud Periurbano
-- Esquema de base de datos para Supabase (PostgreSQL) con Row Level Security.
--
-- Ejecutar este archivo completo en: Supabase Dashboard -> SQL Editor
-- (nueva query). Debe ejecutarse UNO por el usuario `postgres` (propietario),
-- que es quien controla el proyecto Supabase por defecto.
--
-- Documento de arquitectura (3 capas): la base de datos es la Capa de Datos.
-- RLS garantiza que cada usuario solo puede leer/escribir sus propias filas
-- (segmentación por auth.uid()), aunque comparta la misma conexión anónima.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- Extensiones necesarias
-- -----------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- =============================================================================
-- 1) TABLAS DEL DOMINIO
-- =============================================================================

-- Profesionales: catálogo público de lectura (el centro los mantiene).
-- El selector de turnos necesita verlos a todos: lectura pública para anon/autenticados.
create table if not exists public.profesionales (
  idProfesional  text primary key,
  nombre         text not null,
  apellido       text not null,
  especialidad   text not null check (char_length(especialidad) > 0),
  telefono       text not null check (telefono ~ '^[67][0-9]{7}$')
);

-- Pacientes: un registro por usuario autenticado (auth.users).
-- La clave externa user_id -> auth.users.id es la que RLS utiliza.
create table if not exists public.pacientes (
  idPaciente  uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users(id) on delete cascade,
  nombre      text not null,
  apellido    text not null,
  ci          text not null unique check (ci ~ '^[0-9]{5,9}([ ]?[A-Z]{2})?$'),
  telefono    text not null check (telefono ~ '^[67][0-9]{7}$'),
  correo      text not null check (correo ~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'),
  creado_en   timestamptz not null default now()
);

-- Turnos: pertenecen al usuario que los reservó (user_id) y apuntan al paciente
-- (idPaciente), que normalmente será su propia ficha de paciente.
create table if not exists public.turnos (
  idTurno       text primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  idPaciente    uuid not null references public.pacientes(idPaciente) on delete cascade,
  idProfesional text not null references public.profesionales(idProfesional),
estado         text not null default 'reservado' check (estado in ('reservado', 'cancelado')),
  fecha         date not null,
  hora          text not null check (hora ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  creado_en     timestamptz not null default now()
);

-- Índice único PARCIAL: impide dos turnos ACTIVOS en el mismo profesional/fecha/hora,
-- pero deja que un horario cancelado pueda volver a reservarse (el historial se
-- conserva con estado='cancelado' sin bloquear la agenda).
create unique index if not exists turnos_slot_unico_reservado
  on public.turnos (idProfesional, fecha, hora)
  where estado = 'reservado';

-- =============================================================================
-- 2) ROW LEVEL SECURITY
-- =============================================================================

-- Profesionales: lectura pública; escritura solo vía service_role (admin), no expuesta.
alter table public.profesionales enable row level security;
create policy "profesionales_lectura_publica"
  on public.profesionales
  for select
  using (true);

-- Pacientes: cada usuario opera SOLO sobre su propia fila (misma user_id que su JWT).
alter table public.pacientes enable row level security;

create policy "pacientes_select_propio"
  on public.pacientes
  for select
  using ((select auth.uid()) = user_id);

create policy "pacientes_insert_propio"
  on public.pacientes
  for insert
  with check ((select auth.uid()) = user_id);

create policy "pacientes_update_propio"
  on public.pacientes
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Los admins (claim app_metadata.role = 'admin' dentro del JWT) administran el catálogo.
create policy "pacientes_admin_todo"
  on public.pacientes
  for all
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Turnos: cada usuario solo ve/crea/actualiza sus propios turnos.
alter table public.turnos enable row level security;

create policy "turnos_select_propio"
  on public.turnos
  for select
  using ((select auth.uid()) = user_id);

create policy "turnos_insert_propio"
  on public.turnos
  for insert
  with check ((select auth.uid()) = user_id);

create policy "turnos_update_propio"
  on public.turnos
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "turnos_admin_todo"
  on public.turnos
  for all
  using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  with check (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- =============================================================================
-- 3) FUNCIONES RPC (accesso entre filas sin filtrar RLS)
--    CU02 - Disponibilidad: devuelve SOLO horarios libres. Es SECURITY DEFINER,
--    se ejecuta como el dueño (postgres), de modo que puede mirar la agenda
--    completa para calcular las horas libres, pero a los clientes les llega
--    únicamente la lista de horas; jamás datos de turnos de terceros.
-- =============================================================================

create or replace function public.get_disponibilidad(id_prof text, fecha_p date)
returns text[]
language sql
security definer
stable
set search_path = public
as $$
  select array(
    select to_char(h.hora, 'HH24:MI')
    from (values
      (time '08:00'), (time '09:00'), (time '10:00'), (time '11:00'),
      (time '14:00'), (time '15:00'), (time '16:00')
    ) as h(hora)
    where not exists (
      select 1
      from public.turnos t
      where t.idProfesional = id_prof
        and t.fecha = fecha_p
        and t.estado = 'reservado'
        and t.hora = to_char(h.hora, 'HH24:MI')
    )
  )
$$;

-- Se revoca el permiso de ejecución a anon/authenticated y se vuelve a otorgar
-- solo a authenticated: cualquiera logueado (o no) puede consultar horas libres,
-- mientras que la tabla turnos sigue protegida por RLS.
revoke execute on function public.get_disponibilidad(text, date) from public;
grant execute on function public.get_disponibilidad(text, date) to anon, authenticated;

-- =============================================================================
-- 4) SEED: profesionales del centro de salud
-- =============================================================================
insert into public.profesionales (idProfesional, nombre, apellido, especialidad, telefono) values
  ('PRF-001', 'Marcela', 'Rojas',      'Medicina General', '70011122'),
  ('PRF-002', 'Diego',   'Fernández',  'Pediatría',        '70033344'),
  ('PRF-003', 'Ana',     'Quispe',     'Odontología',      '70055566')
on conflict (idProfesional) do nothing;

commit;