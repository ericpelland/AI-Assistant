// Set the default settings for the OpenAI API call
let defaultSettings = {
    model: "text-davinci-003",
    temperature: 0.7,
    max_tokens: 256,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    api_key: ''
}

let settings = { ...defaultSettings }

const gebid = (id) => {
    return document.getElementById(id)
}

const setSettingsInputValues = () => {
    gebid("model").value = settings.model
    gebid("temperature").value = settings.temperature
    gebid("max_tokens").value = settings.max_tokens
    gebid("top_p").value = settings.top_p
    gebid("frequency_penalty").value = settings.frequency_penalty
    gebid("presence_penalty").value = settings.presence_penalty
    gebid("api_key").value = settings.api_key
}

const handleSettingsLoaded = (storageResult) => {
    if (storageResult.settings) {
        settings = storageResult.settings
    }
    // Set the default settings in the UI
    setSettingsInputValues()
}

const resetSettings = () => {
    settings = { ...defaultSettings, ...{ api_key: settings.api_key } }
    setSettingsInputValues()
    chrome.runtime.sendMessage(settings)
    chrome.storage.sync.set({ settings: settings })
}

const updateSettings = (form) => {
    // Get the values of the form fields
    settings.model = form.elements.model.value
    settings.temperature = form.elements.temperature.value
    settings.max_tokens = form.elements.max_tokens.value
    settings.top_p = form.elements.top_p.value
    settings.frequency_penalty = form.elements.frequency_penalty.value
    settings.presence_penalty = form.elements.presence_penalty.value
    settings.api_key = form.elements.api_key.value

    // Send a message to the background script with the form field values
    chrome.runtime.sendMessage(settings)
    chrome.storage.sync.set({ settings: settings })
}

const handleSettingsSaveEvent = (event) => {
    event.preventDefault()
    updateSettings(gebid("settings-form"))
}

const handleChatSubmiittion = () => {
    // Get the text from the textarea
    let textArea = gebid('text-area')
    textArea.value += "\n" + gebid('text-input').value + "\n"
    gebid('text-input').value = ""
    textArea.scrollTop = textArea.scrollHeight

    // Send the text to the background script
    chrome.runtime.sendMessage({ prompt: textArea.value })
}

const messageHandler = (message, sender, sendResponse) => {
    if (message.type === 'prompt-response') {
        // Update the text in the textarea
        let textArea = gebid('text-area')
        textArea.value += message.data + "\n"
        textArea.scrollTop = textArea.scrollHeight
    }
}

const handleKeydownEvent = (event) => {
    if (event.code === 'Enter') {
        handleChatSubmiittion()
    }
}


chrome.storage.sync.get("settings", handleSettingsLoaded)

gebid("settings-form").addEventListener("submit", handleSettingsSaveEvent)

gebid("reset").addEventListener("click", resetSettings)

chrome.runtime.onMessage.addListener(messageHandler)

gebid('text-input').addEventListener('keydown', handleKeydownEvent)