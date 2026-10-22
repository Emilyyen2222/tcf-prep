/**
 * 用瀏覽器內建語音念法文。Mac / iPhone 的 Safari、Chrome 都有法語聲音
 * （Thomas、Amélie 等）；找不到 fr 聲音時會退回預設聲音。
 */
export function useSpeech() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const speaking = ref(false)
  const voice = ref<SpeechSynthesisVoice | null>(null)

  function pickVoice() {
    if (!supported) return
    const voices = window.speechSynthesis.getVoices()
    voice.value =
      voices.find((v) => v.lang === 'fr-FR' && /premium|enhanced|amélie|thomas/i.test(v.name)) ||
      voices.find((v) => v.lang === 'fr-FR') ||
      voices.find((v) => v.lang.startsWith('fr')) ||
      null
  }

  if (supported) {
    pickVoice()
    window.speechSynthesis.onvoiceschanged = pickVoice
  }

  function speak(text: string, rate = 0.9) {
    if (!supported) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'fr-FR'
    if (voice.value) u.voice = voice.value
    u.rate = rate
    u.onstart = () => (speaking.value = true)
    u.onend = () => (speaking.value = false)
    u.onerror = () => (speaking.value = false)
    window.speechSynthesis.speak(u)
  }

  function stop() {
    if (supported) window.speechSynthesis.cancel()
    speaking.value = false
  }

  onBeforeUnmount(stop)

  return { supported, speaking, voice, speak, stop }
}
