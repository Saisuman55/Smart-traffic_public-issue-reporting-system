// Basic offensive word filter — extend this list as needed
const OFFENSIVE_WORDS = [
  'fuck', 'shit', 'ass', 'bitch', 'bastard', 'damn', 'crap', 'piss',
  'dick', 'cock', 'pussy', 'whore', 'slut', 'nigger', 'nigga', 'faggot',
  'retard', 'idiot', 'stupid', 'moron', 'kill', 'rape', 'murder', 'hate',
  'terrorist', 'bomb', 'die', 'death', 'chutiya', 'madarchod', 'bhenchod',
  'gaandu', 'harami', 'randi', 'saala', 'kamina', 'bakwaas'
];

export function containsOffensiveContent(text: string): boolean {
  const lower = text.toLowerCase();
  return OFFENSIVE_WORDS.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lower);
  });
}

export function getOffensiveWords(text: string): string[] {
  const lower = text.toLowerCase();
  return OFFENSIVE_WORDS.filter(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lower);
  });
}
