// __TITLE__: logic that does not touch the DOM, so tests can exercise it against Luna.MockEngine.
//
// Everything here takes SDK objects (a Luna.Session, a Luna.Track) and returns plain data or
// performs an engine action. main.js turns the data into DOM. Keep it that way and the tests
// stay fast and LUNA-free.

const AddOnLogic = {
  /** Text for the transport counter. */
  locationText(transport) {
    return Luna.formatBarBeat(transport.location.value?.bar_beat);
  },

  /** One row of the track list. */
  trackRow(track) {
    return {
      id: track.id,
      name: track.name.value ?? track.id,
      gain: track.gain.display.value ?? '',
      muted: track.mute.on,
      soloed: track.solo.on,
    };
  },

  /** Rows for every user-visible track, in LUNA's order. */
  rows(session) {
    return session.visibleTracks.map((t) => AddOnLogic.trackRow(t));
  },

  /** Example action: mute every track except one, as a single undo step. */
  async soloByMuting(session, keepTrackId) {
    await session.transaction('Solo by muting', async () => {
      for (const t of session.visibleTracks) {
        const shouldMute = t.id !== keepTrackId;
        if (t.mute.on !== shouldMute) await t.mute.real.set(shouldMute);
      }
    });
  },
};

globalThis.AddOnLogic = AddOnLogic;
