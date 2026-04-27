/** Copy an email to the clipboard and notify the global toast (see ContactCopyToast). */

export async function copyEmailToClipboard(email) {
  try {
    await navigator.clipboard.writeText(email);
    return true;
  } catch {
    const fallbackInput = document.createElement("textarea");
    fallbackInput.value = email;
    fallbackInput.setAttribute("readonly", "");
    fallbackInput.style.position = "fixed";
    fallbackInput.style.opacity = "0";
    fallbackInput.style.pointerEvents = "none";
    document.body.appendChild(fallbackInput);
    fallbackInput.focus();
    fallbackInput.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    document.body.removeChild(fallbackInput);
    return copied;
  }
}

export function notifyEmailCopiedToClipboard(email) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("clipboard-email-copied", { detail: { email } }));
}
