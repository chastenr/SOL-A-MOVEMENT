-- Veora Wellness — swap service catalog photography from outdoor lifestyle
-- shots to indoor studio photography matching each specific class type.
-- public.services is what getServices() actually serves now that migrations
-- are live (the static src/data/services.ts fallback only kicks in if the
-- database is unreachable) — src/data/images.ts was updated to match, but
-- that alone has no effect on the live site without this update too.

update public.services set
  image_src = 'https://images.pexels.com/photos/9288130/pexels-photo-9288130.jpeg',
  image_alt = 'Women using Pilates arcs on mats during an indoor class'
where slug = 'mat-pilates';

update public.services set
  image_src = 'https://images.pexels.com/photos/23095852/pexels-photo-23095852.jpeg',
  image_alt = 'A group of women practicing yoga poses together on mats in an indoor studio'
where slug = 'yoga';

update public.services set
  image_src = 'https://images.pexels.com/photos/5150457/pexels-photo-5150457.jpeg',
  image_alt = 'A woman leaning on the barre during an indoor barre class'
where slug = 'barre';

update public.services set
  image_src = 'https://images.pexels.com/photos/3768696/pexels-photo-3768696.jpeg',
  image_alt = 'A woman training with dumbbells alongside others in a bright indoor studio'
where slug = 'strength-hiit';

update public.services set
  image_src = 'https://images.pexels.com/photos/4534595/pexels-photo-4534595.jpeg',
  image_alt = 'A woman resting in child''s pose on a mat during a restorative indoor session'
where slug = 'recovery-restore';

update public.services set
  image_src = 'https://images.pexels.com/photos/5150509/pexels-photo-5150509.jpeg',
  image_alt = 'A dancer stretching at the barre during an indoor ballet rehearsal'
where slug = 'ballet';
