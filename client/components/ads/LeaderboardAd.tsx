import DisplayAd from './DisplayAd';

interface LeaderboardAdProps { className?: string; }

export default function LeaderboardAd({ className = '' }: LeaderboardAdProps) {
  return <DisplayAd size="728x90" className={className} />;
}
