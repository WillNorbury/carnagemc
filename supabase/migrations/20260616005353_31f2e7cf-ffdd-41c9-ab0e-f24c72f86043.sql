ALTER TABLE public.uptime_incidents ADD COLUMN IF NOT EXISTS incident_number bigserial;
CREATE UNIQUE INDEX IF NOT EXISTS uptime_incidents_number_unique ON public.uptime_incidents(incident_number);