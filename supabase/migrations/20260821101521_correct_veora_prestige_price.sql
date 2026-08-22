-- Correct the confirmed Veora Prestige standard monthly rate and apply the
-- nine percent September pre-opening promotion.
update public.packages
set
  price_centavos = 637000,
  original_price_centavos = 700000,
  conditions = array[
    'September pre-opening price: ₱6,370/month',
    'Monthly payment',
    'Non-transferable'
  ],
  updated_at = now()
where slug = '12-month-unlimited';
