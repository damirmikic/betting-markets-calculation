const refs = {
  apiKeyInput: document.getElementById("apiKey"),
  regionsSelect: document.getElementById("regions"),
  marketsSelect: document.getElementById("markets"),
  oddsFormatSelect: document.getElementById("oddsFormat"),
  leagueSelect: document.getElementById("leagueSelect"),
  btnFetchSoccer: document.getElementById("btnFetchSoccer"),
  btnFetchOdds: document.getElementById("btnFetchOdds"),
  statusDiv: document.getElementById("status"),
  errorDiv: document.getElementById("error"),
  usageDiv: document.getElementById("usage"),
  eventsDiv: document.getElementById("events"),
};

function getSelectedValues(selectEl) {
  return Array.from(selectEl.selectedOptions).map((option) => option.value);
}

function setStatus(message = "") {
  refs.statusDiv.textContent = message;
}

function setError(message = "") {
  refs.errorDiv.textContent = message;
}

function setUsage(used, remaining) {
  if (used != null && remaining != null) {
    refs.usageDiv.textContent = `API usage: used ${used} | remaining ${remaining}`;
    return;
  }
  refs.usageDiv.textContent = "";
}

function toggleButtons({ disableFetchLeagues, disableFetchOdds }) {
  if (disableFetchLeagues !== undefined) {
    refs.btnFetchSoccer.disabled = disableFetchLeagues;
  }
  if (disableFetchOdds !== undefined) {
    refs.btnFetchOdds.disabled = disableFetchOdds;
  }
}

function clearLeagues() {
  refs.leagueSelect.innerHTML = "";
}

function populateLeagueOptions(leagues) {
  clearLeagues();
  const fragment = document.createDocumentFragment();

  leagues.forEach((league) => {
    const option = document.createElement("option");
    option.value = league.key;
    option.textContent = `${league.title} (${league.key})`;
    fragment.appendChild(option);
  });

  refs.leagueSelect.appendChild(fragment);
}

function clearEvents() {
  refs.eventsDiv.innerHTML = "";
}

function renderEventsForLeague(sportKey, events, oddsFormat) {
  const leagueHeader = document.createElement("h3");
  leagueHeader.textContent = sportKey;
  leagueHeader.className = "small";
  refs.eventsDiv.appendChild(leagueHeader);

  if (!events.length) {
    const noEvents = document.createElement("p");
    noEvents.className = "small";
    noEvents.textContent = "No events returned for this league.";
    refs.eventsDiv.appendChild(noEvents);
    return;
  }

  events.forEach((event) => {
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = `${event.home_team} vs ${event.away_team}`;

    const meta = document.createElement("div");
    meta.className = "event-meta";
    meta.textContent = `ID: ${event.id} | Kickoff: ${formatKickoff(event.commence_time)}`;
    summary.appendChild(meta);

    details.appendChild(summary);
    details.appendChild(buildEventBody(event, oddsFormat));

    refs.eventsDiv.appendChild(details);
  });
}

function buildEventBody(event, oddsFormat) {
  const container = document.createElement("div");
  container.style.padding = "8px 12px 10px 12px";

  if (!event.bookmakers?.length) {
    const noBooks = document.createElement("p");
    noBooks.className = "small";
    noBooks.textContent = "No bookmakers data.";
    container.appendChild(noBooks);
    return container;
  }

  const pillRow = document.createElement("div");
  pillRow.className = "pill-row";
  event.bookmakers.forEach((book) => {
    const pill = document.createElement("span");
    pill.className = "pill";
    pill.textContent = book.title || book.key;
    pillRow.appendChild(pill);
  });
  container.appendChild(pillRow);

  event.bookmakers.forEach((book) => {
    const bookBlock = document.createElement("div");
    bookBlock.className = "book-block";

    const title = document.createElement("div");
    title.className = "small";
    title.innerHTML = `<strong>${book.title || book.key}</strong> <span class="badge">${book.key}</span>`;
    bookBlock.appendChild(title);

    const lastUpdate = document.createElement("div");
    lastUpdate.className = "small";
    lastUpdate.textContent = `Last update: ${book.last_update}`;
    bookBlock.appendChild(lastUpdate);

    if (!book.markets?.length) {
      const noMarkets = document.createElement("p");
      noMarkets.className = "small";
      noMarkets.textContent = "No markets.";
      bookBlock.appendChild(noMarkets);
    } else {
      book.markets.forEach((market) => {
        const marketTitle = document.createElement("div");
        marketTitle.className = "market-title";
        marketTitle.textContent = `Market: ${market.key}`;
        bookBlock.appendChild(marketTitle);

        if (!market.outcomes?.length) {
          const noOutcomes = document.createElement("p");
          noOutcomes.className = "small";
          noOutcomes.textContent = "No outcomes.";
          bookBlock.appendChild(noOutcomes);
          return;
        }

        const table = document.createElement("table");
        const thead = document.createElement("thead");
        const trHead = document.createElement("tr");
        ["Name", `Price (${oddsFormat})`, "Point"].forEach((heading) => {
          const th = document.createElement("th");
          th.textContent = heading;
          trHead.appendChild(th);
        });
        thead.appendChild(trHead);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        market.outcomes.forEach((outcome) => {
          const tr = document.createElement("tr");

          const nameCell = document.createElement("td");
          nameCell.textContent = outcome.name;
          tr.appendChild(nameCell);

          const priceCell = document.createElement("td");
          priceCell.textContent = outcome.price;
          tr.appendChild(priceCell);

          const pointCell = document.createElement("td");
          pointCell.textContent =
            outcome.point !== undefined && outcome.point !== null ? outcome.point : "";
          tr.appendChild(pointCell);

          tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        bookBlock.appendChild(table);
      });
    }

    container.appendChild(bookBlock);
  });

  return container;
}

function formatKickoff(commence) {
  try {
    if (!commence) return "";
    const parsed = new Date(commence);
    return parsed.toISOString().replace(".000Z", "Z");
  } catch (error) {
    return commence || "";
  }
}

export {
  refs,
  getSelectedValues,
  setStatus,
  setError,
  setUsage,
  toggleButtons,
  populateLeagueOptions,
  clearEvents,
  renderEventsForLeague,
};
