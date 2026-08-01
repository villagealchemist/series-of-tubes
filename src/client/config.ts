export interface VillageAlchemistConfig {
  readonly email: string;
}

declare global {
  interface Window {
    VILLAGE_ALCHEMIST_CONFIG?: VillageAlchemistConfig;
  }
}

const villageAlchemistConfig = {
  email: "mj@villagealchemist.com",
} satisfies VillageAlchemistConfig;

window.VILLAGE_ALCHEMIST_CONFIG = Object.freeze(villageAlchemistConfig);
