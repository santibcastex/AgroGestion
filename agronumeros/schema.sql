-- ============================================================
-- AGRONUMEROS — Schema completo
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- ── 1. CULTIVOS ──────────────────────────────────────────────
create table if not exists cultivos (
  id          serial primary key,
  codigo      text not null unique,  -- 'soja', 'maiz', 'trigo', etc.
  nombre      text not null
);

insert into cultivos (codigo, nombre) values
  ('soja',     'Soja'),
  ('maiz',     'Maíz'),
  ('trigo',    'Trigo'),
  ('girasol',  'Girasol'),
  ('sorgo',    'Sorgo')
on conflict (codigo) do nothing;

-- ── 2. INDICADORES (master de indicadores globales) ──────────
create table if not exists indicadores (
  id      serial primary key,
  codigo  text not null unique,
  nombre  text not null
);

insert into indicadores (codigo, nombre) values
  ('sp500',           'S&P 500'),
  ('dow',             'Dow Jones'),
  ('nasdaq',          'Nasdaq'),
  ('vix',             'VIX'),
  ('merval',          'Merval'),
  ('dolar_oficial',   'Dólar Oficial'),
  ('dolar_blue',      'Dólar Blue'),
  ('dolar_mep',       'Dólar MEP'),
  ('dolar_ccl',       'Dólar CCL'),
  ('soja_chicago',    'Soja Chicago'),
  ('maiz_chicago',    'Maíz Chicago'),
  ('trigo_chicago',   'Trigo Chicago'),
  ('oro',             'Oro'),
  ('plata',           'Plata'),
  ('petroleo_wti',    'Petróleo WTI'),
  ('bitcoin',         'Bitcoin'),
  ('ethereum',        'Ethereum')
on conflict (codigo) do nothing;

-- ── 3. PRECIOS_GLOBALES ──────────────────────────────────────
create table if not exists precios_globales (
  id            serial primary key,
  indicador_id  int not null references indicadores(id),
  fecha         date not null,
  valor         numeric(18,4),
  unique(indicador_id, fecha)
);

-- ── 4. PRECIOS_AGRO (pizarras diarias por zona) ──────────────
create table if not exists precios_agro (
  id          serial primary key,
  cultivo_id  int not null references cultivos(id),
  zona        text not null,  -- 'rosario', 'bahia_blanca', 'darsena', 'quequen'
  fecha       date not null,
  precio_ars  numeric(12,2),
  precio_usd  numeric(10,2),
  unique(cultivo_id, zona, fecha)
);

-- ── 5. RETENCIONES ───────────────────────────────────────────
create table if not exists retenciones (
  id              serial primary key,
  cultivo_id      int not null references cultivos(id),
  porcentaje      numeric(5,2) not null,
  vigente_desde   date not null,
  observaciones   text
);

insert into retenciones (cultivo_id, porcentaje, vigente_desde)
select id, 33, '2024-01-01' from cultivos where codigo = 'soja'
on conflict do nothing;
insert into retenciones (cultivo_id, porcentaje, vigente_desde)
select id, 12, '2024-01-01' from cultivos where codigo = 'maiz'
on conflict do nothing;
insert into retenciones (cultivo_id, porcentaje, vigente_desde)
select id, 12, '2024-01-01' from cultivos where codigo = 'trigo'
on conflict do nothing;
insert into retenciones (cultivo_id, porcentaje, vigente_desde)
select id, 7, '2024-01-01' from cultivos where codigo = 'girasol'
on conflict do nothing;
insert into retenciones (cultivo_id, porcentaje, vigente_desde)
select id, 12, '2024-01-01' from cultivos where codigo = 'sorgo'
on conflict do nothing;

-- ── 6. EXPORTACIONES_AGRO ────────────────────────────────────
create table if not exists exportaciones_agro (
  id          serial primary key,
  cultivo_id  int not null references cultivos(id),
  mes         date not null,  -- primer día del mes
  valor_fob_usd numeric(18,2),
  unique(cultivo_id, mes)
);

-- ── 7. SERIES_DIARIAS ────────────────────────────────────────
create table if not exists series_diarias (
  id      serial primary key,
  codigo  text not null,  -- 'badlar_privados', 'badlar_total'
  fecha   date not null,
  valor   numeric(10,4),
  unique(codigo, fecha)
);

