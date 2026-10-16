// __TITLE__: logic that does not touch the DOM, so tests can exercise it against Luna.MockEngine.
//
// Everything here takes SDK objects (a Luna.Session, a Luna.Track) and returns plain data or
// performs an engine action. main.ts turns the data into DOM. Keep it that way and the tests
// stay fast and LUNA-free.
//
// `Luna` is the global that vendor/luna.global.js defines; tsconfig.json types it through
// "@uaudio/luna-builder-sdk/global". Do not import the SDK here: the page already loads it.

export interface TrackRow {
  id: string;
  name: string;
  gain: string;
  muted: boolean;
  soloed: boolean;
}

/** Text for the transport counter. */
export function locationText(transport: Luna.Transport): string {
  return Luna.formatBarBeat(transport.location.value?.bar_beat);
}

/** One row of the track list. */
export function trackRow(track: Luna.Track): TrackRow {
  return {
    id: track.id,
    name: track.name.value ?? track.id,
    gain: track.gain.display.value ?? '',
    muted: track.mute.on,
    soloed: track.solo.on,
  };
}

/** Rows for every user-visible track, in LUNA's order. */
export function rows(session: Luna.Session): TrackRow[] {
  return session.visibleTracks.map((t) => trackRow(t));
}

/** Example action: mute every track except one, as a single undo step. */
export async function soloByMuting(session: Luna.Session, keepTrackId: string): Promise<void> {
  await session.transaction('Solo by muting', async () => {
    for (const t of session.visibleTracks) {
      const shouldMute = t.id !== keepTrackId;
      if (t.mute.on !== shouldMute) await t.mute.real.set(shouldMute);
    }
  });
}
