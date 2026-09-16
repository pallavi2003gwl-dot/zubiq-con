import { LayoutDashboard, Users, Inbox, TrendingUp, PhoneCall, Share2 } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/leads", label: "Leads", icon: Inbox },
  { href: "/upsell", label: "Upsell", icon: TrendingUp },
  { href: "/leads/conversion", label: "Conversion", icon: PhoneCall },
  { href: "/alignment", label: "Alignment", icon: Share2 },
] as const;
