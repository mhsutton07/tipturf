export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function todayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function platformLabel(platform: string): string {
  const labels: Record<string, string> = {
    uber_eats: 'Uber Eats',
    doordash: 'DoorDash',
    instacart: 'Instacart',
    grubhub: 'Grubhub',
    amazon_flex: 'Amazon Flex',
    shipt: 'Shipt',
    other: 'Other',
  };
  return labels[platform] ?? platform;
}

export function platformEmoji(platform: string): string {
  const icons: Record<string, string> = {
    uber_eats: 'UE',
    doordash: 'DD',
    instacart: 'IC',
    grubhub: 'GH',
    amazon_flex: 'AF',
    shipt: 'SH',
    other: '??',
  };
  return icons[platform] ?? '??';
}
