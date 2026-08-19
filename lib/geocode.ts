// lib/geocode.ts

interface Coords {
  lat: number
  lng: number
}

// In-memory cache so we don't re-fetch on re-renders
const cache = new Map<string, Coords | null>()

export async function geocodeLocation(location: string): Promise<Coords | null> {
  const key = location.trim().toLowerCase()
  if (cache.has(key)) return cache.get(key)!

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`

    const res  = await fetch(url, {
      headers: {
        // Nominatim requires a User-Agent
        'User-Agent': 'MyApp/1.0 (myemail@example.com)',
      },
    })

    const data = await res.json()

    if (!data.length) {
      cache.set(key, null)
      return null
    }

    const coords: Coords = {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    }

    cache.set(key, coords)
    return coords
  } catch {
    cache.set(key, null)
    return null
  }
}
