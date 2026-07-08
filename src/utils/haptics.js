export function hapticLight() {
  try {
    if (navigator.vibrate) navigator.vibrate(10);
  } catch (e) {}
}

export function hapticMedium() {
  try {
    if (navigator.vibrate) navigator.vibrate(20);
  } catch (e) {}
}

export function hapticHeavy() {
  try {
    if (navigator.vibrate) navigator.vibrate(40);
  } catch (e) {}
}

export function hapticSuccess() {
  try {
    if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
  } catch (e) {}
}
