export function generateApiKey(userId: number): string {
    return Bun.hash(`${userId}-${Date.now()}-${Math.random()}`).toString();
}
