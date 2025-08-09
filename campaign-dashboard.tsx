"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Phone, Play, Pause, Eye, Rocket, Building2, Send, MessageCircle, TrendingUp, ChevronLeft, ChevronRight, Search, Home, BarChart3, Target, Bell, User, Linkedin, PhoneCall, Settings, ChevronsRightLeft, Mic, Paperclip, ChevronDown, X, CheckCircle, AlertTriangle, CreditCard } from 'lucide-react'

// ---------------- Types & Data ----------------

interface CampaignMetric {
  label: string
  value: string | number
  color?: string
}

type ChannelType = "email" | "phone" | "linkedin-outbound" | "linkedin-inbound"

interface Campaign {
  id: string
  name: string
  sequence: string
  status: "paused" | "draft" | "ideas" | "on-hold" | "in-progress"
  type: ChannelType
  metrics: CampaignMetric[]
  owner?: {
    name: string
    initials: string
  }
}

const campaigns: Campaign[] = [
  { id: "1", name: "Vibe Outbound Campaign", sequence: "SaaS Founders Nurture Sequence", status: "in-progress", type: "email", metrics: [{ label: "Outreach", value: "156" }, { label: "Engagements", value: "23" }, { label: "Interested", value: "8", color: "text-teal-600" }], owner: { name: "Sarah Chen", initials: "SC" } },
  { id: "2", name: "Outbound Campaign", sequence: "SaaS Founders Nurture Sequence", status: "on-hold", type: "email", metrics: [{ label: "Outreach", value: "342" }, { label: "Engagements", value: "48" }, { label: "Interested", value: "14", color: "text-teal-600" }], owner: { name: "Mike Johnson", initials: "MJ" } },
  { id: "3", name: "Vibe Outbound Campaign", sequence: "SaaS Founders Nurture Sequence", status: "draft", type: "phone", metrics: [{ label: "Contacts", value: "1,247" }, { label: "Companies", value: "89" }], owner: { name: "Alex Rivera", initials: "AR" } },
  { id: "4", name: "Enterprise Outreach", sequence: "Enterprise Decision Makers", status: "ideas", type: "email", metrics: [{ label: "Contacts", value: "1,247" }, { label: "Companies", value: "89" }] },
  { id: "5", name: "Product Demo Campaign", sequence: "Demo Request Follow-up", status: "in-progress", type: "email", metrics: [{ label: "Outreach", value: "289" }, { label: "Engagements", value: "67" }, { label: "Interested", value: "19", color: "text-teal-600" }], owner: { name: "Emma Davis", initials: "ED" } }
];

type NotificationType = "Updates" | "Leads" | "Blocker" | "Billing";

interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  cta: string;
  date: string;
}

const notifications: Notification[] = [
    { id: 1, type: "Updates", title: "First email sent: Vibe Outreach 🎉", body: "Your campaign: Vibe Outreach is live — first email delivered.", cta: "View Campaign", date: "5m ago" },
    { id: 2, type: "Updates", title: "First LinkedIn request sent: Enterprise Leads 🎉", body: "Your campaign: Enterprise Leads is live — first LinkedIn request sent.", cta: "View Campaign", date: "1h ago" },
    { id: 5, type: "Leads", title: "John Doe replied to your campaign (Vibe Outreach)", body: "“Thanks for reaching out, I'm interested in learning more…”", cta: "View in Inbox", date: "3h ago" },
    { id: 7, type: "Blocker", title: "Email campaign paused: Nurture Sequence", body: "Nurture Sequence has been paused. Investigate.", cta: "View Campaign", date: "1d ago" },
    { id: 9, type: "Leads", title: "⚠️ 5 tasks overdue 7 days", body: "Quick wins are slipping—follow up now.", cta: "View Overdue Tasks", date: "2d ago" },
    { id: 11, type: "Billing", title: "Account balance –$50.00", body: "All campaigns paused until you add funds.", cta: "Add funds", date: "3d ago" },
];


// ---------------- Config & Helpers ----------------

