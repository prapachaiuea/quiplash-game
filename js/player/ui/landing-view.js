import { joinRoom, getRoomIdFromUrl } from "../room.js";
import { getLastName } from "../../shared/utils/storage.js";
import { unlockAudio } from "../../shared/audio.js";
import { t } from "../../shared/i18n.js";

let initialized = false;

export function init() {
  if (initialized) return;
  initialized = true;

  const form = document.getElementById("form-landing");
  const errorEl = document.getElementById("landing-error");
  const inputName = document.getElementById("input-name");
  const inputCode = document.getElementById("input-room-code");

  const lastName = getLastName();
  if (lastName) inputName.value = lastName;

  const roomFromUrl = getRoomIdFromUrl();
  if (roomFromUrl) {
    document.getElementById("landing-join-row").hidden = false;
    document.getElementById("landing-join-row").textContent = t("player.joiningRoom", { code: roomFromUrl });
    document.getElementById("landing-code-row").hidden = true;
    inputCode.required = false;
  }

  form.addEventListener("submit", async (e) => {
    unlockAudio();
    e.preventDefault();
    const name = inputName.value.trim();
    const code = (roomFromUrl || inputCode.value.trim()).toUpperCase();
    if (!name || !code) return;
    errorEl.hidden = true;

    const submitBtn = form.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    try {
      await joinRoom(code, name);
    } catch (err) {
      const messages = {
        ROOM_NOT_FOUND: t("player.errorRoomNotFound"),
        ROOM_IN_PROGRESS: t("player.errorRoomInProgress"),
      };
      errorEl.textContent = messages[err.message] || t("player.errorGeneric");
      errorEl.hidden = false;
    } finally {
      submitBtn.disabled = false;
    }
  });
}

export function render() {}
