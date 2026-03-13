const STORAGE_KEY = 'futurekids_checkout';
const UNIT_PRICE = 49.90;

const formatCurrency = value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const onlyDigits = (value = '') => value.replace(/\D/g, '');
const maskCpf = (value = '') => onlyDigits(value).slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
const maskPhone = (value = '') => onlyDigits(value).slice(0, 11).replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{4})$/, '$1-$2');
const maskZip = (value = '') => onlyDigits(value).slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');

function getState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}
function setState(next) {
  const state = { ...getState(), ...next, unitPrice: UNIT_PRICE, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

function populateFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const color = params.get('color');
  const qty = Number(params.get('qty') || '1');
  const update = {};
  if (color) update.color = color;
  if (qty && qty > 0) update.quantity = qty;
  if (Object.keys(update).length) setState(update);
}

function hydrateForm() {
  const state = getState();
  ['name', 'document', 'email', 'phone', 'zipcode', 'street', 'number', 'complement', 'neighborhood', 'city', 'state', 'color'].forEach(id => {
    const el = document.getElementById(id);
    if (el && state[id]) el.value = state[id];
  });
  document.getElementById('quantity').value = state.quantity || 1;
  updateSummary();
}

function updateSummary() {
  const qty = Math.max(1, Number(document.getElementById('quantity').value || 1));
  document.getElementById('quantity').value = qty;
  const total = Math.round(qty * UNIT_PRICE * 100) / 100;
  document.getElementById('unit-price').textContent = formatCurrency(UNIT_PRICE);
  document.getElementById('unit-price-inline').textContent = formatCurrency(UNIT_PRICE);
  document.getElementById('quantity-inline').textContent = String(qty);
  document.getElementById('total').textContent = formatCurrency(total);
  document.getElementById('product-color-preview').textContent = document.getElementById('color').value || '—';
  setState({ quantity: qty, color: document.getElementById('color').value || '' });
}

async function copyPixCode() {
  const el = document.getElementById('pix-code');
  await navigator.clipboard.writeText(el.value);
  const btn = document.getElementById('copy-pix');
  const old = btn.textContent;
  btn.textContent = 'Código copiado';
  setTimeout(() => btn.textContent = old, 1800);
}

function showError(message) {
  const box = document.getElementById('form-error');
  box.textContent = message;
  box.classList.remove('hidden');
}
function clearError() {
  document.getElementById('form-error').classList.add('hidden');
}

function collectPayload() {
  const qty = Math.max(1, Number(document.getElementById('quantity').value || 1));
  const payload = {
    name: document.getElementById('name').value.trim(),
    document: onlyDigits(document.getElementById('document').value),
    email: document.getElementById('email').value.trim(),
    phone: onlyDigits(document.getElementById('phone').value),
    zipcode: onlyDigits(document.getElementById('zipcode').value),
    street: document.getElementById('street').value.trim(),
    number: document.getElementById('number').value.trim(),
    complement: document.getElementById('complement').value.trim(),
    neighborhood: document.getElementById('neighborhood').value.trim(),
    city: document.getElementById('city').value.trim(),
    state: document.getElementById('state').value.trim().toUpperCase(),
    color: document.getElementById('color').value,
    quantity: qty,
    unitPrice: UNIT_PRICE,
    total: Math.round(qty * UNIT_PRICE * 100) / 100,
    productName: 'Livro Infantil Bilíngue Interativo com Som'
  };
  setState(payload);
  return payload;
}

function parseApiResponse(data) {
  const tx = data?.data || data?.transaction || data;
  const pixCode = tx?.pixCode || tx?.pix_code || tx?.emv || tx?.payload || tx?.copyPaste || tx?.copy_paste || tx?.qrCodeText || tx?.qr_code_text || tx?.brCode || tx?.pix?.code || tx?.pix?.copyPaste || '';
  const qrImage = tx?.qrCodeBase64 || tx?.qr_code_base64 || tx?.qrCodeImage || tx?.qr_code_image || tx?.pix?.qrCodeBase64 || '';
  const transactionId = tx?.id || tx?.transactionId || tx?.transaction_id || '';
  const status = tx?.status || 'pending';
  const expiresAt = tx?.expiresAt || tx?.expires_at || '';
  return { pixCode, qrImage, transactionId, status, expiresAt };
}

async function generatePix(payload) {
  const response = await fetch('/.netlify/functions/create-pix', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error('A função de pagamento não retornou JSON. Verifique se o deploy publicou a Netlify Function e as variáveis da Hura.');
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Falha ao gerar PIX.');
  }

  return parseApiResponse(data);
}

function renderPix(result, total) {
  document.getElementById('pix-panel').classList.remove('hidden');
  document.getElementById('pix-code').value = result.pixCode || '';
  const meta = document.getElementById('transaction-meta');
  meta.innerHTML = `<div><strong>Total:</strong> ${formatCurrency(total)}</div>${result.transactionId ? `<div><strong>ID da transação:</strong> ${result.transactionId}</div>` : ''}${result.status ? `<div><strong>Status:</strong> ${result.status}</div>` : ''}${result.expiresAt ? `<div><strong>Expira em:</strong> ${result.expiresAt}</div>` : ''}`;

  const canvas = document.getElementById('qr-canvas');
  if (result.qrImage) {
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = result.qrImage.startsWith('data:') ? result.qrImage : `data:image/png;base64,${result.qrImage}`;
  } else if (result.pixCode) {
    QRCode.toCanvas(canvas, result.pixCode, { width: 220, margin: 1 });
  }
  document.getElementById('pix-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function fetchAddressByZip() {
  const zip = onlyDigits(document.getElementById('zipcode').value);
  const help = document.getElementById('zipcode-help');
  if (zip.length !== 8) {
    help.textContent = 'Digite um CEP válido com 8 números.';
    help.className = 'field-help error';
    return;
  }
  help.textContent = 'Buscando endereço...';
  help.className = 'field-help';
  try {
    const response = await fetch(`https://viacep.com.br/ws/${zip}/json/`);
    const rawText = await response.text();
let data;
try {
  data = JSON.parse(rawText);
} catch (e) {
  throw new Error(rawText && rawText.trim().startsWith("<!DOCTYPE") ? "A função PIX não respondeu JSON. Normalmente isso acontece quando a rota /.netlify/functions/create-pix está sendo redirecionada para o index.html." : (rawText || "Resposta inválida da função PIX"));
}
    if (data.erro) throw new Error('CEP não encontrado.');

    document.getElementById('street').value = data.logradouro || '';
    document.getElementById('neighborhood').value = data.bairro || '';
    document.getElementById('city').value = data.localidade || '';
    document.getElementById('state').value = (data.uf || '').toUpperCase();
    if (!document.getElementById('complement').value && data.complemento) {
      document.getElementById('complement').value = data.complemento;
    }

    setState({
      zipcode: document.getElementById('zipcode').value,
      street: document.getElementById('street').value,
      neighborhood: document.getElementById('neighborhood').value,
      city: document.getElementById('city').value,
      state: document.getElementById('state').value,
      complement: document.getElementById('complement').value
    });

    help.textContent = 'Endereço preenchido automaticamente. Confira o número.';
    help.className = 'field-help success';
    document.getElementById('number').focus();
  } catch (err) {
    help.textContent = err.message || 'Não foi possível consultar o CEP agora.';
    help.className = 'field-help error';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  populateFromQuery();
  hydrateForm();

  document.getElementById('document').addEventListener('input', e => e.target.value = maskCpf(e.target.value));
  document.getElementById('phone').addEventListener('input', e => e.target.value = maskPhone(e.target.value));
  document.getElementById('zipcode').addEventListener('input', e => e.target.value = maskZip(e.target.value));
  document.getElementById('zipcode').addEventListener('blur', fetchAddressByZip);

  ['name', 'document', 'email', 'phone', 'zipcode', 'street', 'number', 'complement', 'neighborhood', 'city', 'state', 'color'].forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener('input', () => setState({ [id]: el.value }));
    el.addEventListener('change', () => {
      setState({ [id]: el.value });
      if (id === 'color') updateSummary();
    });
  });

  document.querySelectorAll('.qty-btn').forEach(btn => btn.addEventListener('click', () => {
    const input = document.getElementById('quantity');
    const current = Math.max(1, Number(input.value || 1));
    input.value = btn.dataset.action === 'plus' ? Math.min(10, current + 1) : Math.max(1, current - 1);
    updateSummary();
  }));

  document.getElementById('quantity').addEventListener('input', updateSummary);
  document.getElementById('copy-pix').addEventListener('click', copyPixCode);

  document.getElementById('checkout-form').addEventListener('submit', async event => {
    event.preventDefault();
    clearError();
    const btn = document.getElementById('generate-btn');
    const payload = collectPayload();
    btn.disabled = true;
    const old = btn.textContent;
    btn.textContent = 'Gerando PIX...';
    try {
      const result = await generatePix(payload);
      if (!result.pixCode && !result.qrImage) {
        throw new Error('A API respondeu, mas não retornou o código PIX em um formato reconhecido.');
      }
      renderPix(result, payload.total);
    } catch (err) {
      showError(err.message || 'Não foi possível gerar o PIX agora.');
    } finally {
      btn.disabled = false;
      btn.textContent = old;
    }
  });
});
