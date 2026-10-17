// Shared HEC TECH product catalog lookup. D1 contains reusable product facts
// only; personal inventory data is never sent to this Worker.
const allowedOrigin = 'https://hectorkid.github.io';

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers });
}

function normalize(value) {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function modelToken(query) {
  const tokens = String(query || '').match(/\b(?=[a-z0-9-]*\d)[a-z0-9]+(?:-[a-z0-9]+)*\b/gi) || [];
  return tokens.sort((a, b) => b.length - a.length)[0] || String(query || '').trim();
}

function product(row) {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand || '',
    model: row.model || '',
    barcode: row.barcode || '',
    category: row.category || '',
    productUrl: row.product_url || '',
    photoUrl: row.photo_url || '',
    manualUrl: row.manual_url || ''
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = origin === allowedOrigin;
    const headers = {
      'Access-Control-Allow-Origin': allowed ? origin : allowedOrigin,
      'Vary': 'Origin',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (!allowed) return json({ error: 'Origin not allowed' }, 403, headers);

    const url = new URL(request.url);
    if (url.pathname !== '/product-lookup' || !['GET', 'POST'].includes(request.method)) {
      return json({ error: 'Not found' }, 404, headers);
    }
    if (!env.PRODUCT_CATALOG) return json({ error: 'Product catalog is not configured yet' }, 503, headers);

    if (request.method === 'POST') {
      if (!env.CATALOG_WRITE_TOKEN || request.headers.get('Authorization') !== `Bearer ${env.CATALOG_WRITE_TOKEN}`) {
        return json({ error: 'Catalog write is not authorized' }, 401, headers);
      }
      try {
        const input = await request.json();
        const fields = ['name', 'brand', 'model', 'barcode', 'category', 'productUrl', 'photoUrl', 'manualUrl'];
        if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !fields.includes(key))) {
          return json({ error: 'Only reusable product details are accepted' }, 400, headers);
        }
        const clean = {};
        for (const field of fields) {
          const value = input[field] == null ? '' : String(input[field]).trim();
          const max = field === 'name' ? 180 : field === 'category' ? 80 : ['productUrl', 'photoUrl', 'manualUrl'].includes(field) ? 2048 : 120;
          if (value.length > max) return json({ error: `${field} is too long` }, 400, headers);
          clean[field] = value;
        }
        clean.barcode = clean.barcode.replace(/[ -]/g, '');
        if (!clean.name || (!clean.model && !clean.barcode)) {
          return json({ error: 'A product name and model or barcode are required' }, 400, headers);
        }
        if (clean.barcode && !/^\d{8,14}$/.test(clean.barcode)) {
          return json({ error: 'Barcode must be 8–14 digits' }, 400, headers);
        }
        for (const field of ['productUrl', 'photoUrl', 'manualUrl']) {
          if (clean[field]) {
            let parsed;
            try { parsed = new URL(clean[field]); } catch { return json({ error: `${field} must be an HTTPS link` }, 400, headers); }
            if (parsed.protocol !== 'https:') return json({ error: `${field} must be an HTTPS link` }, 400, headers);
          }
        }

        const brandKey = normalize(clean.brand);
        const modelKey = normalize(clean.model);
        const searchKey = normalize([clean.name, clean.brand, clean.model].join(' '));
        const existingQuery = clean.barcode
          ? env.PRODUCT_CATALOG.prepare('SELECT id FROM products WHERE barcode = ? LIMIT 1').bind(clean.barcode)
          : env.PRODUCT_CATALOG.prepare('SELECT id FROM products WHERE brand_key = ? AND model_key = ? LIMIT 1').bind(brandKey, modelKey);
        const existing = (await existingQuery.all()).results?.[0];
        if (existing) {
          await env.PRODUCT_CATALOG.prepare(
            `UPDATE products SET name = ?, brand = ?, model = ?, barcode = ?, category = ?, product_url = ?, photo_url = ?, manual_url = ?,
             brand_key = ?, model_key = ?, name_key = ?, search_key = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
          ).bind(clean.name, clean.brand, clean.model, clean.barcode, clean.category, clean.productUrl, clean.photoUrl, clean.manualUrl,
            brandKey, modelKey, normalize(clean.name), searchKey, existing.id).run();
          return json({ ok: true, id: existing.id, action: 'updated' }, 200, headers);
        }
        const id = crypto.randomUUID();
        await env.PRODUCT_CATALOG.prepare(
          `INSERT INTO products (id, name, brand, model, barcode, category, product_url, photo_url, manual_url,
           brand_key, model_key, name_key, search_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(id, clean.name, clean.brand, clean.model, clean.barcode, clean.category, clean.productUrl, clean.photoUrl, clean.manualUrl,
          brandKey, modelKey, normalize(clean.name), searchKey).run();
        return json({ ok: true, id, action: 'created' }, 201, headers);
      } catch (error) {
        return json({ error: 'Catalog record could not be saved' }, 400, headers);
      }
    }

    const barcode = (url.searchParams.get('barcode') || '').trim().replace(/[ -]/g, '');
    const barcodeMode = barcode.length > 0;
    if (barcodeMode && !/^\d{8,14}$/.test(barcode)) {
      return json({ error: 'Barcode must be 8–14 digits' }, 400, headers);
    }
    const query = (barcodeMode ? barcode : (url.searchParams.get('model') || '').trim()).slice(0, 100);
    if (query.length < 3) return json({ error: 'Enter a model number or barcode' }, 400, headers);

    try {
      let rows;
      if (barcodeMode) {
        const result = await env.PRODUCT_CATALOG.prepare(
          'SELECT id, name, brand, model, barcode, category, product_url, photo_url, manual_url FROM products WHERE barcode = ? LIMIT 1'
        ).bind(barcode).all();
        rows = result.results || [];
      } else {
        const token = modelToken(query);
        const key = normalize(token);
        const phrase = normalize(query);
        // Search normalized model/name/brand keys. A bounded result set keeps
        // the public endpoint predictable as the shared catalog grows.
        const result = await env.PRODUCT_CATALOG.prepare(
          `SELECT id, name, brand, model, barcode, category, product_url, photo_url, manual_url
             FROM products
            WHERE model_key = ? OR model_key LIKE ? OR name_key LIKE ? OR search_key LIKE ?
            ORDER BY CASE WHEN model_key = ? THEN 0 WHEN model_key LIKE ? THEN 1 ELSE 2 END,
                     CASE WHEN brand_key <> '' THEN 0 ELSE 1 END,
                     name COLLATE NOCASE
            LIMIT 30`
        ).bind(key, key + '%', '%' + phrase + '%', '%' + key + '%', key, key + '%').all();
        rows = result.results || [];
      }

      const matches = rows.map(product).slice(0, 10);
      return json({
        query,
        matches,
        matchStatus: barcodeMode ? 'verified-catalog-barcode' : 'shared-product-catalog',
        catalog: 'hec-tech'
      }, 200, headers);
    } catch (error) {
      return json({ error: 'Product catalog lookup failed. Try again shortly.' }, 502, headers);
    }
  }
};
