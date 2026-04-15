import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PushPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

// Send push notification via Firebase Cloud Messaging
export async function sendPushNotification(payload: PushPayload): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { fcmToken: true },
  });
  if (!user?.fcmToken) return;

  // TODO: initialise firebase-admin and send via FCM
  // const message = { token: user.fcmToken, notification: { title: payload.title, body: payload.body }, data: payload.data };
  // await admin.messaging().send(message);
  console.log(`[Push → ${payload.userId}] ${payload.title}: ${payload.body}`);
}

// Notify commuters on a corridor that a sharer just opted in
export async function notifyCorridorCommutersOfNewSharer(
  _sharerId: string,
  _route: { polyline: string; points: { lat: number; lng: number }[] },
  _date: Date
): Promise<void> {
  // TODO: query commuter optins within buffer of route polyline
  // and send push: "Someone's heading your way — check the app"
  console.log('[Notification] Corridor commuters notified of new sharer');
}
