async function call(method, url, body) {
  const multipart = typeof FormData !== 'undefined' && body instanceof FormData;
  const res = await fetch('/api' + url, {
    method,
    headers: body && !multipart ? { 'content-type': 'application/json' } : undefined,
    body: body ? multipart ? body : JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

export const api = {
  state: () => call('GET', '/state'),
  reference: () => call('GET', '/reference'),
  createCloset: (body) => call('POST', '/closets', body),
  updateCloset: (id, body) => call('PATCH', `/closets/${id}`, body),
  deleteCloset: (id) => call('DELETE', `/closets/${id}`),
  addBottles: (body) => {
    if (!body.photo) return call('POST', '/bottles', body);
    const form = new FormData();
    Object.entries(body).forEach(([key, value]) => {
      if (key !== 'photo') form.append(key, value != null && typeof value === 'object' ? JSON.stringify(value) : String(value ?? ''));
    });
    form.append('photo', body.photo, body.photo.name || 'wine-photo.webp');
    return call('POST', '/bottles', form);
  },
  updateBottle: (id, body) => call('PATCH', `/bottles/${id}`, body),
  moveBottle: (id, slot) => call('POST', `/bottles/${id}/move`, { slot }),
  drinkBottle: (id) => call('POST', `/bottles/${id}/drink`)
};
