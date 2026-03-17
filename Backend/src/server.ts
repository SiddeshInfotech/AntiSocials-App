import { app } from "./app";
import { env } from "./config/env";
import { startDecayJob } from "./jobs/decayJob";

app.listen(env.PORT, () => {
  startDecayJob();
  console.log(`AntiSocials backend running on port ${env.PORT}`);
});
