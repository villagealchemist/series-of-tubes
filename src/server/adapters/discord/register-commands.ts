import { loadDiscordRegistrationConfig } from "../../config/environment.js";
import { discordCommandManifest } from "./command-manifest.js";

async function main(): Promise<void> {
  const config = loadDiscordRegistrationConfig();
  const response = await fetch(
    `https://discord.com/api/v10/applications/${encodeURIComponent(config.discordApplicationId)}/guilds/${encodeURIComponent(config.developmentGuildId)}/commands`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bot ${config.discordBotToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(discordCommandManifest),
    },
  );
  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `Discord command registration failed with status ${response.status}: ${responseText.slice(0, 500)}`,
    );
  }

  const body: unknown = JSON.parse(responseText);
  if (!Array.isArray(body)) {
    throw new Error("Discord command registration returned an invalid body.");
  }

  console.log(`Registered ${body.length} development guild commands.`);
}

void main().catch((error: unknown) => {
  console.error("Discord command registration failed.", error);
  process.exitCode = 1;
});
