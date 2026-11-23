export function formatDistance(meters: number): string {
  if (isNaN(meters) || meters <= 0) return '0 m';
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  return `${km.toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '0 mnt';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} mnt`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours} jam ${remainingMinutes} mnt` : `${hours} jam`;
}

export function formatSpeed(kmh: number): string {
  return `${Math.round(kmh)} km/j`;
}

export function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '-';
  }
}

