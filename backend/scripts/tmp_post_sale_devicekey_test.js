const fetch = require('node-fetch');

(async () => {
  try {
    const secret = process.argv[2];
    if (!secret) return console.error('Usage: node tmp_post_sale_devicekey_test.js <secret>');

    const payload = {
      items: [
        { product_id: '00000000-0000-0000-0000-000000000000', product_name: 'Test product', quantity: 1, unit_sell_price: 1000, unit_cost_price: 800 }
      ],
      total_amount: 1000,
      total_cost: 800,
      payment_method: 'cash'
    };

    const res = await fetch('http://localhost:4000/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Device ' + secret },
      body: JSON.stringify(payload)
    });

    console.log('STATUS', res.status, await res.text());
  } catch (e) { console.error(e); }
})();