-- ── 8. AGUA_UTIL ─────────────────────────────────────────────
create table if not exists agua_util (
  id          serial primary key,
  fecha       date not null,
  provincia   text not null,
  depto       text not null,
  lat         numeric(9,6),
  lon         numeric(9,6),
  s1          numeric(6,2),   -- soja 1ra
  s2          numeric(6,2),   -- soja 2da
  m11         numeric(6,2),   -- maiz temprano
  m12         numeric(6,2),
  m21         numeric(6,2),
  m22         numeric(6,2),
  a1          numeric(6,2),   -- algodón
  a2          numeric(6,2),
  tl          numeric(6,2),   -- trigo largo
  tc          numeric(6,2),   -- trigo corto
  link        text,
  unique(fecha, provincia, depto)
);

-- ── 9. MARGENES_MAGYP ────────────────────────────────────────
create table if not exists margenes_magyp (
  id                    serial primary key,
  periodo               text not null,   -- 'AAAA-MM'
  region                text not null,
  cultivo               text not null,
  precio                numeric(12,2),
  rinde                 numeric(8,2),
  ingreso_bruto         numeric(12,2),
  comercializacion      numeric(12,2),
  labores               numeric(12,2),
  semillas              numeric(12,2),
  fitosanitarios        numeric(12,2),
  fertilizantes         numeric(12,2),
  gastos_directos       numeric(12,2),
  estructura            numeric(12,2),
  estructura_arr        numeric(12,2),
  alquiler              numeric(12,2),
  margen_bruto          numeric(12,2),
  margen_neto_propio    numeric(12,2),
  margen_neto_arrendado numeric(12,2),
  unique(periodo, region, cultivo)
);

-- ── 10. GANADERIA_EXISTENCIAS_BOVINAS ────────────────────────
create table if not exists ganaderia_existencias_bovinas (
  id            serial primary key,
  anio          int not null,
  provincia     text not null,
  departamento  text not null,
  vacas         int,
  vaquillonas   int,
  novillos      int,
  novillitos    int,
  terneros      int,
  terneras      int,
  toros         int,
  toritos       int,
  bueyes        int,
  unique(anio, provincia, departamento)
);

-- ── 11. PRECIOS_GANADERIA_SEMANAL ────────────────────────────
create table if not exists precios_ganaderia_semanal (
  id              serial primary key,
  semana          date not null,   -- lunes de la semana
  categoria       text not null,   -- 'novillo', 'vaca', 'ternero', etc.
  precio_promedio numeric(10,2),
  cabezas_total   int,
  unique(semana, categoria)
);

-- ── 12. INDICES_GANADEROS ────────────────────────────────────
create table if not exists indices_ganaderos (
  id      serial primary key,
  nombre  text not null,   -- 'INMAG'
  fecha   date not null,
  valor   numeric(12,4),
  unique(nombre, fecha)
);

-- ── 13. REMATES ──────────────────────────────────────────────
create table if not exists remates (
  id                serial primary key,
  consignataria_id  int,
  nombre            text,
  fecha             date not null,
  hora              time,
  lugar             text,
  localidad         text,
  provincia         text,
  region            text,
  tipo_principal    text,   -- 'invernada', 'cria', 'feedlot', etc.
  tipo_venta        text,
  modalidad         text,   -- 'presencial', 'online', 'mixto'
  canal_tv          text,
  url_streaming     text,
  razas             text,
  total_cabezas     int,
  categorias        text,
  descripcion       text,
  url_fuente        text,
  url_flyer         text,
  flyer_tipo        text,
  activo            boolean default true
);

-- ── 14. CONSIGNATARIAS ───────────────────────────────────────
create table if not exists consignatarias (
  id            serial primary key,
  nombre        text not null,
  nombre_corto  text,
  url_remates   text,
  activa        boolean default true
);

