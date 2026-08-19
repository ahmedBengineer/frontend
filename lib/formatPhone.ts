import { parsePhoneNumberFromString } from "libphonenumber-js"

export function formatPhone(number?: string): string {
  if (!number) return "Unknown"
  try {
    const phoneNumber = parsePhoneNumberFromString(number)
    return phoneNumber ? phoneNumber.formatInternational() : number
  } catch {
    return number
  }
}
