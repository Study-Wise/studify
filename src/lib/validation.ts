export default function isValidEmail(email: string | null | undefined): boolean {
    if (!email) return true; // Allow null/undefined emails
    return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
}