import { ENV } from "./env";

type Notification = { title: string; content: string };

export async function notifyOwner(
  notification: Notification
): Promise<boolean> {
  const endpoint = process.env.NOTIFICATION_WEBHOOK_URL;
  if (!endpoint) {
    console.info(
      `[SAKINA notification] ${notification.title}\n${notification.content}`
    );
    return false;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...notification, ownerOpenId: ENV.ownerOpenId }),
  });
  return response.ok;
}
