export async function sendPushNotification(input: {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<void> {
  if (input.tokens.length === 0) {
    throw new Error("No active device tokens available");
  }

  // Placeholder delivery implementation.
  // Replace with FCM/APNs provider call when credentials are configured.
  console.log("Push notification dispatched", {
    tokenCount: input.tokens.length,
    title: input.title,
    body: input.body,
    data: input.data,
  });
}
