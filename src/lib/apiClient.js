// src/lib/apiClient.js

export async function fetchVolgendeKandidaat(categorie, riwaya) {
  try {
    const params = new URLSearchParams({ categorie, riwaya });
    const res = await fetch(`/api/kandidaten?${params.toString()}`);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Fout bij ophalen kandidaten:", errorText);
      return null;
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      console.warn("Geen geldige lijst ontvangen van kandidaten.");
      return null;
    }

    return data[0] || null;
  } catch (err) {
    console.error("Fout in fetchVolgendeKandidaat:", err);
    return null;
  }
}