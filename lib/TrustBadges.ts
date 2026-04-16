import { LucideIcon, Award, ShieldCheck, Zap, RefreshCw} from 'lucide-react';

export interface badges {
  icon : LucideIcon;
  text : string;
}

export const Trustbadges: badges[] = [
    { icon: Award,      text: 'Certificate of completion' },
    { icon: ShieldCheck, text: 'Secure & encrypted payment' },
    { icon: Zap,         text: 'Instant access after payment' },
    { icon: RefreshCw,   text: '24-hour refund policy' },
  ]
export interface iconsAndText{
  icon : LucideIcon;
  text : string
}