// Coordenadas aproximadas del centro de cada distrito de Lima
export const DISTRICT_COORDINATES: Record<
  string,
  { lat: number; lng: number; name: string }
> = {
  // Lima Centro
  lima: { lat: -12.0464, lng: -77.0428, name: "Lima" },
  cercado_lima: { lat: -12.0464, lng: -77.0428, name: "Cercado de Lima" },

  // Lima Moderna
  miraflores: { lat: -12.1197, lng: -77.0283, name: "Miraflores" },
  san_isidro: { lat: -12.0968, lng: -77.0353, name: "San Isidro" },
  surco: { lat: -12.1469, lng: -76.9947, name: "Santiago de Surco" },
  la_molina: { lat: -12.0797, lng: -76.9403, name: "La Molina" },
  san_borja: { lat: -12.092, lng: -77.0053, name: "San Borja" },
  barranco: { lat: -12.1467, lng: -77.0205, name: "Barranco" },
  magdalena: { lat: -12.0917, lng: -77.0736, name: "Magdalena del Mar" },
  pueblo_libre: { lat: -12.0764, lng: -77.0631, name: "Pueblo Libre" },
  jesus_maria: { lat: -12.0725, lng: -77.0436, name: "Jesús María" },
  lince: { lat: -12.0844, lng: -77.0339, name: "Lince" },
  san_miguel: { lat: -12.0775, lng: -77.0861, name: "San Miguel" },

  // Lima Norte
  los_olivos: { lat: -11.9617, lng: -77.0719, name: "Los Olivos" },
  san_martin_porres: {
    lat: -12.0131,
    lng: -77.0794,
    name: "San Martín de Porres",
  },
  independencia: { lat: -11.9933, lng: -77.0531, name: "Independencia" },
  comas: { lat: -11.9389, lng: -77.0533, name: "Comas" },
  carabayllo: { lat: -11.8653, lng: -77.0428, name: "Carabayllo" },
  puente_piedra: { lat: -11.8586, lng: -77.0731, name: "Puente Piedra" },
  ancon: { lat: -11.7372, lng: -77.1761, name: "Ancón" },
  santa_rosa: { lat: -11.795, lng: -77.1644, name: "Santa Rosa" },

  // Lima Este
  ate: { lat: -12.0464, lng: -76.9047, name: "Ate" },
  san_juan_lurigancho: {
    lat: -11.9842,
    lng: -77.0131,
    name: "San Juan de Lurigancho",
  },
  lurigancho: { lat: -11.9719, lng: -76.7442, name: "Lurigancho" },
  el_agustino: { lat: -12.0439, lng: -77.0069, name: "El Agustino" },
  santa_anita: { lat: -12.045, lng: -76.9689, name: "Santa Anita" },
  chaclacayo: { lat: -11.9736, lng: -76.765, name: "Chaclacayo" },
  cieneguilla: { lat: -12.0947, lng: -76.8189, name: "Cieneguilla" },

  // Lima Sur
  chorrillos: { lat: -12.1686, lng: -77.0117, name: "Chorrillos" },
  san_juan_miraflores: {
    lat: -12.1569,
    lng: -76.9739,
    name: "San Juan de Miraflores",
  },
  villa_el_salvador: {
    lat: -12.2042,
    lng: -76.9392,
    name: "Villa El Salvador",
  },
  villa_maria_triunfo: {
    lat: -12.1608,
    lng: -76.9339,
    name: "Villa María del Triunfo",
  },
  lurin: { lat: -12.2744, lng: -76.8728, name: "Lurín" },
  pachacamac: { lat: -12.2492, lng: -76.8644, name: "Pachacamac" },
  pucusana: { lat: -12.4781, lng: -76.7994, name: "Pucusana" },
  punta_hermosa: { lat: -12.3347, lng: -76.8228, name: "Punta Hermosa" },
  punta_negra: { lat: -12.3614, lng: -76.7989, name: "Punta Negra" },
  san_bartolo: { lat: -12.3911, lng: -76.7772, name: "San Bartolo" },
  santa_maria: { lat: -12.405, lng: -76.765, name: "Santa María del Mar" },

  // Otros
  breña: { lat: -12.0594, lng: -77.0497, name: "Breña" },
  la_victoria: { lat: -12.0686, lng: -77.0197, name: "La Victoria" },
  rimac: { lat: -12.0367, lng: -77.0414, name: "Rímac" },
  surquillo: { lat: -12.1133, lng: -77.0194, name: "Surquillo" },
  san_luis: { lat: -12.0744, lng: -76.9969, name: "San Luis" },
};

// Función helper para buscar por ID o nombre
export const getDistrictCoordinates = (
  districtName: string,
): { lat: number; lng: number } | null => {
  // Normalizar el ID (convertir a lowercase y quitar espacios)
  const normalizedId = districtName.toLowerCase().replace(/\s+/g, "_");

  // Buscar en el objeto
  const coords = DISTRICT_COORDINATES[normalizedId];

  if (coords) {
    return { lat: coords.lat, lng: coords.lng };
  }

  // Si no encuentra, intentar buscar por nombre similar
  const foundEntry = Object.entries(DISTRICT_COORDINATES).find(
    ([_, value]) => value.name.toLowerCase() === districtName.toLowerCase(),
  );

  if (foundEntry) {
    return { lat: foundEntry[1].lat, lng: foundEntry[1].lng };
  }

  return null;
};
