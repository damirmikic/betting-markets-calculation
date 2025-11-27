import { fetchSoccerLeagues, fetchOdds } from "./api.js";
import {
  refs,
  getSelectedValues,
  setStatus,
  setError,
  setUsage,
  toggleButtons,
  populateLeagueOptions,
  clearEvents,
  renderEventsForLeague,
} from "./dom.js";

init();

function init() {
  refs.btnFetchSoccer.addEventListener("click", handleFetchLeagues);
  refs.btnFetchOdds.addEventListener("click", handleFetchOdds);
}

async function handleFetchLeagues() {
  resetMessages();
  clearEvents();
  populateLeagueOptions([]);
  toggleButtons({ disableFetchOdds: true });

  const apiKey = refs.apiKeyInput.value.trim();
  if (!apiKey) {
    setError("Enter your API key first.");
    return;
  }

  toggleButtons({ disableFetchLeagues: true });
  setStatus("Fetching sports from /v4/sports ...");

  try {
    const leagues = await fetchSoccerLeagues(apiKey);

    if (!leagues.length) {
      setStatus("No soccer sports found.");
      return;
    }

    populateLeagueOptions(leagues);
    setStatus(`Loaded ${leagues.length} soccer leagues. Select one or more and click "Fetch events & odds".`);
    toggleButtons({ disableFetchOdds: false });
  } catch (error) {
    console.error(error);
    setError(`Error fetching soccer leagues: ${error.message}`);
  } finally {
    toggleButtons({ disableFetchLeagues: false });
  }
}

async function handleFetchOdds() {
  resetMessages();
  clearEvents();

  const apiKey = refs.apiKeyInput.value.trim();
  if (!apiKey) {
    setError("Enter your API key first.");
    return;
  }

  const leagueKeys = getSelectedValues(refs.leagueSelect);
  if (!leagueKeys.length) {
    setError("Select at least one soccer league.");
    return;
  }

  const regions = getSelectedValues(refs.regionsSelect);
  const markets = getSelectedValues(refs.marketsSelect);
  const oddsFormat = refs.oddsFormatSelect.value;

  const regionsParam = regions.length ? regions.join(",") : "eu";
  const marketsParam = markets.length ? markets.join(",") : "h2h_3_way";

  toggleButtons({ disableFetchLeagues: true, disableFetchOdds: true });

  setStatus(`Fetching odds for ${leagueKeys.length} league(s)...`);
  let totalEvents = 0;
  let usageUsed = null;
  let usageRemaining = null;

  try {
    for (const sportKey of leagueKeys) {
      setStatus(`Fetching odds for ${sportKey} ...`);

      const { events, usage } = await fetchOdds({
        apiKey,
        sportKey,
        regions: regionsParam,
        markets: marketsParam,
        oddsFormat,
      });

      if (usage.used !== null) usageUsed = usage.used;
      if (usage.remaining !== null) usageRemaining = usage.remaining;

      totalEvents += events.length;
      renderEventsForLeague(sportKey, events, oddsFormat);
    }

    setStatus(`Done. Loaded ${totalEvents} event(s) across ${leagueKeys.length} league(s).`);
    setUsage(usageUsed, usageRemaining);
  } catch (error) {
    console.error(error);
    setError(`Error fetching odds: ${error.message}`);
  } finally {
    toggleButtons({ disableFetchLeagues: false, disableFetchOdds: false });
  }
}

function resetMessages() {
  setStatus("");
  setError("");
  setUsage();
}
