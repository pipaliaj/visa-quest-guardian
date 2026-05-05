insert into public.countries (code, name, flag_emoji) values
  ('HR', 'Croatia', '🇭🇷'),
  ('IS', 'Iceland', '🇮🇸'),
  ('FI', 'Finland', '🇫🇮'),
  ('DK', 'Denmark', '🇩🇰'),
  ('AT', 'Austria', '🇦🇹')
on conflict (code) do nothing;

insert into public.centres (country_id, city, provider, provider_url)
select c.id, 'Dublin', 'vfs'::provider_type,
  case c.code
    when 'HR' then 'https://visa.vfsglobal.com/irl/en/hrv/login'
    when 'IS' then 'https://visa.vfsglobal.com/irl/en/isl/login'
    when 'FI' then 'https://visa.vfsglobal.com/irl/en/fin/login'
    when 'DK' then 'https://visa.vfsglobal.com/irl/en/dnk/login'
    when 'AT' then 'https://visa.vfsglobal.com/irl/en/aut/login'
  end
from public.countries c
where c.code in ('HR','IS','FI','DK','AT')
  and not exists (
    select 1 from public.centres ce
    where ce.country_id = c.id and ce.city = 'Dublin'
  );