export const discordCommandManifest = [
  {
    name: "aapi-status",
    description: "Check whether the AAPI Discord arm is awake.",
    type: 1,
    integration_types: [0],
    contexts: [0],
  },
  {
    name: "catch-up",
    description: "Summarize recent activity in this channel for MJ.",
    type: 1,
    integration_types: [0],
    contexts: [0],
    options: [
      {
        name: "limit",
        description: "Number of recent messages to inspect.",
        type: 4,
        required: false,
        min_value: 10,
        max_value: 100,
      },
    ],
  },
] as const;
