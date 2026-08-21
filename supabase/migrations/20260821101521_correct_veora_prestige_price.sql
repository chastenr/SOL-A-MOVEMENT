-- Correct the confirmed Veora Prestige standard monthly rate and preserve
-- the advertised 10% September promotional discount.
update public.packages
set
  price_centavos = 630000,
  original_price_centavos = 700000,
  conditions = array[
    'September promo price: ₱6,300/month',
    'Non-transferable'
  ],
  updated_at = now()
where slug = '12-month-unlimited';
