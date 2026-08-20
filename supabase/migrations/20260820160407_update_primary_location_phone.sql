-- Keep the existing Bacoor studio record in sync with the confirmed contact number.
update public.locations
set phone = '+63 917 324 4355'
where slug = 'bacoor';
