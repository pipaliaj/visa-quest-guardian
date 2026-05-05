update public.scraper_credentials sc
set centre_id = ce.id
from public.centres ce
join public.countries co on co.id = ce.country_id
where ce.city = 'Dublin'
  and (
    (sc.label ilike '%croatia%'    and co.code = 'HR') or
    (sc.label ilike '%iceland%'    and co.code = 'IS') or
    (sc.label ilike '%finland%'    and co.code = 'FI') or
    (sc.label ilike '%denmark%'    and co.code = 'DK') or
    (sc.label ilike '%netherlands%' and co.code = 'NL') or
    (sc.label ilike '%austria%'    and co.code = 'AT')
  );