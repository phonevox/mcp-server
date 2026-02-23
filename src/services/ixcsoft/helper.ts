import type { Context } from "@/context/provider";
import { db } from "@/database";
import { IxcSoftClient } from "@/services/ixcsoft/client";

export async function createIxcSoftClient(context: Context): Promise<IxcSoftClient> {
	const settings = await db.Integrations.findSettingsById(context.integrationId);

	if (!settings || settings.type !== "ixcsoft") {
		throw new Error(`Integration ${context.integrationId} is not a valid ixcsoft integration`);
	}

	if (!settings.config.base_url || !settings.config.token) {
		throw new Error(`Integration ${context.integrationId} is missing configuration`);
	}

	return new IxcSoftClient({ baseURL: settings.config.base_url, token: settings.config.token });
}
