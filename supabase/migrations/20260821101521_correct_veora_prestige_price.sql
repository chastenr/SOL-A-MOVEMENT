-- Apply the confirmed Veora Prestige monthly rate without renaming it.
update public.packages
set
  price_centavos = 700000,
  original_price_centavos = 1000000,
  conditions = array[
    'Limited opening price: ₱7,000/month',
    'Save ₱3,000 every month',
    'Monthly payment',
    'Non-transferable'
  ],
  updated_at = now()
where slug = '12-month-unlimited';
