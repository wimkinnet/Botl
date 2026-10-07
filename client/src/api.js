async function call(method, url, body) {
  const res = await fetch('/api' + url, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
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
  addBottles: (body) => call('POST', '/bottles', body),
  updateBottle: (id, body) => call('PATCH', `/bottles/${id}`, body),
  moveBottle: (id, slot) => call('POST', `/bottles/${id}/move`, { slot }),
  drinkBottle: (id) => call('POST', `/bottles/${id}/drink`)
};
