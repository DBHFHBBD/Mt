exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const total = Number(body.total || 0);
    if (!total || total <= 0) {
      return json(400, { error: 'Valor inválido.' });
    }

    const creds = buildCredentials();
    if (!creds.length) {
      return json(500, {
        error: 'Configure HURA_SECRET_KEY, HURA_PUBLIC_KEY e HURA_COMPANY_ID no Netlify.'
      });
    }

    const cleanPhone = digits(body.phone);
    const cleanDoc = digits(body.document);
    const cleanZip = digits(body.zipcode);
    const companyId = process.env.HURA_COMPANY_ID || process.env.COMPANY_ID || '';

    const payload = {
      company_id: companyId,
      companyId,
      amount: total,
      amountInCents: Math.round(total * 100),
      paymentMethod: 'pix',
      payment_method: 'pix',
      method: 'pix',
      customer: {
        name: body.name,
        email: body.email,
        phone: cleanPhone,
        document: cleanDoc,
        zipcode: cleanZip,
        zipCode: cleanZip,
        address: {
          street: body.street || '',
          number: body.number || '',
          complement: body.complement || '',
          neighborhood: body.neighborhood || '',
          city: body.city || '',
          state: (body.state || '').toUpperCase(),
          zipcode: cleanZip,
          zipCode: cleanZip
        }
      },
      items: [
        {
          title: body.productName || 'Livro Infantil Bilíngue Interativo com Som',
          quantity: Number(body.quantity || 1),
          unitPrice: Number(body.unitPrice || total),
          unit_price: Number(body.unitPrice || total),
          tangible: true
        }
      ],
      shipping: {
        address: {
          street: body.street || '',
          number: body.number || '',
          complement: body.complement || '',
          neighborhood: body.neighborhood || '',
          city: body.city || '',
          state: (body.state || '').toUpperCase(),
          zipcode: cleanZip,
          zipCode: cleanZip
        }
      },
      metadata: {
        color: body.color || '',
        source: 'futurekids-netlify-checkout'
      },
      externalReference: `fk-${Date.now()}`,
      external_reference: `fk-${Date.now()}`
    };

    let lastError = null;
    for (const auth of creds) {
      const response = await fetch('https://api.hurapayments.com.br/v1/payment-transaction/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify(payload)
      });

      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { raw: text };
      }

      if (response.ok) {
        return json(200, data);
      }

      lastError = {
        status: response.status,
        data
      };
    }

    return json(lastError?.status || 500, {
      error: lastError?.data?.message || lastError?.data?.error || 'Falha ao criar transação na Hura.',
      details: lastError?.data || null
    });
  } catch (error) {
    return json(500, { error: error.message || 'Erro interno.' });
  }
};

function buildCredentials() {
  const list = [];
  const secret = process.env.HURA_SECRET_KEY || '';
  const pub = process.env.HURA_PUBLIC_KEY || '';
  const apiUser = process.env.HURA_API_USER || '';
  const apiPassword = process.env.HURA_API_PASSWORD || '';

  if (secret && pub) list.push(Buffer.from(`${secret}:${pub}`).toString('base64'));
  if (secret) list.push(Buffer.from(`${secret}:`).toString('base64'));
  if (apiUser || apiPassword) list.push(Buffer.from(`${apiUser}:${apiPassword}`).toString('base64'));

  return [...new Set(list)].filter(Boolean);
}

function digits(value) {
  return String(value || '').replace(/\D/g, '');
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify(body)
  };
}
