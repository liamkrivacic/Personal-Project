export type DetectorReading = {
  /** tinySA output level at 2.45 GHz. */
  dbm: number;
  /** Settled multimeter reading on the detector VOUT header. */
  volts: number;
};

/** AD8317 V2 board bench test, readings taken from the test video. */
export const detectorReadings: DetectorReading[] = [
  { dbm: -48.5, volts: 1.2805 },
  { dbm: -38.5, volts: 1.0335 },
  { dbm: -28.5, volts: 0.8003 },
  { dbm: -18.5, volts: 0.6549 },
];

/** AD8317 data sheet typical transfer function at 2.2 GHz, the closest specified frequency. */
export const ad8317Datasheet = {
  label: "Datasheet (2.2 GHz typ.)",
  slopeVoltsPerDb: -0.022,
  interceptDbm: 14,
};
