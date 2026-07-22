export function getCaracasDateString(date: Date = new Date()): string {
  const formatted = date.toLocaleString("en-US", { 
    timeZone: "America/Caracas", 
    year: "numeric", 
    month: "2-digit", 
    day: "2-digit" 
  });
  const [month, day, year] = formatted.split("/");
  return `${year}-${month}-${day}`;
}

export function getCaracasTodayBounds() {
  const dateString = getCaracasDateString();
  return getCaracasBoundsForDate(dateString);
}

export function getCaracasBoundsForDate(dateString: string) {
  const inicio = new Date(`${dateString}T00:00:00.000-04:00`);
  const fin = new Date(`${dateString}T23:59:59.999-04:00`);
  return { inicio, fin };
}

export function subtractDaysCaracas(days: number): string {
  const caracasString = getCaracasDateString();
  const dateObj = new Date(`${caracasString}T12:00:00.000Z`); 
  dateObj.setUTCDate(dateObj.getUTCDate() - days);
  
  const year = dateObj.getUTCFullYear();
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCaracasThisMonthBounds() {
  const dateString = getCaracasDateString();
  const [year, month] = dateString.split("-");
  
  const inicio = new Date(`${year}-${month}-01T00:00:00.000-04:00`);
  
  const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
  const yearOfNextMonth = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
  const lastDayObj = new Date(Date.UTC(yearOfNextMonth, nextMonth - 1, 0));
  const lastDay = String(lastDayObj.getUTCDate()).padStart(2, '0');
  
  const fin = new Date(`${year}-${month}-${lastDay}T23:59:59.999-04:00`);
  
  return { inicio, fin };
}

export function formatToCaracasDateString(date: Date): string {
  return getCaracasDateString(date);
}