-- ── 15. VIEW: v_precios_liniers_resumen ──────────────────────
-- (se puebla via tabla base precios_ganaderia_semanal + lógica)
create or replace view v_precios_liniers_resumen as
select
  categoria,
  categoria as subcategoria,
  sum(cabezas_total) filter (where semana = (select max(semana) from precios_ganaderia_semanal)) as cabezas_ult_dia,
  avg(precio_promedio) filter (where semana = (select max(semana) from precios_ganaderia_semanal)) as precio_ult_dia,
  sum(cabezas_total) filter (where semana = (select max(semana) from precios_ganaderia_semanal where semana < (select max(semana) from precios_ganaderia_semanal))) as cabezas_sem_ant,
  avg(precio_promedio) filter (where semana = (select max(semana) from precios_ganaderia_semanal where semana < (select max(semana) from precios_ganaderia_semanal))) as precio_sem_ant,
  max(semana) as ultima_fecha
from precios_ganaderia_semanal
group by categoria
order by categoria;

-- ── 16. VIEW: v_rosgan_resumen ───────────────────────────────
create table if not exists rosgan_indices (
  id        serial primary key,
  fecha     date not null,
  tipo      text not null,  -- 'cria', 'invernada'
  categoria text not null,
  precio    numeric(12,2),
  unique(fecha, tipo, categoria)
);

create or replace view v_rosgan_resumen as
select fecha, tipo, categoria, precio
from rosgan_indices
order by fecha asc, tipo asc, categoria asc;

-- ── 17. ESTACIONES METEOROLOGICAS (base de v_clima_actual) ───
create table if not exists estaciones_meteorologicas (
  id                  serial primary key,
  nombre              text not null,
  provincia           text,
  localidad           text,
  fuente              text,
  url_fuente          text,
  lat                 numeric(9,6),
  lon                 numeric(9,6),
  temp_actual         numeric(5,1),
  temp_min            numeric(5,1),
  temp_max            numeric(5,1),
  sensacion_termica   numeric(5,1),
  humedad_actual      int,
  presion             numeric(7,1),
  viento_vel          numeric(6,1),
  viento_dir_grados   int,
  viento_max_dia      numeric(6,1),
  lluvia_total_dia    numeric(7,1),
  lluvia_ayer         numeric(7,1),
  lluvia_mensual      numeric(8,1),
  lluvia_anual        numeric(9,1),
  ultima_obs          timestamptz
);

create or replace view v_clima_actual as
select
  nombre,
  provincia,
  localidad,
  fuente,
  url_fuente,
  lat,
  lon,
  temp_actual,
  temp_min,
  temp_max,
  sensacion_termica,
  humedad_actual,
  presion,
  viento_vel,
  viento_dir_grados,
  viento_max_dia,
  lluvia_total_dia,
  lluvia_ayer,
  lluvia_mensual,
  lluvia_anual,
  ultima_obs
from estaciones_meteorologicas
where lat is not null and lon is not null;

-- ============================================================
-- RLS: habilitar lectura pública en todas las tablas
-- ============================================================
alter table cultivos                      enable row level security;
alter table indicadores                   enable row level security;
alter table precios_globales              enable row level security;
alter table precios_agro                  enable row level security;
alter table retenciones                   enable row level security;
alter table exportaciones_agro            enable row level security;
alter table series_diarias                enable row level security;
alter table agua_util                     enable row level security;
alter table margenes_magyp                enable row level security;
alter table ganaderia_existencias_bovinas enable row level security;
alter table precios_ganaderia_semanal     enable row level security;
alter table indices_ganaderos             enable row level security;
alter table remates                       enable row level security;
alter table consignatarias                enable row level security;
alter table rosgan_indices                enable row level security;
alter table estaciones_meteorologicas     enable row level security;

-- Políticas de lectura pública (anon)
create policy "public read" on cultivos                      for select using (true);
create policy "public read" on indicadores                   for select using (true);
create policy "public read" on precios_globales              for select using (true);
create policy "public read" on precios_agro                  for select using (true);
create policy "public read" on retenciones                   for select using (true);
create policy "public read" on exportaciones_agro            for select using (true);
create policy "public read" on series_diarias                for select using (true);
create policy "public read" on agua_util                     for select using (true);
create policy "public read" on margenes_magyp                for select using (true);
create policy "public read" on ganaderia_existencias_bovinas for select using (true);
create policy "public read" on precios_ganaderia_semanal     for select using (true);
create policy "public read" on indices_ganaderos             for select using (true);
create policy "public read" on remates                       for select using (true);
create policy "public read" on consignatarias                for select using (true);
create policy "public read" on rosgan_indices                for select using (true);
create policy "public read" on estaciones_meteorologicas     for select using (true);
