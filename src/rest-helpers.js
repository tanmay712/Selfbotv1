// [REST-HELPERS] Thin wrappers over discord.js-selfbot-v13's REST for
// operations the lib doesn't expose convenience methods for (e.g. vanity URL).
// Works by reaching into the internal REST/API the same way discord.js itself
// does for other guild edits.

async function guildPatch(client, guildId, body) {
  // discord.js-selfbot-v13 uses client.api.guilds[guildId].patch({data})
  if (!client || !client.api) throw new Error('client.api unavailable');
  return client.api.guilds[guildId].patch({ data: body });
}

// Set vanity URL code (requires guild to have vanity feature unlocked, i.e.
// enough boosts). Returns {ok:true} or {ok:false, error}.
async function setVanityCode(client, guildId, code) {
  try {
    if (!client || !client.api) throw new Error('client.api unavailable');
    // Discord API: PATCH /guilds/{guild.id}/vanity-url  { code }
    await client.api.guilds[guildId]['vanity-url'].patch({ data: { code } });
    return { ok: true };
  } catch (e) {
    // Try the fallback endpoint shape used in older API versions
    try {
      await guildPatch(client, guildId, { vanity_url_code: code });
      return { ok: true };
    } catch (e2) {
      return { ok: false, error: e.message || String(e) };
    }
  }
}

// Fetch vanity code via client.api if the convenience method fails
async function fetchVanity(client, guildId) {
  try {
    const data = await client.api.guilds[guildId]['vanity-url'].get();
    return { ok: true, code: data?.code || null, uses: data?.uses ?? 0 };
  } catch (e) {
    return { ok: false, error: e.message || String(e) };
  }
}

module.exports = { guildPatch, setVanityCode, fetchVanity };