const statusConfig = {
  "in-progress": { color: "bg-blue-100 text-blue-800", icon: Play },
  "on-hold": { color: "bg-amber-100 text-amber-800", icon: Pause },
  paused: { color: "bg-gray-100 text-gray-800", icon: Pause },
  draft: { color: "bg-orange-100 text-orange-800", icon: Eye },
  ideas: { color: "bg-purple-100 text-purple-800", icon: TrendingUp },
};

const getActionButton = (status: Campaign["status"]) => {
  switch (status) {
    case "in-progress": return { label: "Pause", variant: "outline" as const, icon: Pause };
    case "on-hold": return { label: "Resume", variant: "default" as const, icon: Play };
    case "paused": return { label: "Resume", variant: "default" as const, icon: Play };
    case "draft": return { label: "Launch", variant: "default" as const, icon: Rocket };
    case "ideas": return { label: "Build", variant: "default" as const, icon: Building2 };
  }
};

function toNumber(n: string | number) {
  if (typeof n === "number") return n;
  return parseInt(n.replace(/,/g, ""), 10) || 0;
}

function formatAbbr(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

type MetricKey = "Outreach" | "Engagements" | "Interested";
const METRIC_KEYS: MetricKey[] = ["Outreach", "Engagements", "Interested"];

type ChannelKey = "Email" | "LinkedIn Messages" | "LinkedIn Posts" | "Dialer";

function channelLabelFromType(t: ChannelType): ChannelKey {
  if (t === "email") return "Email";
  if (t === "phone") return "Dialer";
  if (t === "linkedin-outbound") return "LinkedIn Messages";
  return "LinkedIn Posts";
}

function aggregateMetrics(data: Campaign[]) {
  const inProgressCampaigns = data.filter((c) => c.status === "in-progress");
  const inProgressCount = inProgressCampaigns.length;
  
  const inProgressByChannel: Record<ChannelKey, number> = {
    Email: 0, "LinkedIn Messages": 0, "LinkedIn Posts": 0, Dialer: 0
  };
  
  for (const c of inProgressCampaigns) {
    const ch = channelLabelFromType(c.type);
    inProgressByChannel[ch] += 1;
  }

  const totals: Record<MetricKey, { total: number; byChannel: Record<ChannelKey, number> }> = {
    Outreach: { total: 0, byChannel: { Email: 0, "LinkedIn Messages": 0, "LinkedIn Posts": 0, Dialer: 0 } },
    Engagements: { total: 0, byChannel: { Email: 0, "LinkedIn Messages": 0, "LinkedIn Posts": 0, Dialer: 0 } },
    Interested: { total: 0, byChannel: { Email: 0, "LinkedIn Messages": 0, "LinkedIn Posts": 0, Dialer: 0 } },
  };

  for (const c of data) {
    for (const k of METRIC_KEYS) {
      const m = c.metrics.find((mm) => mm.label === k);
      if (!m) continue;
      const val = toNumber(m.value);
      totals[k].total += val;
      const ch = channelLabelFromType(c.type);
      totals[k].byChannel[ch] += val;
    }
  }

  return { inProgressCount, inProgressByChannel, totals };
}

// ---------------- UI Primitives ----------------

function Sidebar() {
  return (
    <aside className="fixed left-4 top-1/2 -translate-y-1/2 z-20">
      <div className="bg-white/70 backdrop-blur-sm rounded-full p-2 shadow-lg border border-gray-200/80 flex flex-col items-center gap-2">
        <div className="p-2"><ChevronsRightLeft className="w-6 h-6 text-teal-600" /></div>
        <div className="w-full h-[1px] bg-gray-200" />
        <nav className="flex flex-col items-center gap-2">
          <a className="p-3 bg-teal-50 rounded-full text-teal-600" href="#"><Home className="w-5 h-5" /></a>
          <a className="p-3 hover:bg-gray-100 rounded-full text-gray-500" href="#"><BarChart3 className="w-5 h-5" /></a>
          <a className="p-3 hover:bg-gray-100 rounded-full text-gray-500" href="#"><Target className="w-5 h-5" /></a>
          <a className="p-3 hover:bg-gray-100 rounded-full text-gray-500" href="#"><Bell className="w-5 h-5" /></a>
        </nav>
        <div className="w-full h-[1px] bg-gray-200" />
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center text-purple-700 font-semibold">P</div>
          <a className="p-3 hover:bg-gray-100 rounded-full text-gray-500" href="#"><Settings className="w-5 h-5" /></a>
        </div>
      </div>
    </aside>
  );
}

function Header({ onNotificationClick }: { onNotificationClick: () => void }) {
  return (
    <header className="py-4 px-8 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome back! Here's what's happening with your campaigns.</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-full px-4 py-2 text-sm font-medium text-gray-700">Credits: 980</div>
        <Button onClick={onNotificationClick} variant="outline" size="icon" className="rounded-full bg-white/80 backdrop-blur-sm relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </Button>
      </div>
    </header>
  );
}

function StatCard({ title, value, icon: Icon, pillClass, breakdown, isExpanded, onToggleExpanded }: { title: string; value: string; icon: React.ComponentType<any>; pillClass: string; breakdown?: { label: ChannelKey; value: string; icon: React.ComponentType<any> }[]; isExpanded?: boolean; onToggleExpanded?: () => void }) {

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/80 shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg text-white ${pillClass}`}><Icon className="w-4 h-4" /></div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
              <p className="text-2xl leading-7 font-extrabold text-gray-900">{value}</p>
            </div>
          </div>
          {breakdown && (<button onClick={onToggleExpanded} className="p-1 text-gray-400 hover:text-gray-600"><ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} /></button>)}
        </div>
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-40 mt-3 pt-3 border-t border-gray-100/80' : 'max-h-0'}`}>
          <div className="space-y-2">
            {breakdown?.map((b) => (<div key={b.label} className="flex items-center justify-between text-xs"><div className="flex items-center gap-2 text-gray-600"><b.icon className="w-3.5 h-3.5 text-gray-400" /><span>{b.label}</span></div><span className="font-semibold text-gray-900">{b.value}</span></div>))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsRow() {
  const { inProgressCount, inProgressByChannel, totals } = aggregateMetrics(campaigns);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <section className="px-8 mb-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Live Campaigns" value={formatAbbr(inProgressCount)} icon={TrendingUp} pillClass="bg-blue-500" breakdown={[{ label: "Email", value: formatAbbr(inProgressByChannel.Email), icon: Mail }, { label: "LinkedIn Messages", value: formatAbbr(inProgressByChannel["LinkedIn Messages"]), icon: Linkedin }, { label: "LinkedIn Posts", value: "N/A", icon: Linkedin }, { label: "Dialer", value: "N/A", icon: PhoneCall }]} isExpanded={isExpanded} onToggleExpanded={toggleExpanded} />
        <StatCard title="Outreach" value={formatAbbr(totals.Outreach.total)} icon={Send} pillClass="bg-teal-500" breakdown={[{ label: "Email", value: formatAbbr(totals.Outreach.byChannel.Email), icon: Mail }, { label: "LinkedIn Messages", value: formatAbbr(totals.Outreach.byChannel["LinkedIn Messages"]), icon: Linkedin }, { label: "LinkedIn Posts", value: formatAbbr(totals.Outreach.byChannel["LinkedIn Posts"]), icon: Linkedin }, { label: "Dialer", value: formatAbbr(totals.Outreach.byChannel.Dialer), icon: PhoneCall }]} isExpanded={isExpanded} onToggleExpanded={toggleExpanded} />
        <StatCard title="Engagements" value={formatAbbr(totals.Engagements.total)} icon={MessageCircle} pillClass="bg-purple-500" breakdown={[{ label: "Email", value: formatAbbr(totals.Engagements.byChannel.Email), icon: Mail }, { label: "LinkedIn Messages", value: formatAbbr(totals.Engagements.byChannel["LinkedIn Messages"]), icon: Linkedin }, { label: "LinkedIn Posts", value: formatAbbr(totals.Engagements.byChannel["LinkedIn Posts"]), icon: Linkedin }, { label: "Dialer", value: formatAbbr(totals.Engagements.byChannel.Dialer), icon: PhoneCall }]} isExpanded={isExpanded} onToggleExpanded={toggleExpanded} />
        <StatCard title="Interested" value={formatAbbr(totals.Interested.total)} icon={Target} pillClass="bg-emerald-500" breakdown={[{ label: "Email", value: formatAbbr(totals.Interested.byChannel.Email), icon: Mail }, { label: "LinkedIn Messages", value: formatAbbr(totals.Interested.byChannel["LinkedIn Messages"]), icon: Linkedin }, { label: "LinkedIn Posts", value: formatAbbr(totals.Interested.byChannel["LinkedIn Posts"]), icon: Linkedin }, { label: "Dialer", value: formatAbbr(totals.Interested.byChannel.Dialer), icon: PhoneCall }]} isExpanded={isExpanded} onToggleExpanded={toggleExpanded} />
      </div>
    </section>
  );
}

function ChatBox() {
  const [message, setMessage] = useState("");
  return (
    <div className="text-center mb-12">
      <h2 className="text-4xl font-bold text-gray-800 mb-4">Who do you want to sell to?</h2>
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-gray-200/80 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center">
              <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What type of campaign would you like to build next?" className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-500 focus:outline-none" />
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-gray-500 cursor-pointer" />
                <Paperclip className="w-4 h-4 text-gray-500 cursor-pointer" />
                <Button size="icon" className="rounded-full bg-teal-600 hover:bg-teal-700 text-white w-8 h-8"><Send className="w-4 h-4" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const config = statusConfig[campaign.status];
  const actionButton = getActionButton(campaign.status);
  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200/80 rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg ${campaign.type === "email" ? "bg-teal-50" : "bg-blue-50"}`}>{campaign.type === "email" ? <Mail className="h-4 w-4 text-teal-600" /> : <Phone className="h-4 w-4 text-blue-600" />}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3 mb-2">
                <Badge variant="secondary" className={`${config.color} text-xs px-2 py-0.5 rounded-full font-medium`}><config.icon className="w-3 h-3 mr-1" />{campaign.status.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}</Badge>
                {campaign.owner && (<div className="flex items-center gap-2 text-xs text-gray-600"><div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center"><span className="text-xs font-medium text-gray-700">{campaign.owner.initials}</span></div><span className="font-medium">{campaign.owner.name}</span></div>)}
              </div>
              <h3 className="font-semibold text-gray-800 text-sm leading-tight mb-1">{campaign.name}</h3>
              <p className="text-xs text-gray-500 truncate">{campaign.sequence}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-4 mb-4">
          {campaign.metrics.map((metric, index) => (<div key={index} className="text-center"><div className={`text-lg font-semibold mb-0.5 ${metric.color || "text-gray-800"}`}>{metric.value}</div><div className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">{metric.label}</div></div>))}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-xs"><Eye className="w-3 h-3 mr-1" />Details</Button>
          <Button variant={actionButton.variant} size="sm" className={`flex-1 text-xs ${actionButton.variant === "default" ? "bg-teal-600 hover:bg-teal-700 text-white" : "border-gray-300 hover:bg-gray-100"}`}><actionButton.icon className="w-3 h-3 mr-1" />{actionButton.label}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationItem({ notification }: { notification: Notification }) {
    const typeConfig = {
        Updates: { icon: CheckCircle, color: "text-green-500" },
        Leads: { icon: MessageCircle, color: "text-blue-500" },
        Blocker: { icon: AlertTriangle, color: "text-yellow-500" },
        Billing: { icon: CreditCard, color: "text-red-500" },
    };
    const Icon = typeConfig[notification.type].icon;
    const color = typeConfig[notification.type].color;

    return (
        <div className="p-4 border-b border-gray-200/80">
            <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 mt-1 flex-shrink-0 ${color}`} />
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <p className="font-semibold text-sm text-gray-800 pr-4">{notification.title}</p>
                        <span className="text-xs text-gray-500 flex-shrink-0">{notification.date}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.body}</p>
                    <Button variant="link" className="p-0 h-auto mt-2 text-teal-600 text-sm">{notification.cta}</Button>
                </div>
            </div>
        </div>
    );
}

function NotificationDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    return (
        <>
            <div className={`fixed inset-0 bg-black/30 z-30 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
            <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white/80 backdrop-blur-sm shadow-2xl z-40 transform transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex items-center justify-between p-4 border-b border-gray-200/80">
                    <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
                </div>
                <div className="h-[calc(100%-57px)] overflow-y-auto">
                    {notifications.map(n => <NotificationItem key={n.id} notification={n} />)}
                </div>
            </div>
        </>
    );
}

// ---------------- Main ----------------

export default function CampaignDashboard() {
  const [selectedStatus, setSelectedStatus] = useState("ideas");
  
  const uniqueOwners = Array.from(new Set(campaigns.filter((c) => c.owner).map((c) => c.owner!.name)));
  const uniqueChannels = Array.from(new Set(campaigns.map((c) => c.type)));
  
  const [selectedOwner, setSelectedOwner] = useState<string>(uniqueOwners[0] || "");
  const [selectedChannel, setSelectedChannel] = useState<string>(uniqueChannels[0] || "");
  const [currentPage, setCurrentPage] = useState(1);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const itemsPerPage = 6;

  const filteredCampaigns = campaigns.filter(
    (campaign) =>
      (selectedStatus === "all" || campaign.status === selectedStatus) &&
      (campaign.owner?.name === selectedOwner) &&
      (campaign.type === selectedChannel)
  );
  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
  const paginatedCampaigns = filteredCampaigns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  const statusCounts = {
    ideas: campaigns.filter((c) => c.status === "ideas").length,
    draft: campaigns.filter((c) => c.status === "draft").length,
    "on-hold": campaigns.filter((c) => c.status === "on-hold").length,
    "in-progress": campaigns.filter((c) => c.status === "in-progress").length,
    all: campaigns.length,
  };
  const tabOrder = Object.keys(statusCounts) as (keyof typeof statusCounts)[];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/20 text-gray-800">
      <Sidebar />
      <main className="pl-24 pr-8">
        <Header onNotificationClick={() => setIsNotificationsOpen(true)} />
        <StatsRow />
        <ChatBox />
        <Card className="bg-white/70 backdrop-blur-sm shadow-xl border border-gray-200/80 rounded-2xl">
          <CardHeader className="p-4 border-b border-gray-200/80">
            <div className="flex items-center justify-between">
              <Tabs value={selectedStatus} onValueChange={(value) => setSelectedStatus(value)} className="flex-1">
                <TabsList className="bg-gray-100/80 p-1 rounded-lg">
                  {tabOrder.map((status) => (
                    <TabsTrigger key={status} value={status} className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md text-sm font-medium px-3 py-1">
                      {status.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{statusCounts[status]}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-2 ml-4">
                <select value={selectedOwner} onChange={(e) => setSelectedOwner(e.target.value)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                  {uniqueOwners.map((owner) => (<option key={owner} value={owner}>{owner}</option>))}
                </select>
                <select value={selectedChannel} onChange={(e) => setSelectedChannel(e.target.value)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                  {uniqueChannels.map((channel) => (<option key={channel} value={channel}>{channel.charAt(0).toUpperCase() + channel.slice(1)}</option>))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {paginatedCampaigns.map((campaign) => (<CampaignCard key={campaign.id} campaign={campaign} />))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4 border-t border-gray-200/80">
                <Button variant="ghost" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"><ChevronLeft className="w-4 h-4 mr-1" />Previous</Button>
                <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                <Button variant="ghost" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">Next<ChevronRight className="w-4 h-4 ml-1" /></Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <NotificationDrawer isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
    </div>
  );
}
