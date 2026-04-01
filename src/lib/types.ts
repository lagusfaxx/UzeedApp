export type User = {
  id: string;
  email: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  phone: string | null;
  gender: string | null;
  profileType: string | null;
  role: string;
  city: string | null;
  address: string | null;
  serviceCategory: string | null;
  serviceDescription: string | null;
  isActive: boolean;
  isOnline: boolean;
  isVerified: boolean;
  membershipExpiresAt: string | null;
  createdAt: string;
};

export type WalletData = {
  balance: number;
  heldBalance: number;
  totalEarned: number;
  totalSpent: number;
  tokenRateClp: number;
};

export type TokenTransaction = {
  id: string;
  type: string;
  amount: number;
  balance: number;
  description: string | null;
  createdAt: string;
};

export type Conversation = {
  other: {
    id: string;
    displayName: string | null;
    username: string | null;
    avatarUrl: string | null;
    profileType: string | null;
    city: string | null;
  };
  lastMessage: Message;
  unreadCount: number;
};

export type Message = {
  id: string;
  fromId: string;
  toId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
};

export type LiveStream = {
  id: string;
  hostId: string;
  title: string | null;
  isActive: boolean;
  viewerCount: number;
  maxViewers: number;
  privateShowPrice: number;
  startedAt: string;
  host?: {
    id: string;
    displayName: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
};

export type VideocallBooking = {
  id: string;
  clientId: string;
  professionalId: string;
  scheduledAt: string;
  durationMinutes: number;
  totalTokens: number;
  roomId: string | null;
  status: string;
  professional?: {
    id: string;
    displayName: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
  client?: {
    id: string;
    displayName: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
};
