export async function loadSeed() {
  const res = await fetch('./data/seed.json');
  return await res.json();
}
