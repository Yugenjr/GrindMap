/**
 * Utility functions for handling timezone conversions
 */

class TimezoneUtil {
  /**
   * Convert time from one timezone to another
   * @param {Date} dateTime - The date/time to convert
   * @param {string} fromTz - Source timezone (e.g., 'Asia/Kolkata', 'America/New_York')
   * @param {string} toTz - Target timezone
   * @returns {Date} - Converted date/time
   */
  static convertTimezone(dateTime, fromTz, toTz) {
    // Create a date in the source timezone
    const sourceTime = new Date(dateTime.toLocaleString("en-US", { timeZone: fromTz }));
    
    // Convert to target timezone
    const targetTime = new Date(
      dateTime.toLocaleString("en-US", { timeZone: toTz })
    );
    
    // More accurate conversion using UTC as intermediate
    const utc = dateTime.getTime() + (dateTime.getTimezoneOffset() * 60000);
    const targetDateTime = new Date(utc + this.getTimezoneOffset(toTz));
    
    return targetDateTime;
  }

  /**
   * Get timezone offset in milliseconds
   * @param {string} timezone - Timezone identifier
   * @returns {number} - Offset in milliseconds
   */
  static getTimezoneOffset(timezone) {
    const date = new Date();
    const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
    const tzDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
    return tzDate.getTime() - utcDate.getTime();
  }

  /**
   * Format time with timezone
   * @param {Date} date - Date to format
   * @param {string} timezone - Timezone identifier
   * @returns {Object} - Formatted time object with readable strings
   */
  static formatTimeWithTimezone(date, timezone) {
    const options = {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(date);
    
    const formatted = {
      datetime: formatter.format(date),
      timezone: timezone,
      date: parts.filter(p => ['year', 'month', 'day'].includes(p.type)).map(p => p.value).join('-'),
      time: parts.filter(p => ['hour', 'minute', 'second'].includes(p.type)).map(p => p.value).join(':'),
      hour12: parts.some(p => p.type === 'dayPeriod') ? parts.find(p => p.type === 'dayPeriod').value : ''
    };
    
    return formatted;
  }

  /**
   * Convert time string to Date object considering timezone
   * @param {string} dateString - Date string
   * @param {string} timeString - Time string in HH:MM format
   * @param {string} timezone - Timezone identifier
   * @returns {Date} - Date object with timezone consideration
   */
  static createDateTimeInTimezone(dateString, timeString, timezone) {
    const [year, month, day] = dateString.split('-').map(Number);
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Create a date object in the specified timezone
    const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
    
    // Adjust for timezone offset
    const tzOffset = this.getTimezoneOffset(timezone);
    return new Date(date.getTime() - tzOffset);
  }

  /**
   * Check if a time slot is available for booking
   * @param {Date} bookingDate - Date to check
   * @param {string} startTime - Start time in HH:MM format
   * @param {string} endTime - End time in HH:MM format
   * @param {string} timezone - Timezone identifier
   * @returns {boolean} - Whether the time slot is available
   */
  static isTimeSlotAvailable(bookingDate, startTime, endTime, timezone) {
    // Convert the booking date and time to the specified timezone
    const bookingDateTime = this.createDateTimeInTimezone(
      bookingDate.toISOString().split('T')[0],
      startTime,
      timezone
    );
    
    const endDate = this.createDateTimeInTimezone(
      bookingDate.toISOString().split('T')[0],
      endTime,
      timezone
    );
    
    // Check if the current time falls within the time slot
    const now = new Date();
    return now >= bookingDateTime && now <= endDate;
  }

  /**
   * Get all timezones with their abbreviations
   * @returns {Array} - Array of timezone objects
   */
  static getAllTimezones() {
    return [
      { name: 'UTC', abbreviation: 'UTC', offset: '+00:00' },
      { name: 'Asia/Kolkata', abbreviation: 'IST', offset: '+05:30' },
      { name: 'Europe/London', abbreviation: 'GMT', offset: '+00:00' },
      { name: 'America/New_York', abbreviation: 'EST', offset: '-05:00' },
      { name: 'America/Los_Angeles', abbreviation: 'PST', offset: '-08:00' },
      { name: 'Asia/Tokyo', abbreviation: 'JST', offset: '+09:00' },
      { name: 'Australia/Sydney', abbreviation: 'AEST', offset: '+10:00' },
      { name: 'Europe/Berlin', abbreviation: 'CET', offset: '+01:00' },
      { name: 'Asia/Dubai', abbreviation: 'GST', offset: '+04:00' },
      { name: 'Asia/Singapore', abbreviation: 'SGT', offset: '+08:00' }
    ];
  }
}

export default TimezoneUtil;